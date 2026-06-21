/**
 * ============================================================
 * FILE: routes/(app)/dashboard/+page.server.js
 * TUJUAN: Logika server untuk memuat ringkasan data di Halaman Beranda/Dashboard.
 *
 * MENGAPA KODE INI DITULIS?
 *   Menampilkan rangkuman statistik operasional (misal: total rental hari ini,
 *   aset yang sedang disewa, total denda) agar pemilik atau kasir mendapatkan
 *   gambaran cepat (quick insight) mengenai kondisi toko/cabang.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { dashboardController } from '$lib/server/controllers/dashboardController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum dashboard dirender.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard untuk autentikasi
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Delegasikan pengambilan data ringkasan dashboard ke dashboardController
	return dashboardController.getDashboardData(supabase, profile);
}

