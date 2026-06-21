/**
 * ============================================================
 * FILE: routes/(app)/+page.server.js
 * TUJUAN: Menangani redirect ketika user mengakses route utama "/"
 *         tetapi dalam konteks grup "(app)" (sudah login/halaman dalam).
 *
 * MENGAPA KODE INI DITULIS?
 *   Ketika user membuka halaman utama aplikasi (misal: domain.com/),
 *   dan mereka berada di dalam grup route utama, kita ingin mengarahkan
 *   mereka langsung ke dashboard. Ini adalah pola "default redirect"
 *   agar user tidak melihat halaman kosong atau 404.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman dirender.
 * Di sini fungsinya murni untuk memeriksa status login dan melakukan pengalihan (redirect).
 */
export async function load({ locals }) {
	// Ambil session dan profile dari middleware locals (yang diset di hooks.server.js)
	const { session, profile } = await locals.safeGetSession();

	// Jika belum login atau profil tidak ada, arahkan paksa ke halaman login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Jika sudah login, secara default langsung dialihkan ke "/dashboard"
	throw redirect(303, '/dashboard');
}

