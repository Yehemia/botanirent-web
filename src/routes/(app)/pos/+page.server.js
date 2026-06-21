/**
 * ============================================================
 * FILE: routes/(app)/pos/+page.server.js
 * TUJUAN: Logika server untuk Halaman Point of Sales (POS - Aplikasi Kasir).
 *
 * MENGAPA KODE INI DITULIS?
 *   Halaman POS adalah antarmuka utama kasir saat melayani transaksi sewa / beli.
 *   File ini memuat semua alat outdoor, paket sewa, data pelanggan, serta pengaturan
 *   toko (biaya ongkir, denda harian, dll) secara sekaligus agar aplikasi kasir terasa
 *   sangat responsif tanpa perlu sering loading database.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { posController } from '$lib/server/controllers/posController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum layar kasir POS dirender.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil semua data master katalog & pelanggan melalui controller
	const data = await posController.getPOSData(supabase, profile);
	return data;
}

