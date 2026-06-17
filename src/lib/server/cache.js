const cache = new Map();

/**
 * Get data from cache or fetch and cache it if not present/expired.
 * 
 * @template T
 * @param {string} key - Cache key.
 * @param {() => Promise<T>} fetchFn - Async function to fetch data.
 * @param {number} [ttlMs=15000] - TTL in milliseconds (default 15s).
 * @returns {Promise<T>} The cached or freshly fetched data.
 */
export async function cacheGet(key, fetchFn, ttlMs = 15000) {
	const now = Date.now();
	const cached = cache.get(key);

	if (cached && now - cached.timestamp < ttlMs) {
		return cached.data;
	}

	const data = await fetchFn();
	cache.set(key, {
		data,
		timestamp: Date.now()
	});
	return data;
}

/**
 * Invalidate a specific cache key.
 * 
 * @param {string} key - Cache key to delete.
 */
export function cacheInvalidate(key) {
	cache.delete(key);
}

/**
 * Invalidate all cache keys starting with a prefix.
 * 
 * @param {string} prefix - Key prefix to invalidate.
 */
export function cacheInvalidatePrefix(prefix) {
	for (const key of cache.keys()) {
		if (key.startsWith(prefix)) {
			cache.delete(key);
		}
	}
}
