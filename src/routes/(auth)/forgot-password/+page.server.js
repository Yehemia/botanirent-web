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
			console.error('[Forgot Password Error]:', error);
			return fail(400, {
				error: `Gagal mengirim email reset password: ${error.message}`
			});
		}

		return {
			success: true,
			email: email.toString()
		};
	}
};
