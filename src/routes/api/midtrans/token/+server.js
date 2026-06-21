/**
 * ============================================================
 * FILE: routes/api/midtrans/token/+server.js
 * TUJUAN: API Endpoint (POST) untuk meminta Snap Token dari Midtrans.
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk mendukung fitur pembayaran menggunakan Midtrans Snap (popup modal checkout
 *   yang berisi pilihan e-wallet, virtual account, kartu kredit, dll).
 *   Sebelum popup bisa ditampilkan di frontend, server harus meminta Snap Token khusus
 *   dari server Midtrans dengan mengirimkan rincian transaksi (order_id, jumlah biaya).
 * ============================================================
 */

import { json } from '@sveltejs/kit';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/**
 * HANDLER POST REQUEST
 * Dipanggil secara asynchronous ketika frontend memanggil POST /api/midtrans/token.
 */
export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();

	// Guard keamanan: Pastikan hanya kasir/owner terautentikasi yang bisa men-generate Snap Token
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const payload = await request.json();

		// Validasi input data transaksi
		if (!payload.transaction_code || !payload.total_amount) {
			return json({ error: 'Data transaksi tidak lengkap' }, { status: 400 });
		}

		// Menyusun Basic Auth Header: base64(ServerKey + ":")
		const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);

		// Tentukan URL Snap API berdasarkan environment (Sandbox vs Production)
		const isProduction = PUBLIC_MIDTRANS_ENV === 'production';
		const apiUrl = isProduction
			? 'https://app.midtrans.com/snap/v1/transactions'
			: 'https://app.sandbox.midtrans.com/snap/v1/transactions';

		console.log(`Menggunakan Midtrans API: ${apiUrl}`);

		// Menyusun payload parameter Snap sesuai standard dokumentasi Midtrans
		const midtransPayload = {
			transaction_details: {
				order_id: payload.transaction_code,
				gross_amount: Math.round(payload.total_amount) // Wajib dibulatkan bulat tanpa desimal
			},
			customer_details: {
				first_name: payload.customer_name || 'Pelanggan',
				phone: payload.customer_phone || '-'
			},
			callbacks: {
				// Callback URL untuk memberi instruksi ke Midtrans ke mana browser harus dialihkan setelah user sukses/gagal bayar
				finish: `${request.headers.get('origin')}/transactions?status=success`,
				error: `${request.headers.get('origin')}/transactions?status=error`
			}
		};

		// Hubungi API Midtrans via HTTP POST
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Basic ${authString}`
			},
			body: JSON.stringify(midtransPayload)
		});

		const data = await response.json();

		// Jika Midtrans mengembalikan status error (misal: order_id duplikat atau jumlah di bawah batas minimum)
		if (!response.ok) {
			console.error('Midtrans Error:', data);
			return json(
				{ error: data.error_messages?.[0] || 'Gagal request token Midtrans' },
				{ status: 400 }
			);
		}

		// Kembalikan token dan redirect_url ke frontend untuk dimuat oleh Snap JS SDK di browser
		return json({ token: data.token, redirect_url: data.redirect_url });
	} catch (e) {
		console.error('Midtrans Token Gen Error:', e);
		return json({ error: 'Server error saat menghubungi Midtrans' }, { status: 500 });
	}
}

