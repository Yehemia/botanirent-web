export const branchModel = {
	/**
	 * Fetch all branches
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getAllBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('id, name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch active branches sorted by name
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getActiveBranches(supabase) {
		const { data, error } = await supabase
			.from('branches')
			.select('*')
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Fetch active branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch all branches sorted by name
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('*').order('name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Insert a new branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} branchData
	 */
	async insertBranch(supabase, branchData) {
		const { data, error } = await supabase.from('branches').insert([branchData]).select();

		if (error) {
			console.error('Insert branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update an existing branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} branchData
	 */
	async updateBranch(supabase, id, branchData) {
		const { data, error } = await supabase
			.from('branches')
			.update(branchData)
			.eq('id', id)
			.select();

		if (error) {
			console.error('Update branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Delete a branch by ID
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteBranch(supabase, id) {
		const { error } = await supabase.from('branches').delete().eq('id', id);

		if (error) {
			console.error('Delete branch error:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Get count of all branches
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranchesCount(supabase) {
		const { count, error } = await supabase
			.from('branches')
			.select('*', { count: 'exact', head: true });

		if (error) {
			console.error('Fetch branches count error:', error);
			throw new Error(error.message);
		}
		return count || 0;
	},

	/**
	 * Fetch basic branch details by ID
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getBranchDetails(supabase, id) {
		const { data, error } = await supabase
			.from('branches')
			.select('name, address, phone')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Fetch branch details error in model:', error);
			throw new Error(error.message);
		}
		return data;
	}
};
