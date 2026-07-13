import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const payload = await request.json();

		const {
			order_id,
			status_code,
			gross_amount,
			signature_key,
			transaction_status,
			fraud_status,
			transaction_id
		} = payload;

		if (!order_id || !status_code || !gross_amount || !signature_key) {
			return json({ error: 'Payload tidak lengkap' }, { status: 400 });
		}

		const concatenatedString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
		const locallyComputedHash = crypto
			.createHash('sha512')
			.update(concatenatedString)
			.digest('hex');

		if (locallyComputedHash !== signature_key) {
			console.error(`[Midtrans Webhook] Signature Mismatch untuk Order: ${order_id}`);
			return json({ error: 'Signature mismatch' }, { status: 403 });
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);

		console.log(
			`[Midtrans Webhook] Menerima update untuk order ${order_id}. Status: ${transaction_status}`
		);

		if (['capture', 'settlement'].includes(transaction_status)) {
			if (!fraud_status || fraud_status === 'accept') {
				
				if (order_id.startsWith('DENDA-TX-')) {
					const transactionId = order_id.substring(9);
					
					const { data: items, error: itemsError } = await supabaseAdmin
						.from('transaction_items')
						.select('id')
						.eq('transaction_id', transactionId);

					if (!itemsError && items && items.length > 0) {
						const itemIds = items.map((item) => item.id);
						
						const { error: updateError } = await supabaseAdmin
							.from('penalties')
							.update({
								payment_status: 'paid',
								paid_at: new Date().toISOString(),
								notes: `Lunas via QRIS (Midtrans ID: ${transaction_id})`
							})
							.eq('payment_status', 'unpaid')
							.in('transaction_item_id', itemIds);

						if (updateError) {
							console.error(`[Midtrans Webhook] Gagal update denda untuk order ${order_id}:`, updateError);
							throw updateError;
						}
						console.log(`[Midtrans Webhook] Denda untuk order ${order_id} LUNAS.`);
					}
				} 
				else {
					const { error } = await supabaseAdmin
						.from('transactions')
						.update({
							payment_status: 'paid',
							paid_at: new Date().toISOString(),
							midtrans_transaction_id: transaction_id
						})
						.eq('transaction_code', order_id);

					if (error) throw error;
					console.log(`[Midtrans Webhook] Transaksi ${order_id} LUNAS.`);
				}
			}
		}
		else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
			if (order_id.startsWith('DENDA-TX-')) {
				console.log(`[Midtrans Webhook] Denda untuk order ${order_id} GAGAL/EXPIRED.`);
			} else {
				const { error } = await supabaseAdmin
					.from('transactions')
					.update({ payment_status: 'failed' })
					.eq('transaction_code', order_id);

				if (error) throw error;
				console.log(`[Midtrans Webhook] Transaksi ${order_id} GAGAL/EXPIRED.`);
			}
		}

		return json({ status: 'OK' });
	} catch (e) {
		console.error('[Midtrans Webhook] Webhook Processing Error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
