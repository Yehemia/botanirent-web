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
		.select('*, transaction:transactions!inner(transaction_code, type, created_at, branch_id, customer:customers(full_name, phone)), item:items(sell_price)')
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
					transaction_type: item.transaction.type,
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

	// Fetch rental settings
	const { data: settingsData } = await supabase
		.from('settings')
		.select('*')
		.eq('key', 'rental')
		.single();
	
	const rentalSettings = settingsData?.value || { default_rental_duration_days: 4, late_fee_per_day_per_transaction: 10000 };

	return {
		transactions: Object.values(grouped),
		penaltyRules: penaltyRules || [],
		rentalSettings
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

		// Fetch settings for late fee per day per transaction
		const { data: settingsData } = await supabase
			.from('settings')
			.select('*')
			.eq('key', 'rental')
			.single();
		
		const rentalSettings = settingsData?.value || { default_rental_duration_days: 4, late_fee_per_day_per_transaction: 10000 };
		const lateRate = parseFloat(rentalSettings.late_fee_per_day_per_transaction) || 10000;

		// Fetch penalty rules for damage/lost
		const { data: penaltyRules } = await supabase.from('penalty_rules').select('*');

		// 1. Calculate late penalty once per transaction
		let maxLateDays = 0;
		let latePenaltyItemId = null;

		for (const item of data) {
			if (item.condition !== 'lost' && item.late_days > maxLateDays) {
				maxLateDays = item.late_days;
			}
			if (item.condition !== 'lost' && !latePenaltyItemId) {
				latePenaltyItemId = item.id;
			}
		}

		let totalPenalty = 0;

		// Insert transaction-wide late penalty if any
		if (maxLateDays > 0 && latePenaltyItemId) {
			const calculatedLateAmount = maxLateDays * lateRate;
			if (calculatedLateAmount > 0) {
				const rule = penaltyRules?.find(r => r.type === 'late');
				await supabase.from('penalties').insert({
					transaction_item_id: latePenaltyItemId,
					penalty_rule_id: rule?.id,
					branch_id: profile.branch_id,
					type: 'late',
					late_days: maxLateDays,
					calculated_amount: calculatedLateAmount,
					payment_status: 'unpaid',
					notes: `Keterlambatan transaksi selama ${maxLateDays} hari`
				});
				totalPenalty += calculatedLateAmount;
			}
		}

		// 2. Loop and process individual items
		for (const item of data) {
			// Update status transaction_items
			let finalRentalStatus = 'returned';
			if (item.condition === 'lost') finalRentalStatus = 'lost';

			await supabase.from('transaction_items').update({
				rental_status: finalRentalStatus,
				returned_at: new Date().toISOString(),
				return_condition: item.condition,
				return_notes: item.condition === 'lost' 
					? 'Barang dinyatakan hilang' 
					: `Kondisi kembali: ${item.condition}`
			}).eq('id', item.id);

			// Update calendar booking status to 'completed'
			await supabase.from('bookings')
				.update({ status: 'completed' })
				.eq('transaction_item_id', item.id);

			// Insert damage/lost penalty per-item if applicable
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
						totalPenalty += calculatedAmount;
					}
				}
			}

			// Update status fisik (rental_assets)
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
					condition: item.condition
				}
			});
		}

		return { success: true, totalPenalty };
	}
};
