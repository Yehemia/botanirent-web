import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
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
	/** @type {Record<string, any>} */
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

	const { data: penaltyRules } = await supabase
		.from('penalty_rules')
		.select('*');

	return {
		transactions: Object.values(grouped),
		penaltyRules: penaltyRules || []
	};
}

export const actions = {
	processReturn: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();
		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const payloadStr = formData.get('payload');
		if (!payloadStr) return fail(400, { error: 'Payload kosong' });

		const data = JSON.parse(payloadStr.toString());
		// data: array of { id, condition, late_days, penalty_amount, asset_id }

		// Fetch penalty rules first
		const { data: penaltyRules } = await supabase.from('penalty_rules').select('*');

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

			// 2. Insert into penalties table if there is any penalty calculated
			// Insert for late penalty
			if (item.late_days > 0 && item.condition !== 'lost') {
				const rule = penaltyRules?.find(r => r.type === 'late');
				const lateRate = rule ? parseFloat(rule.amount) : 10000;
				const calculatedLateAmount = item.late_days * lateRate;
				if (calculatedLateAmount > 0) {
					await supabase.from('penalties').insert({
						transaction_item_id: item.id,
						penalty_rule_id: rule?.id,
						branch_id: profile.branch_id,
						type: 'late',
						late_days: item.late_days,
						calculated_amount: calculatedLateAmount,
						payment_status: 'unpaid',
						notes: `Keterlambatan ${item.late_days} hari`
					});
				}
			}

			// Insert for damage/lost penalty
			if (item.condition !== 'good') {
				const rule = penaltyRules?.find(r => r.type === item.condition);
				if (rule) {
					let calculatedAmount = 0;
					const amount = parseFloat(rule.amount);
					
					// Fetch sell price
					const { data: itemData } = await supabase
						.from('transaction_items')
						.select('items(sell_price)')
						.eq('id', item.id)
						.single();
					const itemsVal = /** @type {any} */ (itemData?.items);
					const sellPrice = itemsVal?.sell_price || (Array.isArray(itemsVal) ? itemsVal[0]?.sell_price : 0) || 0;

					if (rule.calculation_method === 'flat') {
						calculatedAmount = amount;
					} else if (rule.calculation_method === 'percentage') {
						calculatedAmount = (amount / 100) * sellPrice;
					}

					if (calculatedAmount > 0) {
						await supabase.from('penalties').insert({
							transaction_item_id: item.id,
							penalty_rule_id: rule.id,
							branch_id: profile.branch_id,
							type: item.condition,
							calculated_amount: calculatedAmount,
							payment_status: 'unpaid',
							notes: `Denda ${rule.name}`
						});
					}
				}
			}

			// 3. Update status fisik (rental_assets)
			let assetStatus = 'ready'; // Good
			if (item.condition === 'minor_damage' || item.condition === 'major_damage') {
				assetStatus = 'maintenance';
			} else if (item.condition === 'lost') {
				assetStatus = 'maintenance'; 
			}

			// Often after rental, tents need washing. We can default to 'washing' if 'good'
			if (item.condition === 'good') assetStatus = 'washing';

			if (item.asset_id) {
				await supabase.from('rental_assets')
					.update({ status: assetStatus, last_status_change: new Date().toISOString() })
					.eq('id', item.asset_id);
			}

			// Log activity
			await supabase.from('activity_logs').insert({
				user_id: profile.id,
				branch_id: profile.branch_id,
				action: 'item_returned',
				entity_type: 'transaction_item',
				entity_id: item.id,
				metadata: { 
					condition: item.condition, 
					late_days: item.late_days, 
					penalty_amount: item.penalty_amount 
				}
			});
		}

		return { success: true, totalPenalty };
	}
};
