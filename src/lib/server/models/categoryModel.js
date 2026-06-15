export const categoryModel = {
	/**
	 * Fetch all categories ordered by sort_order
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getCategories(supabase) {
		const { data, error } = await supabase.from('categories').select('*').order('sort_order');

		if (error) {
			console.error('Error loading categories:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch sorted categories filtered by type
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} type
	 */
	async getCategoriesByType(supabase, type) {
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.eq('type', type)
			.order('sort_order');

		if (error) {
			console.error(`Error loading categories of type ${type}:`, error);
			throw new Error(error.message);
		}
		return data || [];
	}
};
