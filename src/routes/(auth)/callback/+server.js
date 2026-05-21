import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, '/dashboard');
		}
	}

	// If there's an error or no code, redirect to login with error
	throw redirect(303, '/login?error=oauth_failed');
};
