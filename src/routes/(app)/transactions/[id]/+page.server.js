import { redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/auth/login');
	}

	const { id } = params;

	// Fetch detail transaksi beserta pelanggannya dan kasirnya
	const { data: transaction, error } = await supabase
		.from('transactions')
		.select('*, customer:customers(*), cashier:profiles(full_name)')
		.eq('id', id)
		.eq('branch_id', profile.branch_id)
		.single();

	if (error || !transaction) {
		console.error("Error fetching transaction details:", error);
		throw redirect(303, '/transactions');
	}

	// Fetch rincian item-item transaksinya
	const { data: items, error: itemsErr } = await supabase
		.from('transaction_items')
		.select('*')
		.eq('transaction_id', id)
		.order('created_at', { ascending: true });
		
	// Tambahkan item ke dalam object transaction
	transaction.items = items || [];

	return {
		transaction
	};
}
