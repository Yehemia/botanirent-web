/**
 * ============================================================
 * FILE: cache.js
 * TUJUAN: Menyediakan SISTEM CACHING sederhana untuk menghindari
 *         query database yang berulang-ulang.
 *
 * ANALOGI: Seperti "catatan tempel" — daripada selalu bertanya ke database
 * (yang lambat), kita simpan jawaban terakhir di "catatan tempel"
 * dan pakai selama masih relevan (belum expired).
 *
 * KONSEP:
 *   - Cache = penyimpanan data sementara di memori server
 *   - TTL (Time-To-Live) = berapa lama data cache berlaku
 *   - Cache Hit = data ditemukan di cache (cepat! ✅)
 *   - Cache Miss = data tidak ada/expired, harus fetch dari DB (lambat ❌)
 *
 * CONTOH PENGGUNAAN:
 *   const data = await cacheGet('branch_name_123', async () => {
 *       return await supabase.from('branches').select('name')...;
 *   }, 30000); // cache 30 detik
 * ============================================================
 */

// Map = struktur data key-value (seperti kamus)
// Key = nama data (contoh: "branch_name_123")
// Value = { data: ..., timestamp: ... }
//
// MENGAPA Map dan bukan Object ({})?
// Map lebih efisien untuk operasi insert/delete yang sering,
// dan bisa menyimpan key bertipe apapun (tidak hanya string)
const cache = new Map();

/**
 * Get data from cache or fetch and cache it if not present/expired.
 * (Ambil data dari cache, atau fetch & simpan jika belum ada/expired)
 *
 * POLA "Cache-Aside" (Lazy Loading Cache):
 *   1. Cek cache → ada & segar? → langsung return (CEPAT)
 *   2. Tidak ada / expired? → fetch dari database → simpan ke cache → return
 *
 * @template T
 * @param {string} key - Cache key (nama unik untuk data, contoh: "branch_name_123")
 * @param {() => Promise<T>} fetchFn - Async function untuk mengambil data jika cache kosong/expired
 * @param {number} [ttlMs=15000] - Time-To-Live dalam milidetik (default 15 detik = 15000ms)
 * @returns {Promise<T>} The cached or freshly fetched data.
 */
export async function cacheGet(key, fetchFn, ttlMs = 15000) {
	// Waktu sekarang dalam milidetik sejak 1 Januari 1970 (Unix timestamp)
	const now = Date.now();

	// Coba ambil data dari cache berdasarkan key
	const cached = cache.get(key);

	// Cek apakah cache ADA dan masih SEGAR (belum expired)
	// Rumus: (waktu sekarang - waktu disimpan) < TTL
	// Jika selisihnya masih kurang dari TTL, berarti masih valid
	if (cached && now - cached.timestamp < ttlMs) {
		// CACHE HIT! ✅ Data ada DAN masih segar
		// Langsung kembalikan TANPA query database → JAUH LEBIH CEPAT
		return cached.data;
	}

	// CACHE MISS ❌ atau EXPIRED ⏰
	// Harus fetch data baru dari database
	// fetchFn() adalah function yang diberikan oleh pemanggil
	// Contoh: async () => supabase.from('branches').select('name')...
	const data = await fetchFn();

	// Simpan data baru ke cache beserta waktu penyimpanan (timestamp)
	// Timestamp dipakai untuk menghitung apakah cache sudah expired di request berikutnya
	cache.set(key, {
		data,
		timestamp: Date.now()
	});

	return data;
}

/**
 * Invalidate a specific cache key.
 * (Hapus cache tertentu — dipanggil setelah data di-CREATE/UPDATE/DELETE)
 *
 * MENGAPA perlu invalidasi?
 * Setelah data diubah di database, cache masih menyimpan data LAMA.
 * Jika tidak di-invalidasi, user akan melihat data yang sudah tidak akurat.
 *
 * Contoh: Setelah mengubah nama cabang,
 *   panggil cacheInvalidate("branch_name_123")
 *   agar request berikutnya mengambil nama baru dari database
 *
 * @param {string} key - Cache key to delete.
 */
export function cacheInvalidate(key) {
	cache.delete(key);
}

/**
 * Invalidate all cache keys starting with a prefix.
 * (Hapus SEMUA cache yang dimulai dengan prefix tertentu)
 *
 * MENGAPA butuh ini?
 * Ketika data yang berhubungan dengan BANYAK cache berubah,
 * lebih mudah hapus semua cache terkait sekaligus.
 *
 * Contoh: cacheInvalidatePrefix("branch_")
 *   → hapus "branch_name_1", "branch_name_2", "branch_name_3", dst
 *   Berguna saat tabel branches di-restructure/reset
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

/**
 * Invalidate all cached data related to layout counts and dashboard metrics.
 *
 * @param {string|null} branchId - The specific branch ID to invalidate, or null to invalidate all.
 */
export function invalidateDashboardCache(branchId = null) {
	if (branchId) {
		cache.delete(`asset_status_counts_${branchId}`);
		cache.delete(`recent_transactions_${branchId}`);
		cache.delete(`active_rentals_count_${branchId}`);
		cache.delete(`washing_assets_${branchId}`);
		cache.delete(`maintenance_assets_${branchId}`);
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
	}
	cacheInvalidatePrefix(`recent_logs_`);
}

