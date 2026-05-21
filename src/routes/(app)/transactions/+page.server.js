import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const search = url.searchParams.get('q') || '';

	let query = supabase
		.from('transactions')
		.select('*, customer:customers(full_name), cashier:profiles(full_name)')
		.eq('branch_id', profile.branch_id)
		.order('created_at', { ascending: false });

	if (search) {
		// Menggunakan pencarian berdasarkan kode transaksi
		query = query.ilike('transaction_code', `%${search}%`);
	}

	const { data: transactions, error } = await query;

	if (error) {
		console.error("Error fetching transactions:", error);
	}

	return {
		transactions: transactions || [],
		search
	};
}
