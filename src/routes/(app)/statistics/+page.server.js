/**
 * ============================================================
 * FILE: routes/(app)/statistics/+page.server.js
 * TUJUAN: Logika server untuk Halaman Statistik Bisnis (Analytics & Reporting).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk memuat laporan keuangan, grafik pertumbuhan rental, dan analisis performa item.
 *   Karena halaman ini menampilkan data sensitif berupa omzet dan margin profit,
 *   akses dibatasi secara ketat hanya untuk peran 'owner'.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { statisticsController } from '$lib/server/controllers/statisticsController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum grafik analisis statistik dirender di halaman.
 */
export async function load({ locals, parent }) {
	const { supabase } = locals;
	const { session, profile } = await parent();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Guard Hak Akses: Hanya owner yang boleh melihat statistik keuangan/analisis
	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	// Panggil controller untuk melakukan kalkulasi statistik agregat dari DB
	const stats = await statisticsController.getStatistics(supabase, profile);

	return stats;
}

