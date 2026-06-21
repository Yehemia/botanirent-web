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

export const actions = {
	/**
	 * Handler tombol "Kirim Link Reset" di form lupa password.
	 *
	 * @param {{ request: Request, locals: { supabase: any }, url: URL }} context
	 */
	reset: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		// Validasi: email wajib diisi
		if (!email) {
			return fail(400, {
				error: 'Email harus diisi'
			});
		}

		// Kirim email reset password via Supabase Auth
		// redirectTo = URL tujuan setelah user klik link di email
		const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
			redirectTo: `${url.origin}/set-password` // Misal: "https://app.com/set-password"
		});

		if (error) {
			console.error('[Forgot Password Error]:', error);
			return fail(400, {
				error: `Gagal mengirim email reset password: ${error.message}`
			});
		}

		// Berhasil: kembalikan data untuk ditampilkan di halaman
		// (halaman akan tampilkan pesan "Email berhasil dikirim ke xxx@xxx.com")
		return {
			success: true,
			email: email.toString() // Dikembalikan agar halaman bisa tampilkan email-nya
		};
	}
};
