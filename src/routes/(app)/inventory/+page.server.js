export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile?.branch_id) {
		return { items: [], categories: [] };
	}

	// Ambil kategori
	const { data: categories, error: catError } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order');

	if (catError) {
		console.error("Error loading categories:", catError);
	}

	// Ambil items beserta nama kategorinya
	const { data: items, error: itemError } = await supabase
		.from('items')
		.select('*, category:categories(name, type)')
		.eq('branch_id', profile.branch_id)
		.order('created_at', { ascending: false });

	if (itemError) {
		console.error("Error loading items:", itemError);
	}

	return {
		categories: categories || [],
		items: items || []
	};
}
