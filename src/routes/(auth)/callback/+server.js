import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/dashboard';
	const type = url.searchParams.get('type');

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Jika tipenya 'invite' atau 'recovery', arahkan ke set-password
			if (type === 'invite' || type === 'recovery') {
				throw redirect(303, '/set-password');
			}
			throw redirect(303, next);
		}
	}

	// Jika ada error atau tidak ada code, redirect ke login dengan error
	throw redirect(303, '/login?error=auth_callback_failed');
};
