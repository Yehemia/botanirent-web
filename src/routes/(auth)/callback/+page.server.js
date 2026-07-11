import { redirect, fail } from '@sveltejs/kit';

/**
 * LOAD FUNCTION
 * Dijalankan di server saat halaman callback diakses (GET request).
 * Mengambil parameter dari URL dan menampilkannya di halaman.
 */
export const load = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/dashboard';
	const type = url.searchParams.get('type');
	const token_hash = url.searchParams.get('token_hash');

	// Tangkap error OAuth dari Supabase/Google
	const errorParam = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	if (errorParam) {
		console.error('OAuth Callback Error:', errorParam, errorDescription);
		throw redirect(
			303,
			`/login?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || '')}`
		);
	}

	// JIKA GOOGLE OAUTH CODE:
	// Google OAuth menggunakan parameter code. Langsung tukarkan di server side
	// karena Google OAuth tidak di-crawl oleh WhatsApp/bot prefetch.
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			if (type === 'invite' || type === 'recovery') {
				throw redirect(303, '/set-password');
			}
			throw redirect(303, next);
		} else {
			console.error('Error exchanging code for session:', error.message);
			throw redirect(
				303,
				`/login?error=auth_callback_failed&error_description=${encodeURIComponent(error.message)}`
			);
		}
	}

	// JIKA TOKEN HASH (Aktivasi WA / Reset Password via Link):
	// Return data ke frontend agar user mengklik tombol konfirmasi.
	// Ini menjamin link preview bots tidak mengonsumsi token OTP sekali pakai.
	if (token_hash) {
		return {
			token_hash,
			type,
			next
		};
	}

	// Fallback jika tidak ada parameter sama sekali
	throw redirect(303, '/login');
};

/**
 * ACTIONS
 * Menangani form submit POST dari tombol verifikasi di halaman callback.
 */
export const actions = {
	verify: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const token_hash = formData.get('token_hash');
		const type = formData.get('type')?.toString();
		const next = formData.get('next')?.toString() || '/dashboard';

		if (!token_hash) {
			return fail(400, { error: 'Token tidak valid atau telah kedaluwarsa.' });
		}

		console.log(`[Callback] Verifying token_hash via verifyOtp (${type})...`);
		const { error } = await supabase.auth.verifyOtp({
			token_hash: token_hash.toString(),
			type: type === 'recovery' ? 'recovery' : 'invite'
		});

		if (!error) {
			if (type === 'invite' || type === 'recovery') {
				throw redirect(303, '/set-password');
			}
			throw redirect(303, next);
		} else {
			console.error('Error verifying token_hash:', error.message);
			return fail(400, { error: 'Verifikasi gagal: ' + error.message });
		}
	}
};
