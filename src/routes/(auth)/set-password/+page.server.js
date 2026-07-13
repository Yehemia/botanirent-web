import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url, locals: { supabase, safeGetSession } }) => {
	const code = url.searchParams.get('code');

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error('Error exchanging code for session:', error.message);
			throw redirect(303, '/login?error=invalid_token');
		}
	}

	const { session } = await safeGetSession();

	if (!session) {
		throw redirect(303, '/login?error=link_expired');
	}

	return {};
};

export const actions = {
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

		const { error } = await supabase.auth.updateUser({
			password: password.toString()
		});

		if (error) {
			return fail(400, { error: 'Gagal mengatur password: ' + error.message });
		}

		throw redirect(303, '/dashboard?message=account_activated');
	}
};
