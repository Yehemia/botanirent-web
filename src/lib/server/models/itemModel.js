export const itemModel = {
	/**
	 * Fetch all items with nested category details, optionally filtered by branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getItems(supabase, branchId = null) {
		let query = supabase
			.from('items')
			.select('*, category:categories(name, type)')
			.order('created_at', { ascending: false });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error("Error loading items:", error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch active rental items of type 'sewa' for a branch, ordered by name
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
			console.error("Error fetching active sewa items in model:", error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch active items (both rental and retail) for a branch, ordered by name
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
			console.error("Error fetching active items in model:", error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch detailed item record by ID, with categories info
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
			console.error("Error fetching item details in model:", error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Insert a new item record
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} itemData
	 */
	async insertItem(supabase, itemData) {
		const { data, error } = await supabase
			.from('items')
			.insert(itemData)
			.select()
			.single();

		if (error) {
			console.error("Error inserting item in model:", error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update an existing item record
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
			console.error("Error updating item in model:", error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Delete an item record
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteItem(supabase, id) {
		const { error } = await supabase
			.from('items')
			.delete()
			.eq('id', id);

		if (error) {
			console.error("Error deleting item in model:", error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Bulk insert items
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} itemsList
	 */
	async bulkInsertItems(supabase, itemsList) {
		const { error } = await supabase
			.from('items')
			.insert(itemsList);

		if (error) {
			console.error("Error bulk inserting items in model:", error);
			throw new Error(error.message);
		}
		return true;
	}
};
