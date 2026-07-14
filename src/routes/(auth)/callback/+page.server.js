import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/dashboard';
	const type = url.searchParams.get('type');
	const token_hash = url.searchParams.get('token_hash');

	const errorParam = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	if (errorParam) {
		console.error('OAuth Callback Error:', errorParam, errorDescription);
		throw redirect(
			303,
			`/login?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || '')}`
		);
	}

	// Handle Google OAuth callback
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

	// Handle link verification callback (e.g. WA or password reset links)
	if (token_hash) {
		return {
			token_hash,
			type,
			next
		};
	}

	throw redirect(303, '/login');
};

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
