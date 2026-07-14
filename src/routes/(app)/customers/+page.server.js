import { fail, redirect } from '@sveltejs/kit';
import { customerController } from '$lib/server/controllers/customerController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, parent }) {
	const { supabase } = locals;
	const { session, profile } = await parent();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const selectedBranchId = url.searchParams.get('branch_id');
	return customerController.getCustomersPageData(supabase, profile, selectedBranchId);
}

/** @type {import('./$types').Actions} */
export const actions = {
	createCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await customerController.createCustomer(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	updateCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await customerController.updateCustomer(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	deleteCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await customerController.deleteCustomer(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	payPenalty: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const transactionId = formData.get('transaction_id')?.toString();
		const paymentMethod = formData.get('payment_method')?.toString() || 'Tunai';

		console.log('[payPenalty Server Action] Input transactionId:', transactionId, 'paymentMethod:', paymentMethod);

		if (!transactionId) {
			return fail(400, { error: 'ID Transaksi wajib diisi.' });
		}

		try {
			const { data: items, error: itemsError } = await supabase
				.from('transaction_items')
				.select('id')
				.eq('transaction_id', transactionId);

			if (itemsError || !items || items.length === 0) {
				console.error('[payPenalty Server Action] transaction_items error:', itemsError);
				return fail(404, { error: 'Item transaksi tidak ditemukan.' });
			}

			const itemIds = items.map((item) => item.id);

			const { data: penalties, error: penError } = await supabase
				.from('penalties')
				.select('calculated_amount')
				.eq('payment_status', 'unpaid')
				.in('transaction_item_id', itemIds);

			if (penError || !penalties) {
				console.error('[payPenalty Server Action] penalties query error:', penError);
				return fail(500, { error: 'Gagal memeriksa denda.' });
			}

			const totalPenalty = penalties.reduce((acc, p) => acc + (Number(p.calculated_amount) || 0), 0);

			if (totalPenalty <= 0) {
				return fail(400, { error: 'Tidak ada denda yang perlu dibayar.' });
			}

			if (paymentMethod === 'QRIS') {
				const orderId = `DENDA-TX-${transactionId}`;
				
				const { data: customerData } = await supabase
					.from('transactions')
					.select('customer:customers(full_name, phone)')
					.eq('id', transactionId)
					.maybeSingle();

				let customerName = 'Pelanggan';
				let customerPhone = '-';
				if (customerData?.customer) {
					const customer = /** @type {any} */ (customerData.customer);
					customerName = customer.full_name || customerName;
					customerPhone = customer.phone || customerPhone;
				}

				const { MIDTRANS_SERVER_KEY } = await import('$env/static/private');
				const { PUBLIC_MIDTRANS_ENV } = await import('$env/static/public');

				const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);
				const isProduction = PUBLIC_MIDTRANS_ENV === 'production';
				const apiUrl = isProduction
					? 'https://api.midtrans.com/v2/charge'
					: 'https://api.sandbox.midtrans.com/v2/charge';

				const midtransPayload = {
					payment_type: 'qris',
					transaction_details: {
						order_id: orderId,
						gross_amount: Math.round(totalPenalty)
					},
					customer_details: {
						first_name: customerName,
						phone: customerPhone
					},
					custom_expiry: {
						expiry_duration: 5,
						unit: 'minute'
					}
				};

				console.log('[payPenalty Server Action] Requesting QRIS from Midtrans. URL:', apiUrl);
				const response = await fetch(apiUrl, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${authString}`
					},
					body: JSON.stringify(midtransPayload)
				});

				const midtransData = await response.json();
				console.log('[payPenalty Server Action] Midtrans API response:', midtransData);
				
				if (response.ok && midtransData.transaction_id) {
					const qr_string = midtransData.qr_string;
					const qr_url =
						midtransData.actions?.find(/** @param {any} act */ (act) => act.name === 'generate-qr-code')
							?.url || '';

					return {
						success: true,
						payment_method: 'qris',
						order_id: orderId,
						totalPenalty,
						qr_string,
						qr_url
					};
				} else {
					console.error('[payPenalty Server Action] Midtrans charge error:', midtransData);
					return fail(400, { error: midtransData.status_message || 'Gagal inisiasi pembayaran QRIS Midtrans.' });
				}
			} else {
				const { error: updateError } = await supabase
					.from('penalties')
					.update({
						payment_status: 'paid',
						paid_at: new Date().toISOString(),
						notes: 'Lunas via Tunai (Bayar Denda Belakangan)'
					})
					.eq('payment_status', 'unpaid')
					.in('transaction_item_id', itemIds);

				if (updateError) {
					console.error('[payPenalty Server Action] penalties update error:', updateError);
					return fail(500, { error: 'Gagal memproses pembayaran denda.' });
				}

				const { activityLogModel } = await import('$lib/server/models/activityLogModel.js');
				await activityLogModel.logActivity(supabase, {
					userId: profile.id,
					branchId: profile.branch_id,
					action: 'pay_penalty',
					entityType: 'transaction',
					entityId: transactionId,
					metadata: { total_amount: totalPenalty, payment_method: 'Tunai' }
				});

				console.log('[payPenalty Server Action] Cash payment successful');
				return { success: true, payment_method: 'Tunai', totalPenalty };
			}
		} catch (err) {
			console.error('[payPenalty Server Action] Uncaught exception:', err);
			return fail(500, { error: err instanceof Error ? err.message : String(err) });
		}
	}
};
