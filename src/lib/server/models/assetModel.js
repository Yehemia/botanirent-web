export const assetModel = {
	/**
	 * Hitung jumlah asset per status di suatu cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getAssetsStatusCounts(supabase, branchId = null) {
		let query = supabase
			.from('rental_assets')
			.select('status, item:items!inner(branch_id, is_active)')
			.eq('items.is_active', true);

		if (branchId) {
			query = query.eq('items.branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error fetching assets in model:', error);
			throw new Error(error.message);
		}

		const stats = { ready: 0, rented: 0, maintenance: 0, washing: 0 };
		if (data) {
			data.forEach((a) => {
				const status = /** @type {keyof typeof stats} */ (a.status);
				if (stats[status] !== undefined) stats[status]++;
			});
		}
		return stats;
	},

	/**
	 * Ambil semua asset yang sedang dalam status 'washing'.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getWashingAssets(supabase, branchId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('*, item:items!inner(name, branch_id, is_active)')
			.eq('status', 'washing')
			.eq('items.is_active', true)
			.eq('items.branch_id', branchId);

		if (error) {
			console.error('Error fetching washing assets in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua asset yang sedang dalam status 'maintenance'.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getMaintenanceAssets(supabase, branchId) {
		const { data, error } = await supabase
			.from('rental_assets')
			.select('*, item:items!inner(name, branch_id, is_active)')
			.eq('status', 'maintenance')
			.eq('items.is_active', true)
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
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string|null} [params.branchId]
	 * @param {string} [params.orderBy]
	 * @param {boolean} [params.ascending]
	 */
	async getAssets(supabase, { branchId = null, orderBy = 'asset_code', ascending = true } = {}) {
		let query = supabase
			.from('rental_assets')
			.select('*, item:items!inner(branch_id, name, is_active)')
			.eq('items.is_active', true);

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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string} status
	 * @param {string|null} [notes]
	 */
	async updateAssetStatus(supabase, id, status, notes = null) {
		/** @type {{ status: string, last_status_change: string, notes?: string }} */
		const updateData = {
			status,
			last_status_change: new Date().toISOString()
		};
		if (notes !== null) {
			updateData.notes = notes;
		}

		const { data, error } = await supabase
			.from('rental_assets')
			.update(updateData)
			.eq('id', id)
			.select();

		if (error) {
			console.error('Error updating asset status in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hapus booking maintenance untuk sebuah asset.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} assetId
	 */
	async deleteMaintenanceBookingForAsset(supabase, assetId) {
		const { error } = await supabase
			.from('bookings')
			.delete()
			.eq('rental_asset_id', assetId)
			.is('transaction_item_id', null);

		if (error) {
			console.error('Error deleting maintenance booking in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil asset yang SIAP DISEWA (status 'ready') untuk item tertentu.
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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<string>} assetIds
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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} assetsList
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
