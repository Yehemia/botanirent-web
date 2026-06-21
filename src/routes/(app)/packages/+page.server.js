/**
 * ============================================================
 * FILE: routes/(app)/packages/+page.server.js
 * TUJUAN: Logika server untuk memuat Daftar Paket Bundling Sewa (Paket Camping/Hike Packages).
 *
 * MENGAPA KODE INI DITULIS?
 *   Aplikasi Botanirent menyediakan fitur "Paket" (misalnya Paket Camping Keluarga, Paket Hiking Gunung)
 *   yang menggabungkan beberapa item alat outdoor (tenda, matras, dll) dalam satu harga sewa khusus.
 *   File ini memuat semua daftar paket yang tersedia untuk ditampilkan di UI.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman daftar paket dirender.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard untuk login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Panggil controller untuk mengambil daftar paket aktif beserta detail item di dalamnya
	return packageController.getPackages(supabase, profile);
}

