import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	
	// Jika tidak ada sesi (link expired atau tidak valid), tendang ke login
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

		// Update password user baru (ini adalah tahap aktivasi akun)
		const { error } = await supabase.auth.updateUser({
			password: password.toString()
		});

		if (error) {
			return fail(400, { error: 'Gagal mengatur password: ' + error.message });
		}

		// Setelah berhasil, arahkan ke dashboard
		throw redirect(303, '/dashboard?message=account_activated');
	}
};
