import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// If already logged in, redirect to dashboard
	const { session } = await locals.safeGetSession();
	if (session) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, {
				error: 'Email dan password harus diisi',
				email
			});
		}

		const { error } = await supabase.auth.signInWithPassword({
			email: email.toString(),
			password: password.toString()
		});

		if (error) {
			let errorMsg = 'Email atau password salah.';
			if (error.message.includes('Invalid login credentials')) {
				errorMsg = 'Email atau password salah.';
			}
			return fail(400, {
				error: errorMsg,
				email
			});
		}

		// Login successful, safeGetSession will handle the rest on the next request
		throw redirect(303, '/dashboard');
	},
	
	googleOauth: async ({ locals: { supabase }, url }) => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/callback`
			}
		});

		if (error) {
			return fail(400, { error: 'Gagal menghubungi Google untuk login' });
		}

		throw redirect(303, data.url);
	}
};
