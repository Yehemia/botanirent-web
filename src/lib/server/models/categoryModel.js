export const categoryModel = {
	/**
	 * Ambil SEMUA kategori, diurutkan berdasarkan sort_order.
	 *
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
	 * Ambil kategori yang difilter berdasarkan TIPE.
	 *
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
