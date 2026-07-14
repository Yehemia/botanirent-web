const cache = new Map();

/**
 * Get data from cache or fetch and cache it if not present/expired.
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetchFn
 * @param {number} [ttlMs=15000]
 * @returns {Promise<T>}
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
 * @param {string} key
 */
export function cacheInvalidate(key) {
	cache.delete(key);
}

/**
 * Invalidate all cache keys starting with a prefix.
 *
 * @param {string} prefix
 */
export function cacheInvalidatePrefix(prefix) {
	for (const key of cache.keys()) {
		if (key.startsWith(prefix)) {
			cache.delete(key);
		}
	}
}

/**
 * Invalidate all cached data related to layout counts and dashboard metrics.
 *
 * @param {string|null} branchId
 */
export function invalidateDashboardCache(branchId = null) {
	if (branchId) {
		cache.delete(`asset_status_counts_${branchId}`);
		cache.delete(`recent_transactions_${branchId}`);
		cache.delete(`active_rentals_count_${branchId}`);
		cache.delete(`washing_assets_${branchId}`);
		cache.delete(`maintenance_assets_${branchId}`);
		cache.delete(`customers_list_${branchId}`);
		cacheInvalidatePrefix(`unpaid_denda_count_`);
		cacheInvalidatePrefix(`transactions_for_revenue_${branchId}`);
		cacheInvalidatePrefix(`paid_penalties_for_revenue_${branchId}`);
		cacheInvalidatePrefix(`today_paid_transactions_${branchId}`);
		cacheInvalidatePrefix(`todays_pickups_${branchId}`);
		cacheInvalidatePrefix(`todays_returns_due_${branchId}`);
	} else {
		cacheInvalidatePrefix(`asset_status_counts_`);
		cacheInvalidatePrefix(`recent_transactions_`);
		cacheInvalidatePrefix(`transactions_for_revenue_`);
		cacheInvalidatePrefix(`paid_penalties_for_revenue_`);
		cacheInvalidatePrefix(`unpaid_denda_count_`);
		cacheInvalidatePrefix(`today_paid_transactions_`);
		cacheInvalidatePrefix(`active_rentals_count_`);
		cacheInvalidatePrefix(`todays_pickups_`);
		cacheInvalidatePrefix(`todays_returns_due_`);
		cacheInvalidatePrefix(`washing_assets_`);
		cacheInvalidatePrefix(`maintenance_assets_`);
		cacheInvalidatePrefix(`customers_list_`);
	}
	cacheInvalidatePrefix(`recent_logs_`);
}
