/**
 * ============================================================
 * FILE: routes/(auth)/callback/+server.js
 * TUJUAN: Endpoint yang menangani CALLBACK dari Supabase setelah login OAuth
 *         atau setelah user klik link dari email (invite/reset password).
 *
 * KAPAN ENDPOINT INI DIPANGGIL?
 *   1. Setelah user login via Google OAuth → Google redirect ke sini
 *   2. Setelah user klik link invite dari email → Supabase redirect ke sini
 *   3. Setelah user klik link reset password → Supabase redirect ke sini
 *
 * URL yang diterima:
 *   /callback?code=AUTH_CODE&next=/dashboard
 *   /callback?code=AUTH_CODE&type=invite
 *   /callback?code=AUTH_CODE&type=recovery
 *   /callback?error=access_denied&error_description=...
 *
 * KONSEP PKCE (Authorization Code Flow):
 *   'code' di URL = kode sementara (sekali pakai) dari Supabase/Google.
 *   Kode ini harus ditukar dengan session yang sesungguhnya via
 *   supabase.auth.exchangeCodeForSession(code).
 *   Setelah ditukar, kode tidak bisa dipakai lagi.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';

/**
 * Handler untuk HTTP GET request ke /callback.
 * Dipanggil oleh Supabase/Google setelah proses OAuth.
 *
 * @param {{ url: URL, locals: { supabase: any } }} context
 */
export const GET = async ({ url, locals: { supabase } }) => {
	// Ambil parameter dari URL callback
	const code = url.searchParams.get('code'); // Kode otorisasi dari Supabase/Google
	const next = url.searchParams.get('next') || '/dashboard'; // Tujuan setelah berhasil
	const type = url.searchParams.get('type'); // 'invite', 'recovery', atau null

	// Tangkap error OAuth dari Supabase/Google (misal user cancel, atau provider error)
	const errorParam = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	if (errorParam) {
		console.error('OAuth Callback Error:', errorParam, errorDescription);
		// Redirect ke login dengan pesan error yang aman (URL-encoded)
		throw redirect(
			303,
			`/login?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || '')}`
		);
	}

	if (code) {
		// Tukarkan authorization code dengan session yang sesungguhnya
		// Ini adalah langkah WAJIB dalam PKCE flow (keamanan OAuth)
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Berhasil tukar code dengan session
			if (type === 'invite' || type === 'recovery') {
				// Undangan staf baru atau reset password → arahkan ke set-password
				// agar user bisa set password baru mereka
				throw redirect(303, '/set-password');
			}
			// Login biasa → arahkan ke halaman tujuan (default: /dashboard)
			throw redirect(303, next);
		} else {
			console.error('Error exchanging code for session:', error.message);
			// Gagal tukar code → arahkan ke login dengan pesan error
			throw redirect(
				303,
				`/login?error=auth_callback_failed&error_description=${encodeURIComponent(error.message)}`
			);
		}
	}

	// Tidak ada code di URL (seharusnya tidak terjadi, tapi handle agar tidak crash)
	console.error('No authorization code found in callback URL.');
	throw redirect(
		303,
		'/login?error=auth_callback_failed&error_description=Missing+authorization+code'
	);
};
