import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	// If already logged in, redirect to dashboard if profile is active
	const { session, profile } = await locals.safeGetSession();
	if (session) {
		if (profile) {
			if (profile.is_active) {
				throw redirect(303, '/dashboard');
			} else {
				return {
					error: 'account_deactivated',
					errorDescription: 'Akun Anda dinonaktifkan. Silakan hubungi Owner.'
				};
			}
		} else {
			return {
				error: 'profile_missing',
				errorDescription: 'Profil pengguna tidak ditemukan di database. Silakan hubungi Owner.'
			};
		}
	}

	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	return {
		error,
		errorDescription
	};
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
			console.error('OAuth error:', error);
			let message = 'Gagal menghubungi Google untuk login';
			if (error.message.includes('provider is not enabled')) {
				message = 'Metode login Google belum diaktifkan di Dashboard Supabase.';
			}
			return fail(400, { error: message });
		}

		throw redirect(303, data.url);
	},

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
