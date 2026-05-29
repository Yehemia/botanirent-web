import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/dashboard';
	const type = url.searchParams.get('type');

	// Capture any OAuth-specific errors from Supabase / Google
	const errorParam = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	if (errorParam) {
		console.error('OAuth Callback Error:', errorParam, errorDescription);
		throw redirect(
			303,
			`/login?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || '')}`
		);
	}

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Jika tipenya 'invite' atau 'recovery', arahkan ke set-password
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

	// Jika ada error atau tidak ada code, redirect ke login dengan error
	console.error('No authorization code found in callback URL.');
	throw redirect(
		303,
		'/login?error=auth_callback_failed&error_description=Missing+authorization+code'
	);
};
