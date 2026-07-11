/**
 * ============================================================
 * FILE: routes/(auth)/forgot-password/+page.server.js
 * TUJUAN: Logika server untuk halaman LUPA PASSWORD.
 *
 * ALUR LUPA PASSWORD:
 *   1. User masukkan email di form → kirim form ini
 *   2. Supabase kirim email dengan MAGIC LINK ke user
 *   3. User klik link di email → diarahkan ke /callback
 *   4. /callback arahkan ke /set-password
 *   5. User set password baru di halaman set-password
 *
 * KONSEP FORM ACTIONS di SvelteKit:
 *   'actions' = objek berisi handler untuk setiap tombol submit di form.
 *   Form HTML punya attribute action="?/reset" → memanggil handler 'reset' ini.
 *
 * KONSEP fail():
 *   fail(statusCode, data) = return error dari action ke halaman Svelte.
 *   Hasilnya tersedia di halaman sebagai $page.form (Svelte variable).
 *   Halaman bisa menampilkan pesan error sesuai data yang dikirim.
 *
 * redirectTo:
 *   URL yang dikirim ke Supabase sebagai tujuan redirect setelah user klik email.
 *   Format: "https://namaapp.com/set-password"
 *   url.origin = host aplikasi saat ini (misal: "https://botanirent.vercel.app")
 * ============================================================
 */

import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { sendWhatsApp } from '$lib/server/fontee';

export const actions = {
	/**
	 * Handler tombol "Kirim Link Reset" di form lupa password.
	 *
	 * @param {{ request: Request, locals: { supabase: any }, url: URL }} context
	 */
	reset: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		// Validasi: email wajib diisi
		if (!email) {
			return fail(400, {
				error: 'Email harus diisi'
			});
		}

		const emailStr = email.toString().trim();

		try {
			// 1. Cari user di auth.users berdasarkan email
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

			// 2. Ambil detail profil user untuk mengambil nama dan nomor WhatsApp
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

			// 3. Generate link recovery/reset password manual
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

			// 4. Kirim WhatsApp via Fonnte
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

			// Berhasil: kembalikan data untuk ditampilkan di halaman
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
