/**
 * ============================================================
 * FILE: routes/api/midtrans/webhook/+server.js
 * TUJUAN: API Webhook Endpoint (POST) untuk menerima notifikasi status pembayaran dari Midtrans.
 *
 * MENGAPA KODE INI DITULIS?
 *   Webhook adalah mekanisme asynchronous "push notification" dari server Midtrans ke server kita.
 *   Ketika customer membayar QRIS, server Midtrans akan mengirim data notifikasi pembayaran ke endpoint ini.
 *   Ini sangat krusial karena:
 *     1. Menjamin status di DB tetap terupdate menjadi 'paid' meskipun kasir tidak sengaja menutup tab browser.
 *     2. Harus memverifikasi Signature Key (hash SHA-512) secara ketat untuk mencegah serangan pemalsuan pembayaran (spoofing).
 *     3. Menggunakan Service Role Key Supabase untuk bypass RLS, karena request dipicu oleh server luar (tanpa session user).
 * ============================================================
 */

import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY } from '$env/static/private';

/**
 * HANDLER POST REQUEST
 * Dipanggil secara otomatis oleh server Midtrans (Machine-to-Machine) saat terjadi pembayaran.
 */
export async function POST({ request }) {
	try {
		// Ambil data payload mentah yang dikirim oleh Midtrans
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

		// Validasi kelengkapan payload notifikasi
		if (!order_id || !status_code || !gross_amount || !signature_key) {
			return json({ error: 'Payload tidak lengkap' }, { status: 400 });
		}

		// ============================================================
		// VERIFIKASI SIGNATURE KEY (KEAMANAN WEBHOOK)
		// ============================================================
		// Midtrans menggunakan rumus hash SHA-512:
		// SHA-512(order_id + status_code + gross_amount + ServerKey)
		const concatenatedString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
		const locallyComputedHash = crypto
			.createHash('sha512')
			.update(concatenatedString)
			.digest('hex');

		// Proteksi spoofing: Jika hash buatan kita tidak sama dengan signature_key dari request,
		// maka kemungkinan besar request ini palsu/dimanipulasi. Tolak dengan status 403 (Forbidden).
		if (locallyComputedHash !== signature_key) {
			console.error(`[Midtrans Webhook] Signature Mismatch untuk Order: ${order_id}`);
			return json({ error: 'Signature mismatch' }, { status: 403 });
		}

		// ============================================================
		// SUPABASE ADMIN CLIENT INITIALIZATION
		// ============================================================
		// Mengapa pakai createClient baru dengan Service Role Key?
		// Webhook dipanggil oleh server Midtrans, sehingga locals.supabase (yang bergantung pada session user)
		// tidak memiliki status login/session (null).
		// Kita butuh admin client untuk mem-bypass Row Level Security (RLS) di database agar bisa memperbarui status transaksi.
		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);

		console.log(
			`[Midtrans Webhook] Menerima update untuk order ${order_id}. Status: ${transaction_status}`
		);

		// ============================================================
		// PEMROSESAN STATUS PEMBAYARAN
		// ============================================================
		if (['capture', 'settlement'].includes(transaction_status)) {
			// Pastikan fraud_status aman (jika ada, nilainya harus 'accept')
			if (!fraud_status || fraud_status === 'accept') {
				
				// Kasus A: Pembayaran Denda (order_id diawali 'DENDA-TX-')
				if (order_id.startsWith('DENDA-TX-')) {
					const transactionId = order_id.substring(9);
					
					// 1. Ambil semua item ID transaksi ini
					const { data: items, error: itemsError } = await supabaseAdmin
						.from('transaction_items')
						.select('id')
						.eq('transaction_id', transactionId);

					if (!itemsError && items && items.length > 0) {
						const itemIds = items.map((item) => item.id);
						
						// 2. Tandai semua denda dari item-item tersebut sebagai 'paid' (lunas)
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
				// Kasus B: Pembayaran Transaksi Utama (Sewa/Beli biasa)
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
		// Jika pembayaran gagal / kedaluwarsa / dibatalkan
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

		// Midtrans memerlukan response status 200 dengan payload JSON untuk menandai webhook sukses diterima
		return json({ status: 'OK' });
	} catch (e) {
		console.error('[Midtrans Webhook] Webhook Processing Error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

