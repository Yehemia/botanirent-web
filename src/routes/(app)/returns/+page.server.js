/**
 * ============================================================
 * FILE: routes/(app)/returns/+page.server.js
 * TUJUAN: Logika server untuk halaman Pengembalian Alat Outdoor Sewaan (Returns).
 *
 * MENGAPA KODE INI DITULIS?
 *   Ketika masa sewa alat habis, pelanggan mengembalikannya ke toko.
 *   Di halaman ini, kasir mencatat pengembalian, mengecek kondisi fisik alat (apakah rusak/hilang),
 *   menghitung denda keterlambatan atau kerusakan secara otomatis,
 *   serta memproses pembayaran denda tersebut secara langsung (jika ada denda).
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { returnsController } from '$lib/server/controllers/returnsController.js';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/**
 * LOAD FUNCTION
 * Dijalankan sebelum halaman returns dirender.
 * Memuat daftar alat/item sewaan yang sedang aktif disewa (belum dikembalikan).
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil data sewaan aktif
	const data = await returnsController.getReturnsPageData(supabase, profile);
	return data;
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani aksi pemrosesan pengembalian barang.
 */
export const actions = {
	/**
	 * Aksi 'processReturn': Dipanggil saat kasir mengonfirmasi pengembalian item
	 */
	processReturn: async ({ request, locals, fetch: svelteFetch }) => {
		try {
			const { supabase } = locals;
			const { session, profile } = await locals.safeGetSession();

			if (!session || !profile) {
				console.warn('[processReturn Server] Unauthorized access attempt');
				return fail(401, { error: 'Unauthorized' });
			}

			// Ambil input form data (biasanya berisi payload JSON dari item yang dikembalikan)
			const formData = await request.formData();
			const payload = formData.get('payload');
			console.log('[processReturn Server] Received request payload:', payload);

			// Konfigurasi Midtrans disiapkan jika kasir memproses denda langsung via QRIS
			const midtransConfig = {
				serverKey: MIDTRANS_SERVER_KEY,
				env: PUBLIC_MIDTRANS_ENV,
				fetch: svelteFetch
			};

			// Panggil controller untuk memperbarui status transaksi, status aset, dan kalkulasi denda
			const result = await returnsController.processReturn(supabase, profile, formData, midtransConfig);
			
			console.log('[processReturn Server] Controller execution result:', result);

			// Jika pemrosesan gagal di tingkat bisnis logic
			if (!result.success) {
				console.error('[processReturn Server] Action failed:', result.error);
				return fail(result.status || 500, { error: result.error });
			}

			return result;
		} catch (err) {
			// Catch block untuk mengantisipasi uncaught runtime exception (misal: JSON parsing error, lost DB connection)
			console.error('[processReturn Server] Uncaught exception in action:', err);
			return fail(500, { error: err instanceof Error ? err.message : String(err) });
		}
	}
};

