/**
 * ============================================================
 * FILE: routes/(app)/transactions/[id]/+page.server.js
 * TUJUAN: Logika server untuk Halaman Detail Transaksi (Dynamic Route).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk memuat kwitansi (invoice) atau detail lengkap suatu transaksi
 *   berdasarkan ID-nya. Halaman ini juga membaca status parameter pembayaran sukses
 *   yang dikirimkan kembali oleh payment gateway (Midtrans) setelah transaksi berhasil diselesaikan.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { transactionController } from '$lib/server/controllers/transactionController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman detail transaksi dirender.
 *
 * Parameter:
 *   - params: Mengandung params.id (ID Transaksi dari URL).
 *   - url: Digunakan untuk membaca parameter query success (?success=true) dari Midtrans redirect.
 */
export async function load({ locals, params, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const { id } = params;
	// Cek apakah ada parameter query "success=true" (redirect dari Midtrans callback di frontend)
	const isSuccess = url.searchParams.get('success') === 'true';

	// Ambil detail transaksi via controller
	const result = await transactionController.getTransactionDetails(
		supabase,
		profile,
		id,
		isSuccess
	);

	// Jika terjadi error (misal: ID transaksi tidak valid atau tidak berhak melihat cabang lain)
	if (!result.success) {
		throw redirect(303, result.redirect || '/transactions');
	}

	const successResult = /** @type {any} */ (result);

	return {
		transaction: successResult.transaction,
		branch: successResult.branch,
		isSuccess: successResult.isSuccess // Meneruskan status sukses bayar untuk menampilkan banner perayaan di UI
	};
}

