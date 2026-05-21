import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/auth/login');
	}

	// Ambil semua item sewa yang statusnya masih 'active' (belum dikembalikan)
	const { data: activeRentals, error } = await supabase
		.from('transaction_items')
		.select('*, transaction:transactions!inner(transaction_code, created_at, branch_id, customer:customers(full_name, phone)), item:items(sell_price)')
		.eq('rental_status', 'active')
		.eq('transactions.branch_id', profile.branch_id)
		.order('rental_end_date', { ascending: true });

	if (error) {
		console.error("Error fetching active rentals:", error);
	}

	// Kelompokkan per transaksi agar UI lebih rapi
	const grouped = {};
	if (activeRentals) {
		activeRentals.forEach(item => {
			const trxId = item.transaction_id;
			if (!grouped[trxId]) {
				grouped[trxId] = {
					transaction_id: trxId,
					transaction_code: item.transaction.transaction_code,
					customer_name: item.transaction.customer?.full_name || 'Pelanggan Umum',
					customer_phone: item.transaction.customer?.phone || '-',
					items: []
				};
			}
			grouped[trxId].items.push(item);
		});
	}

	return {
		transactions: Object.values(grouped)
	};
}

export const actions = {
	processReturn: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const payloadStr = formData.get('payload');
		if (!payloadStr) return fail(400, { error: 'Payload kosong' });

		const data = JSON.parse(payloadStr.toString());
		// data: array of { id, condition, late_days, penalty_amount, asset_id }

		let totalPenalty = 0;

		for (const item of data) {
			// 1. Update status transaction_items
			let finalRentalStatus = 'returned';
			if (item.condition === 'lost') finalRentalStatus = 'lost';

			await supabase.from('transaction_items').update({
				rental_status: finalRentalStatus,
				returned_at: new Date().toISOString(),
				return_condition: item.condition,
				return_notes: `Telat: ${item.late_days} hari. Denda: Rp${item.penalty_amount}`
			}).eq('id', item.id);

			totalPenalty += item.penalty_amount;

			// 2. Update status fisik (rental_assets)
			let assetStatus = 'ready'; // Good
			if (item.condition === 'minor_damage' || item.condition === 'major_damage') {
				assetStatus = 'maintenance';
			} else if (item.condition === 'lost') {
				assetStatus = 'lost'; // maybe we should add 'lost' to asset statuses, or delete it later. Let's use 'maintenance' for now if lost is not in check constraint.
				// Wait, let's just delete the booking/asset if lost? We'll mark it maintenance for safety to investigate
				assetStatus = 'maintenance'; 
			}

			// Often after rental, tents need washing. We can default to 'washing' if 'good'
			if (item.condition === 'good') assetStatus = 'washing';

			if (item.asset_id) {
				await supabase.from('rental_assets')
					.update({ status: assetStatus, last_status_change: new Date().toISOString() })
					.eq('id', item.asset_id);
			}
		}

		return { success: true, totalPenalty };
	}
};
