/**
 * ============================================================
 * FILE: routes/(app)/activity-log/+page.server.js
 * TUJUAN: Logika server untuk halaman Log Aktivitas Staf/Sistem.
 *
 * MENGAPA KODE INI DITULIS?
 *   Halaman log aktivitas sangat penting untuk audit keamanan dan pemantauan
 *   tindakan staf (siapa melakukan apa dan kapan). Akses ke halaman ini
 *   harus dibatasi secara ketat hanya untuk pemilik (owner).
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { activityLogController } from '$lib/server/controllers/activityLogController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman log aktivitas dirender.
 *
 * Parameter:
 *   - locals: Untuk mengambil koneksi supabase dan status session/profile.
 *   - url: URL request saat ini, digunakan untuk membaca query parameters (?page=x).
 */
export async function load({ locals, url }) {
	const { supabase } = locals;
	
	// Cek status autentikasi user
	const { session, profile } = await locals.safeGetSession();

	// Jika belum login, arahkan ke login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// GUARD LAINNYA: Hanya memperbolehkan role 'owner' untuk mengakses halaman ini.
	// Jika kasir mencoba mengakses, lempar kembali ke dashboard.
	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	// Panggil controller untuk mengambil data log aktivitas dengan membawa searchParams
	// searchParams berisi parameter pencarian, filter, atau nomor halaman (pagination)
	return activityLogController.getActivityLogData(supabase, profile, url.searchParams);
}

