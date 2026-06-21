/**
 * ============================================================
 * FILE: routes/(auth)/set-password/+page.server.js
 * TUJUAN: Logika server untuk halaman SET PASSWORD.
 *         Dipakai dalam 2 skenario:
 *
 *   SKENARIO 1: Aktivasi akun staf baru (invite)
 *     Owner undang staf → staf dapat email → klik link → sampai di sini
 *     Staf set password untuk pertama kali
 *
 *   SKENARIO 2: Reset password (lupa password)
 *     User submit lupa password → dapat email → klik link → sampai di sini
 *     User set password baru
 *
 * ALUR TEKNIS:
 *   1. load(): Cek apakah ada ?code= di URL (dari email Supabase)
 *      → Jika ada, tukarkan dulu dengan session
 *      → Jika tidak ada session setelah exchange → link expired/invalid
 *   2. actions.default: Proses form set password baru
 *      → Validasi password match
 *      → Update password via Supabase
 *      → Redirect ke dashboard
 *
 * CATATAN PENTING:
 *   supabase.auth.updateUser({ password }) hanya bisa dipanggil jika
 *   user sudah punya session yang valid (tidak bisa tanpa autentikasi).
 *   Itulah mengapa load() harus berhasil exchange code dulu.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';

/**
 * LOAD FUNCTION: Dijalankan sebelum halaman set-password tampil.
 * Memastikan user punya session yang valid (dari link email).
 */
export const load = async ({ url, locals: { supabase, safeGetSession } }) => {
	const code = url.searchParams.get('code'); // Kode dari URL email Supabase

	if (code) {
		// Tukarkan kode email dengan session aktif
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error('Error exchanging code for session:', error.message);
			// Link tidak valid/expired → tendang ke login
			throw redirect(303, '/login?error=invalid_token');
		}
		// Setelah exchange berhasil, lanjut ke pengecekan session di bawah
	}

	// Verifikasi bahwa user punya session (bisa dari code tadi, atau dari cookie)
	const { session } = await safeGetSession();

	if (!session) {
		// Tidak ada session → link sudah expired atau tidak valid
		throw redirect(303, '/login?error=link_expired');
	}

	// Session valid → halaman set-password boleh tampil
	return {};
};

export const actions = {
	/**
	 * Handler form "Set Password Baru".
	 * Dipanggil ketika user submit form password baru di halaman set-password.
	 *
	 * VALIDASI:
	 *   1. Kedua field wajib diisi
	 *   2. Password dan konfirmasi password harus sama
	 *
	 * supabase.auth.updateUser({ password }):
	 *   Update password user yang sedang ter-autentikasi.
	 *   Hanya bisa dipanggil jika ada session aktif (sudah dicek di load()).
	 */
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		if (!password || !confirmPassword) {
			return fail(400, { error: 'Password harus diisi' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Password tidak cocok' });
		}

		// Update password user — ini juga sebagai tahap AKTIVASI AKUN bagi staf baru
		const { error } = await supabase.auth.updateUser({
			password: password.toString()
		});

		if (error) {
			return fail(400, { error: 'Gagal mengatur password: ' + error.message });
		}

		// Password berhasil di-set → redirect ke dashboard
		// ?message=account_activated → halaman bisa tampilkan pesan selamat datang
		throw redirect(303, '/dashboard?message=account_activated');
	}
};
