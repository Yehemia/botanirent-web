import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { sendWhatsApp } from '$lib/server/fontee';

export const actions = {
	/**
	 * @param {{ request: Request, locals: { supabase: any }, url: URL }} context
	 */
	reset: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email) {
			return fail(400, {
				error: 'Email harus diisi'
			});
		}

		const emailStr = email.toString().trim();

		try {
			const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
			if (listError) {
				console.error('[Forgot Password Error] Failed to list users:', listError);
				return fail(500, {
					error: 'Gagal memproses permintaan reset password.'
				});
			}

			const existingUser = users.find(
				(/** @type {any} */ u) => u.email?.toLowerCase() === emailStr.toLowerCase()
			);

			if (!existingUser) {
				return fail(404, {
					error: 'Email tidak terdaftar dalam sistem.'
				});
			}

			const userId = existingUser.id;

			const { data: profile, error: profileError } = await supabaseAdmin
				.from('profiles')
				.select('full_name, phone')
				.eq('id', userId)
				.single();

			if (profileError || !profile) {
				console.error('[Forgot Password Error] Failed to fetch profile:', profileError);
				return fail(500, {
					error: 'Profil pengguna tidak ditemukan.'
				});
			}

			const phone = profile.phone;
			if (!phone || phone.trim() === '') {
				return fail(400, {
					error: 'Akun Anda tidak memiliki nomor WhatsApp yang terdaftar. Hubungi owner untuk mengatur ulang kata sandi.'
				});
			}

			const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
				type: 'recovery',
				email: emailStr,
				options: {
					redirectTo: `${url.origin}/callback?type=recovery`
				}
			});

			if (recoveryError) {
				console.error('[Forgot Password Error] Failed to generate recovery link:', recoveryError);
				return fail(500, {
					error: `Gagal membuat link reset password: ${recoveryError.message}`
				});
			}

			const recoveryLink = `${url.origin}/callback?token_hash=${recoveryData.properties.hashed_token}&type=recovery`;

			const cleanPhone = phone.replace(/[^0-9]/g, '');
			let waMessage = `Halo *${profile.full_name}*,\n\n`;
			waMessage += `Kami menerima permintaan untuk mereset kata sandi akun Anda (*${emailStr}*) di *BotaniRent*.\n\n`;
			waMessage += `Silakan klik tautan berikut untuk membuat kata sandi baru:\n${recoveryLink}\n\n`;
			waMessage += `Tautan ini hanya dapat digunakan sekali. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan pesan ini.`;

			const waResult = await sendWhatsApp(cleanPhone, waMessage);

			if (!waResult.success) {
				console.error('[Forgot Password Error] Failed to send WhatsApp:', waResult.message);
				return fail(500, {
					error: `Gagal mengirim WhatsApp: ${waResult.message}`
				});
			}

			return {
				success: true,
				email: emailStr,
				phone: phone
			};
		} catch (err) {
			console.error('[Forgot Password Error] Unexpected error:', err);
			return fail(500, {
				error: 'Terjadi kesalahan sistem internal.'
			});
		}
	}
};
