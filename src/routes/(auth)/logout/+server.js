/**
 * ============================================================
 * FILE: routes/(auth)/logout/+server.js
 * TUJUAN: API endpoint untuk proses LOGOUT user.
 *
 * MENGAPA pakai +server.js (bukan +page.server.js)?
 *   Logout tidak punya halaman tampilan sendiri.
 *   Ini murni operasi server: signOut → redirect ke /login.
 *   File +server.js cocok untuk endpoint yang hanya memproses data,
 *   bukan menampilkan halaman.
 *
 * CARA DIPANGGIL:
 *   Di Sidebar/TopBar ada form dengan method="POST" yang actionnya ke /logout.
 *   Ketika form di-submit → browser kirim POST request ke sini.
 *
 * PROSES:
 *   1. supabase.auth.signOut() → hapus session di Supabase + cookie
 *   2. throw redirect → paksa browser ke halaman /login
 *
 * HTTP 303 = "See Other"
 *   Status code standar untuk redirect setelah POST request selesai.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';

/**
 * Handler untuk HTTP POST request ke /logout.
 * Memanfaatkan destructuring dari locals untuk mengambil supabase client.
 */
export const POST = async ({ locals: { supabase } }) => {
	// Hapus session user dari Supabase (server + cookie browser)
	await supabase.auth.signOut();
	// Arahkan user ke halaman login setelah logout
	throw redirect(303, '/login');
};
