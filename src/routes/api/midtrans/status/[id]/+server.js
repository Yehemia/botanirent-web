import { json } from '@sveltejs/kit';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';
import { invalidateDashboardCache } from '$lib/server/cache.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	if (!id) {
		return json({ error: 'Transaction ID is required' }, { status: 400 });
	}

	if (id.startsWith('DENDA-TX-')) {
		try {
			const transactionId = id.substring(9);
			
			const { data: items, error: itemsError } = await locals.supabase
				.from('transaction_items')
				.select('id')
				.eq('transaction_id', transactionId);

			if (itemsError || !items) {
				console.error('[Penalty Status API] Transaction items not found:', itemsError);
				return json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
			}

			const itemIds = items.map((item) => item.id);
			if (itemIds.length === 0) {
				return json({ payment_status: 'paid' });
			}

			const { data: unpaidPenalties, error: penError } = await locals.supabase
				.from('penalties')
				.select('id')
				.eq('payment_status', 'unpaid')
				.in('transaction_item_id', itemIds);

			if (penError) {
				console.error('[Penalty Status API] Error checking penalties:', penError);
				return json({ error: 'Error checking penalties' }, { status: 500 });
			}

			if (unpaidPenalties.length === 0) {
				return json({ payment_status: 'paid' });
			}

			const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);
			const isProduction = PUBLIC_MIDTRANS_ENV === 'production';
			const midtransUrl = isProduction
				? `https://api.midtrans.com/v2/${id}/status`
				: `https://api.sandbox.midtrans.com/v2/${id}/status`;

			const response = await fetch(midtransUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Basic ${authString}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				const { transaction_status, fraud_status } = data;

				let newStatus = 'unpaid';
				let paidAt = null;

				if (['capture', 'settlement'].includes(transaction_status)) {
					if (!fraud_status || fraud_status === 'accept') {
						newStatus = 'paid';
						paidAt = new Date().toISOString();
					}
				}

				if (newStatus === 'paid') {
					const { error: updateError } = await locals.supabase
						.from('penalties')
						.update({
							payment_status: 'paid',
							paid_at: paidAt
						})
						.eq('payment_status', 'unpaid')
						.in('transaction_item_id', itemIds);

					if (updateError) {
						console.error('[Penalty Status API] Gagal update status denda ke DB:', updateError);
					} else {
						console.log(`[Penalty Status API] Berhasil update status denda untuk transaction_id ${transactionId} menjadi paid`);
						invalidateDashboardCache();
						return json({ payment_status: 'paid' });
					}
				}
			}

			return json({ payment_status: 'unpaid' });
		} catch (e) {
			console.error('[Penalty Status API] Server error:', e);
			return json({ error: 'Server error saat memeriksa status denda' }, { status: 500 });
		}
	}

	try {
		const { data: transaction, error } = await locals.supabase
			.from('transactions')
			.select('id, transaction_code, payment_status, payment_method, branch_id')
			.eq('id', id)
			.single();

		if (error || !transaction) {
			console.error('[Transaction Status API] Error or not found:', error);
			return json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
		}

		if (transaction.payment_status === 'paid') {
			return json({ payment_status: 'paid' });
		}

		if (transaction.payment_method === 'qris') {
			try {
				const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);
				const isProduction = PUBLIC_MIDTRANS_ENV === 'production';
				const midtransUrl = isProduction
					? `https://api.midtrans.com/v2/${transaction.transaction_code}/status`
					: `https://api.sandbox.midtrans.com/v2/${transaction.transaction_code}/status`;

				const response = await fetch(midtransUrl, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${authString}`
					}
				});

				if (response.ok) {
					const data = await response.json();
					const { transaction_status, fraud_status, transaction_id } = data;

					let newStatus = transaction.payment_status;
					let paidAt = null;

					if (['capture', 'settlement'].includes(transaction_status)) {
						if (!fraud_status || fraud_status === 'accept') {
							newStatus = 'paid';
							paidAt = new Date().toISOString();
						}
					} else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
						newStatus = 'failed';
					}

					if (newStatus !== transaction.payment_status) {
						const updatePayload = {
							payment_status: newStatus,
							...(newStatus === 'paid'
								? {
										paid_at: paidAt,
										midtrans_transaction_id: transaction_id
								  }
								: {})
						};
						
						const { error: updateError } = await locals.supabase
							.from('transactions')
							.update(updatePayload)
							.eq('id', id);

						if (updateError) {
							console.error('[Transaction Status API] Gagal update status transaksi ke DB:', updateError);
						} else {
							console.log(
								`[Transaction Status API] Berhasil update status transaksi ${transaction.transaction_code} dari Midtrans menjadi ${newStatus}`
							);
							invalidateDashboardCache(transaction.branch_id);
							return json({ payment_status: newStatus });
						}
					}
				} else {
					console.error(
						`[Transaction Status API] Midtrans API error (${response.status}):`,
						await response.text()
					);
				}
			} catch (midtransErr) {
				console.error('[Transaction Status API] Gagal menghubungi Midtrans API:', midtransErr);
			}
		}

		return json({ payment_status: transaction.payment_status });
	} catch (e) {
		console.error('[Transaction Status API] Server error:', e);
		return json({ error: 'Server error saat memeriksa status transaksi' }, { status: 500 });
	}
}
