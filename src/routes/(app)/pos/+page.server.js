import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// 1. Ambil kategori
	const { data: categories } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order');

	// 2. Ambil barang aktif (Sewa & Retail)
	const { data: items } = await supabase
		.from('items')
		.select('*, category:categories(type)')
		.eq('branch_id', profile.branch_id)
		.eq('is_active', true)
		.order('name');

	// 3. Ambil paket bundling aktif
	const { data: packages } = await supabase
		.from('packages')
		.select('*')
		.eq('branch_id', profile.branch_id)
		.eq('is_active', true)
		.order('name');

	// 4. Ambil data pelanggan (opsional untuk transaksi)
	const { data: customers } = await supabase
		.from('customers')
		.select('id, full_name, phone')
		.eq('branch_id', profile.branch_id)
		.order('full_name');

	return {
		categories: categories || [],
		items: items || [],
		packages: packages || [],
		customers: customers || []
	};
}
