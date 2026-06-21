/**
 * ============================================================
 * FILE: assetModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "rental_assets".
 *
 * APA ITU rental_assets?
 *   Setiap barang fisik yang disewakan disebut "asset".
 *   Contoh: Item = "Tenda Dome 4 Orang" (1 jenis)
 *            Asset = "TDA-001", "TDA-002", "TDA-003" (3 unit fisik)
 *   Satu item bisa punya banyak asset (unit fisik).
 *
 * STATUS ASSET:
 *   'ready'       → Siap disewa
 *   'rented'      → Sedang disewa pelanggan
 *   'washing'     → Sedang dicuci/dibersihkan
 *   'maintenance' → Sedang diperbaiki / dalam perawatan
 * ============================================================
 */

export const assetModel = {
	/**
	 * Hitung jumlah asset per status di suatu cabang.
	 * Hasilnya: { ready: 10, rented: 5, maintenance: 2, washing: 3 }
	 * Dipakai untuk widget status barang di dashboard.
	 *
	 * KONSEP JOIN DENGAN FILTER:
	 *   rental_assets → item:items!inner(branch_id)
	 *   = ambil asset beserta item-nya, filter berdasarkan branch_id item
	 *
	 * CARA HITUNG STATUS (di JavaScript, bukan SQL):
	 *   1. Ambil semua asset dari DB (hanya kolom 'status')
	 *   2. Hitung manual di JS menggunakan forEach
	 *   Alasan: Supabase tidak mudah melakukan GROUP BY di query builder
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getAssetsStatusCounts(supabase, branchId = null) {
		let query = supabase.from('rental_assets').select('status, item:items!inner(branch_id)');

		if (branchId) {
			query = query.eq('items.branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error fetching assets in model:', error);
			throw new Error(error.message);
		}

		// Hitung jumlah asset per status secara manual
		const stats = { ready: 0, rented: 0, maintenance: 0, washing: 0 };
		if (data) {
			data.forEach((a) => {
				const status = /** @type {keyof typeof stats} */ (a.status);
				// Tambahkan 1 ke counter status yang sesuai
				if (stats[status] !== undefined) stats[status]++;
			});
		}
		return stats; // Contoh: { ready: 10, rented: 5, maintenance: 2, washing: 3 }
	},

	/**
	 * Ambil semua asset yang sedang dalam status 'washing' (proses cuci).
	 * Dipakai gudang untuk tahu barang mana yang masih dicuci.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getWashingAssets(supabase, branchId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('*, item:items!inner(name, branch_id)')
			.eq('status', 'washing')
			.eq('items.branch_id', branchId);

		if (error) {
			console.error('Error fetching washing assets in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua asset yang sedang dalam status 'maintenance' (perbaikan).
	 * Dipakai gudang untuk monitoring barang yang rusak.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getMaintenanceAssets(supabase, branchId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('*, item:items!inner(name, branch_id)')
			.eq('status', 'maintenance')
			.eq('items.branch_id', branchId);

		if (error) {
			console.error('Error fetching maintenance assets in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua asset, opsional difilter per cabang dan diurutkan.
	 *
	 * DESTRUCTURING PARAMETER DENGAN DEFAULT VALUE:
	 *   { branchId = null, orderBy = 'asset_code', ascending = true } = {}
	 *   → Fungsi menerima satu objek sebagai parameter (bukan banyak parameter terpisah)
	 *   → Setiap key punya nilai default jika tidak disediakan
	 *   → { } = {} → jika tidak ada parameter sama sekali, gunakan objek kosong
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string|null} [params.branchId]
	 * @param {string} [params.orderBy]
	 * @param {boolean} [params.ascending]
	 */
	async getAssets(supabase, { branchId = null, orderBy = 'asset_code', ascending = true } = {}) {
		let query = supabase.from('rental_assets').select('*, item:items!inner(branch_id, name)');

		if (branchId) {
			query = query.eq('items.branch_id', branchId);
		}

		const { data, error } = await query.order(orderBy, { ascending });

		if (error) {
			console.error('Error fetching assets in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Update status dan catatan satu asset.
	 * Dipanggil saat barang selesai dicuci, selesai diperbaiki, dsb.
	 *
	 * last_status_change = catat KAPAN status terakhir diubah (audit trail)
	 *
	 * CONDITIONAL FIELD:
	 *   if (notes !== null) { updateData.notes = notes; }
	 *   → Hanya update kolom 'notes' jika memang ada nilai baru.
	 *     Ini mencegah menghapus notes yang sudah ada dengan null.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string} status - Status baru: 'ready' | 'rented' | 'washing' | 'maintenance'
	 * @param {string|null} [notes] - Catatan opsional
	 */
	async updateAssetStatus(supabase, id, status, notes = null) {
		/** @type {{ status: string, last_status_change: string, notes?: string }} */
		const updateData = {
			status,
			last_status_change: new Date().toISOString() // Waktu sekarang dalam format ISO
		};
		if (notes !== null) {
			updateData.notes = notes;
		}

		const { data, error } = await supabase
			.from('rental_assets')
			.update(updateData)
			.eq('id', id)
			.select(); // Ambil kembali data yang sudah diupdate

		if (error) {
			console.error('Error updating asset status in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hapus booking maintenance untuk sebuah asset.
	 * Dipanggil saat asset selesai maintenance dan statusnya dikembalikan ke 'ready'.
	 *
	 * .is('transaction_item_id', null) → filter: hanya booking yang transaction_item_id-nya NULL
	 *   = hanya booking maintenance (bukan booking dari transaksi sewa)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} assetId
	 */
	async deleteMaintenanceBookingForAsset(supabase, assetId) {
		const { error } = await supabase
			.from('bookings')
			.delete()
			.eq('rental_asset_id', assetId)
			.is('transaction_item_id', null); // Hanya booking maintenance, bukan booking sewa

		if (error) {
			console.error('Error deleting maintenance booking in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil asset yang SIAP DISEWA (status 'ready') untuk item tertentu.
	 * Dipakai saat checkout: sistem otomatis pilih unit fisik mana yang akan dipakai.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} itemId
	 */
	async getReadyAssetsForItem(supabase, itemId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('id')
			.eq('item_id', itemId)
			.eq('status', 'ready')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching ready assets in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Hapus banyak asset sekaligus berdasarkan array ID.
	 * Dipakai saat mengurangi stok item.
	 *
	 * .in('id', assetIds) → filter: id ada dalam array ini (seperti WHERE id IN (...) di SQL)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<string>} assetIds - Array berisi ID-ID asset yang akan dihapus
	 */
	async deleteAssetsByIds(supabase, assetIds) {
		const { error } = await supabase.from('rental_assets').delete().in('id', assetIds);

		if (error) {
			console.error('Error deleting assets by IDs in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil semua kode asset yang sudah ada untuk satu item.
	 * Dipakai untuk generate kode asset baru (agar tidak duplikat).
	 * Contoh kode: "TDA-001", "TDA-002"
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} itemId
	 */
	async getExistingAssetsForItem(supabase, itemId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('asset_code')
			.eq('item_id', itemId);

		if (error) {
			console.error('Error fetching existing assets for item in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambahkan banyak asset fisik sekaligus (bulk insert).
	 * Dipanggil saat menambah stok barang — misal tambah 5 unit tenda baru.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} assetsList - Array berisi data setiap asset
	 */
	async insertAssets(supabase, assetsList) {
		const { error } = await supabase.from('rental_assets').insert(assetsList);

		if (error) {
			console.error('Error inserting rental assets in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
