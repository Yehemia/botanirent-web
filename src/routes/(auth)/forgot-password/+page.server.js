import { fail } from '@sveltejs/kit';

export const actions = {
	reset: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email) {
			return fail(400, {
				error: 'Email harus diisi'
			});
		}

		const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
			redirectTo: `${url.origin}/set-password`
		});

		if (error) {
			return fail(400, {
				error: 'Gagal mengirim email reset password. Pastikan email terdaftar.'
			});
		}

		return {
			success: true,
			email: email.toString()
		};
	}
};
