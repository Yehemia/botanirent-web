export const itemModel = {
	/**
	 * Ambil semua item dengan data kategori, opsional difilter per cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getItems(supabase, branchId = null) {
		let query = supabase
			.from('items')
			.select('*, category:categories(name, type)')
			.order('is_active', { ascending: false })
			.order('created_at', { ascending: false });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error loading items:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil item tipe SEWA yang aktif untuk satu cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActiveSewaItems(supabase, branchId) {
		const { data, error } = await supabase
			.from('items')
			.select('*, category:categories!inner(name, type)')
			.eq('branch_id', branchId)
			.eq('categories.type', 'sewa')
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Error fetching active sewa items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil SEMUA item aktif (sewa DAN jual) untuk satu cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActiveItems(supabase, branchId) {
		const { data, error } = await supabase
			.from('items')
			.select('*, category:categories(type)')
			.eq('branch_id', branchId)
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Error fetching active items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil detail lengkap satu item beserta semua info kategorinya.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getItemDetails(supabase, id) {
		const { data, error } = await supabase
			.from('items')
			.select('*, categories(*)')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Error fetching item details in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Tambah item baru ke database.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} itemData
	 */
	async insertItem(supabase, itemData) {
		const { data, error } = await supabase.from('items').insert(itemData).select().single();

		if (error) {
			console.error('Error inserting item in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update item yang sudah ada.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} itemData
	 */
	async updateItem(supabase, id, itemData) {
		const { data, error } = await supabase
			.from('items')
			.update(itemData)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating item in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hapus item dari database.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteItem(supabase, id) {
		const { error } = await supabase.from('items').delete().eq('id', id);

		if (error) {
			console.error('Error deleting item in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Tambah banyak item sekaligus (bulk insert).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} itemsList
	 */
	async bulkInsertItems(supabase, itemsList) {
		const { error } = await supabase.from('items').insert(itemsList);

		if (error) {
			console.error('Error bulk inserting items in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
