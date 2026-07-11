/**
 * ============================================================
 * FILE: routes/(auth)/login/+page.server.js
 * TUJUAN: Logika server untuk halaman LOGIN.
 *
 * FITUR LOGIN YANG TERSEDIA:
 *   1. Login email + password (paling umum)
 *   2. Login Google OAuth (redirect ke Google, lalu kembali via /callback)
 *   3. Login Google Token (dari app mobile — kirim id_token Google langsung)
 *
 * KONSEP load() vs actions:
 *   load() = dijalankan SEBELUM halaman tampil → cek apakah sudah login
 *   actions = dijalankan saat USER SUBMIT FORM → proses login
 *
 * KONSEP fail():
 *   fail(statusCode, data) = return error dari action ke halaman.
 *   Halaman Svelte menangkap ini via $page.form dan menampilkan pesan error.
 *
 * KONSEP throw redirect():
 *   Setelah login berhasil → throw redirect ke dashboard.
 *   'throw' di SvelteKit adalah cara "khusus" untuk menghentikan eksekusi
 *   dan langsung mengarahkan user ke halaman lain.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';

/**
 * LOAD FUNCTION: Dijalankan sebelum halaman login tampil.
 *
 * CEK APAKAH SUDAH LOGIN:
 *   - Jika sudah login + profil aktif → redirect ke dashboard (tidak perlu login lagi)
 *   - Jika sudah login tapi profil tidak aktif → tampilkan error "akun dinonaktifkan"
 *   - Jika belum login → tampilkan form login (return data error dari URL jika ada)
 */
export const load = async ({ locals, url }) => {
	const code = url.searchParams.get('code');
	const type = url.searchParams.get('type');
	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			if (type === 'invite' || type === 'recovery') {
				throw redirect(303, '/set-password');
			}
			throw redirect(303, '/dashboard');
		} else {
			console.error('Error exchanging code in login page load:', error.message);
		}
	}

	const { session, profile } = await locals.safeGetSession();
	if (session) {
		if (profile) {
			if (profile.is_active) {
				// Sudah login dan akun aktif → langsung ke dashboard
				throw redirect(303, '/dashboard');
			} else {
				// Sudah login tapi akun dinonaktifkan oleh owner
				return {
					error: 'account_deactivated',
					errorDescription: 'Akun Anda dinonaktifkan. Silakan hubungi Owner.'
				};
			}
		} else {
			// Ada session tapi tidak ada profil di database (kondisi aneh/bug)
			return {
				error: 'profile_missing',
				errorDescription: 'Profil pengguna tidak ditemukan di database. Silakan hubungi Owner.'
			};
		}
	}

	// Ambil error dari URL parameter (jika ada redirect dari callback dengan error)
	// Contoh: /login?error=auth_callback_failed&error_description=...
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	return {
		error,
		errorDescription
	};
};

export const actions = {
	/**
	 * LOGIN EMAIL + PASSWORD (metode standar)
	 *
	 * supabase.auth.signInWithPassword():
	 *   Mengirim email+password ke Supabase Auth.
	 *   Jika berhasil → Supabase buat session + set cookie di browser.
	 *   Session ini dipakai di semua request berikutnya (hooks.server.js).
	 */
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, {
				error: 'Email dan password harus diisi',
				email // Kembalikan email agar tidak hilang dari form
			});
		}

		const { error } = await supabase.auth.signInWithPassword({
			email: email.toString(),
			password: password.toString()
		});

		if (error) {
			console.error('Login auth error:', error);
			let errorMsg = error.message || 'Email atau password salah.';
			if (error.message.includes('Invalid login credentials')) {
				errorMsg = 'Email atau password salah.';
			}
			return fail(400, {
				error: errorMsg,
				email
			});
		}

		// Login berhasil → redirect ke dashboard
		// SvelteKit otomatis membaca session dari cookie di request berikutnya
		throw redirect(303, '/dashboard');
	},

	/**
	 * LOGIN GOOGLE OAUTH (login via akun Google)
	 *
	 * ALUR:
	 * 1. Client submit form → server meminta URL OAuth ke Supabase
	 * 2. Server redirect user ke URL tersebut (halaman Google)
	 * 3. User pilih akun Google → Google redirect ke /callback
	 * 4. /callback tukarkan code dengan session → redirect ke /dashboard
	 *
	 * redirectTo: URL yang Google akan redirect setelah login berhasil.
	 *   Harus di-daftarkan di Supabase Dashboard sebagai "Allowed Redirect URL".
	 */
	googleOauth: async ({ locals: { supabase }, url }) => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/callback` // Misal: "https://app.com/callback"
			}
		});

		if (error) {
			console.error('OAuth error:', error);
			let message = 'Gagal menghubungi Google untuk login';
			if (error.message.includes('provider is not enabled')) {
				message = 'Metode login Google belum diaktifkan di Dashboard Supabase.';
			}
			return fail(400, { error: message });
		}

		// data.url = URL OAuth Google yang harus dikunjungi user
		throw redirect(303, data.url);
	},

	/**
	 * LOGIN GOOGLE NATIVE (dari app mobile)
	 *
	 * PERBEDAAN dengan googleOauth:
	 *   googleOauth → untuk web browser (redirect flow)
	 *   googleTokenLogin → untuk app mobile yang sudah punya id_token dari Google SDK
	 *
	 * App mobile Android/iOS bisa langsung dapat id_token dari Google.
	 * Token ini dikirim ke server dan di-verifikasi oleh Supabase.
	 *
	 * supabase.auth.signInWithIdToken():
	 *   Verifikasi token Google langsung (tanpa redirect flow).
	 */
	googleTokenLogin: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const idToken = formData.get('idToken');

		if (!idToken) {
			return fail(400, { error: 'ID Token tidak ditemukan' });
		}

		const { data, error } = await supabase.auth.signInWithIdToken({
			provider: 'google',
			token: idToken.toString()
		});

		if (error) {
			console.error('Native sign-in verification error:', error);
			return fail(400, { error: 'Verifikasi login Google gagal: ' + error.message });
		}

		throw redirect(303, '/dashboard');
	}
};
