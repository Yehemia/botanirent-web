/**
 * ============================================================
 * FILE: routes/(app)/pos/checkout/+page.server.js
 * TUJUAN: Logika server untuk proses Checkout/Pembayaran Transaksi Sewa & Jual.
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk menyelesaikan keranjang belanja dari POS.
 *   File ini bertanggung jawab mengumpulkan data checkout awal (load)
 *   dan mengeksekusi proses checkout (form action) dengan mengirimkan parameter
 *   kunci API Midtrans secara aman (hanya diakses di server).
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { posController } from '$lib/server/controllers/posController.js';
// Impor server key Midtrans secara privat (tidak akan bocor ke browser/client-side bundle)
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/**
 * LOAD FUNCTION
 * Dijalankan sebelum halaman checkout dirender.
 * Memuat detail keranjang belanja yang sedang diproses di kasir.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil data checkout via controller
	const data = await posController.getCheckoutData(supabase, profile);
	return data;
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menjalankan pembuatan transaksi sewa/jual di DB dan inisiasi invoice pembayaran.
 */
export const actions = {
	/**
	 * Default Action: dipanggil saat tombol "Bayar/Selesaikan Transaksi" diklik
	 *
	 * Parameter 'fetch: svelteFetch':
	 *   SvelteKit menyediakan parameter 'fetch' khusus (kita sebut svelteFetch).
	 *   Sangat disarankan menggunakan svelteFetch dibanding global fetch karena
	 *   ia secara cerdas menangani cookie kredensial dan request antar URL lokal secara efisien.
	 */
	default: async ({ request, locals, fetch: svelteFetch }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Ambil data form checkout (metode pembayaran, denda, detail sewa, customer, dll)
		const formData = await request.formData();

		// Susun konfigurasi kredensial Midtrans
		const midtransConfig = {
			serverKey: MIDTRANS_SERVER_KEY,
			env: PUBLIC_MIDTRANS_ENV,
			fetch: svelteFetch
		};

		// Panggil checkout controller untuk memproses transaksi di DB dan generate token pembayaran
		const result = await posController.checkout(supabase, profile, formData, midtransConfig);

		// Jika proses checkout gagal
		if (!result.success) {
			if (result.redirect) {
				throw redirect(303, result.redirect);
			}
			const errorResult = /** @type {any} */ (result);
			// Kembalikan status fail beserta state input sebelumnya
			return fail(errorResult.status || 500, {
				error: errorResult.error,
				values: errorResult.values
			});
		}

		// Jika sukses dan controller mengarahkan redirect (misal: kembali ke riwayat transaksi)
		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		// Kembalikan hasil sukses (misal: snap token Midtrans untuk popup pembayaran online)
		return result;
	}
};

