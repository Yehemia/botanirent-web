/**
 * ============================================================
 * FILE: routes/(app)/staff/+page.server.js
 * TUJUAN: Logika server untuk Pengelolaan Karyawan/Staf (Staff Management).
 *
 * MENGAPA KODE INI DITULIS?
 *   Aplikasi Botanirent memerlukan pengelolaan akun staf kasir/gudang.
 *   Halaman ini membatasi akses hanya untuk Owner dan mengimplementasikan:
 *     1. Supabase Admin SDK (Service Role) untuk mendaftarkan akun staf secara instan.
 *     2. Proteksi lockout agar owner tidak menonaktifkan dirinya sendiri secara tidak sengaja.
 *     3. Cache invalidation agar data baru segera terlihat di dashboard & tabel staff.
 * ============================================================
 */

import { error, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { cacheGet, cacheInvalidate, cacheInvalidatePrefix } from '$lib/server/cache.js';
import { RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';

/**
 * Helper to send staff invitation email via Resend API
 * @param {string} email
 * @param {string} full_name
 * @param {string} role
 * @param {string} branch_id
 * @param {string} inviteLink
 */
async function sendInviteEmail(email, full_name, role, branch_id, inviteLink) {
	if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_api_key_here') {
		console.warn('RESEND_API_KEY is not configured or uses placeholder. Skipping email.');
		return { success: false, error: 'API Key Resend belum dikonfigurasi di file .env' };
	}

	try {
		// Lookup branch name
		let branchName = 'Cabang Utama';
		try {
			const { data: branchData } = await supabaseAdmin
				.from('branches')
				.select('name')
				.eq('id', branch_id)
				.single();
			if (branchData) {
				branchName = branchData.name;
			}
		} catch (err) {
			console.error('Error fetching branch name for email:', err);
		}

		const roleDisplay = role === 'owner' ? 'Owner' : role === 'kasir' ? 'Kasir' : 'Admin Gudang';

		const emailHtml = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Undangan Bergabung Botani Rent</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f5; font-family: 'Outfit', 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
	<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f6f5; padding: 32px 16px;">
		<tr>
			<td align="center">
				<table width="100%" max-width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; box-shadow: 0 4px 12px rgba(28, 25, 23, 0.03); overflow: hidden; border-collapse: collapse;">
					<!-- Header -->
					<tr style="background-color: #15803d; text-align: center;">
						<td style="padding: 32px 24px;">
							<h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.025em;">Botani Rent</h1>
							<p style="margin: 4px 0 0 0; color: #bbf7d0; font-size: 14px; font-weight: 500;">Pintu Gerbang Kelola Bisnis Sewa & Retail</p>
						</td>
					</tr>
					<!-- Content -->
					<tr>
						<td style="padding: 40px 32px; color: #44403c;">
							<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1c1917;">Halo, ${full_name}!</h2>
							<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #57534e;">
								Anda telah diundang untuk bergabung dengan tim operasional **Botani Rent** sebagai staff **${roleDisplay}** untuk penempatan di **${branchName}**.
							</p>
							
							<!-- Action Button -->
							<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
								<tr>
									<td align="center">
										<a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #16a34a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2); transition: background-color 0.2s;">
											Aktifkan Akun & Buat Password
										</a>
									</td>
								</tr>
							</table>
							
							<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #78716c;">
								Jika tombol di atas tidak dapat diklik, salin dan buka tautan di bawah ini di browser Anda:
							</p>
							<div style="background-color: #f5f5f4; border-radius: 6px; border: 1px solid #e7e5e4; padding: 12px; margin-bottom: 24px; word-break: break-all;">
								<a href="${inviteLink}" style="font-family: monospace; font-size: 13px; color: #15803d; text-decoration: none;">${inviteLink}</a>
							</div>
							
							<hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 32px 0;">
							<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #a8a29e;">
								Tautan ini bersifat rahasia dan hanya dapat digunakan satu kali untuk mengaktifkan akun Anda. Jika Anda tidak merasa didaftarkan, abaikan saja email ini.
							</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr style="background-color: #f5f5f4; text-align: center; border-top: 1px solid #e7e5e4;">
						<td style="padding: 24px; color: #a8a29e; font-size: 12px;">
							<p style="margin: 0 0 4px 0;">&copy; 2026 Botani Rent. Semua hak cipta dilindungi.</p>
							<p style="margin: 0;">Sistem Pengelolaan Inventaris, Penyewaan, & POS Karyawan</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;

		const resend = new Resend(RESEND_API_KEY);
		const { data, error } = await resend.emails.send({
			from: 'Botani Rent <onboarding@resend.dev>',
			to: email,
			subject: `Undangan Bergabung Staf Botani Rent - ${full_name}`,
			html: emailHtml
		});

		if (error) {
			console.error('Error from Resend service:', error);
			return { success: false, error: error.message };
		}

		console.log('Email successfully sent via Resend:', data);
		return { success: true };
	} catch (err) {
		console.error('Failed to execute Resend email send:', err);
		return { success: false, error: err instanceof Error ? err.message : String(err) };
	}
}

/**
 * LOAD FUNCTION
 * Dijalankan di server untuk mengambil daftar staff aktif/nonaktif dan daftar cabang toko.
 */
export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const { profile } = await safeGetSession();

	// Guard Hak Akses: Hanya Owner yang boleh mengakses manajemen karyawan
	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

	// 1. Ambil data profil staf dengan caching 15 detik untuk mengurangi beban DB
	const staffPromise = cacheGet(
		'staff_list',
		async () => {
			const { data, error: fetchError } = await supabase
				.from('profiles')
				.select('*, branches(name)')
				.order('created_at', { ascending: false });

			if (fetchError) {
				console.error('Error fetching staff:', fetchError);
				throw error(500, 'Gagal memuat data staff');
			}
			return data || [];
		},
		15000 // Cache selama 15 detik
	);

	// 2. Ambil daftar cabang aktif untuk dropdown di form undang staff
	const branchesPromise = cacheGet(
		'active_branches_dropdown',
		async () => {
			const { data, error: branchesError } = await supabase
				.from('branches')
				.select('id, name')
				.eq('is_active', true)
				.order('name');

			if (branchesError) {
				console.error('Error fetching branches for dropdown:', branchesError);
				throw error(500, 'Gagal memuat data cabang');
			}
			return data || [];
		},
		30000 // Cache selama 30 detik
	);

	// Ambil kedua data secara paralel
	const [staff, branches] = await Promise.all([staffPromise, branchesPromise]);

	return {
		staff,
		branches
	};
};

/**
 * SVELTEKIT FORM ACTIONS
 * Menyediakan aksi 'invite' (mendaftarkan staf baru) dan 'updateStatus' (mengaktifkan/nonaktifkan staf).
 */
export const actions = {
	/**
	 * Aksi 'invite': Mendaftarkan akun staf baru
	 * Menggunakan Supabase Admin API untuk langsung membuat user di auth.users bypass email confirmation.
	 */
	invite: async ({ request, url, locals: { safeGetSession } }) => {
		const { profile } = await safeGetSession();

		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const role = formData.get('role');
		const branch_id = formData.get('branch_id');
		const full_name = formData.get('full_name');

		// Validasi input wajib
		if (!email || !role || !branch_id || !full_name) {
			return fail(400, { error: 'Semua field harus diisi.' });
		}

		// LANGKAH 1: Buat user dan buat link undangan ke staff via Admin Client (generateLink)
		// generateLink membuat user di auth.users dan menghasilkan link aktivasi tanpa bergantung pada SMTP email lokal.
		const { data: linkData, error: createError } = await supabaseAdmin.auth.admin.generateLink({
			type: 'invite',
			email: email.toString(),
			options: {
				redirectTo: `${url.origin}/callback?type=invite`,
				data: { full_name: full_name.toString() }
			}
		});

		if (createError) {
			const isAlreadyRegistered = createError.status === 422 && 
				(createError.code === 'email_exists' || createError.message.includes('already registered') || createError.message.includes('already exists'));

			if (isAlreadyRegistered) {
				console.log(`User ${email} already exists in auth.users. Fetching existing user for update/recovery link...`);
				// Fetch existing users to retrieve user ID
				const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
				if (listError) {
					console.error('Error listing users for recovery link:', listError);
					return fail(500, { error: 'Email sudah terdaftar, dan gagal memuat detail user.' });
				}

				const existingUser = users.find((/** @type {any} */ u) => u.email === email.toString());
				if (!existingUser) {
					return fail(500, { error: 'Email sudah terdaftar, tetapi detail user tidak ditemukan.' });
				}

				const userId = existingUser.id;

				// Generate recovery link for existing user to let them reset password / activate
				const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
					type: 'recovery',
					email: email.toString(),
					options: {
						redirectTo: `${url.origin}/callback?type=recovery`
					}
				});

				if (recoveryError) {
					console.error('Error generating recovery link:', recoveryError);
					return fail(500, { error: 'Gagal membuat link reset password: ' + recoveryError.message });
				}

				const inviteLink = `${url.origin}/callback?token_hash=${recoveryData.properties.hashed_token}&type=recovery`;

				// Update existing profile details
				const { error: profileError } = await supabaseAdmin
					.from('profiles')
					.update({
						full_name: full_name.toString(),
						role: role.toString(),
						branch_id: branch_id.toString(),
						is_active: true
					})
					.eq('id', userId);

				if (profileError) {
					console.error('Error updating existing profile:', profileError);
					return fail(500, { error: 'Gagal memperbarui peran/cabang staff.' });
				}

				// Kirim email undangan/pemulihan via Resend
				const emailResult = await sendInviteEmail(
					email.toString(),
					full_name.toString(),
					role.toString(),
					branch_id.toString(),
					inviteLink
				);

				// Invalidasi cache staff agar data langsung terupdate tanpa perlu reload
				cacheInvalidate('staff_list');
				cacheInvalidatePrefix('staff_count_');

				return {
					success: true,
					inviteLink,
					isExisting: true,
					emailSent: emailResult.success,
					emailError: emailResult.error || null
				};
			}

			console.error('Error generating invite link:', createError);
			return fail(500, { error: 'Gagal mengundang staff: ' + createError.message });
		}

		const userId = linkData.user.id;
		const inviteLink = `${url.origin}/callback?token_hash=${linkData.properties.hashed_token}&type=invite`;

		// LANGKAH 2: Update tabel public.profiles untuk mencatat detail nama, role, dan cabangnya.
		// User ID diperoleh dari hasil kembalian auth.admin.generateLink di atas.
		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.update({
				full_name: full_name.toString(),
				role: role.toString(),
				branch_id: branch_id.toString(),
				is_active: true
			})
			.eq('id', userId);

		if (profileError) {
			console.error('Error updating profile after creation:', profileError);
			return fail(500, { error: 'Akun dibuat, namun gagal mengatur role/cabang.' });
		}

		// Kirim email undangan via Resend
		const emailResult = await sendInviteEmail(
			email.toString(),
			full_name.toString(),
			role.toString(),
			branch_id.toString(),
			inviteLink
		);

		// Invalidasi cache staff agar data langsung terupdate tanpa perlu reload
		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

		return {
			success: true,
			inviteLink,
			isExisting: false,
			emailSent: emailResult.success,
			emailError: emailResult.error || null
		};
	},

	/**
	 * Aksi 'updateStatus': Mengaktifkan atau menonaktifkan staf.
	 */
	updateStatus: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile: currentUser } = await safeGetSession();
		if (currentUser?.role !== 'owner') return fail(403, { error: 'Akses ditolak.' });

		const formData = await request.formData();
		const id = formData.get('id');
		const is_active = formData.get('is_active') === 'true';

		// PROTEKSI LOCKOUT: Cegah owner menonaktifkan dirinya sendiri.
		// Jika ini terjadi, tidak akan ada admin yang bisa login kembali untuk mengelola sistem.
		if (id === currentUser.id) {
			return fail(400, { error: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
		}

		// Update kolom is_active di tabel profiles
		const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id);

		if (error) {
			return fail(500, { error: 'Gagal mengubah status staff.' });
		}

		// Invalidasi cache staff
		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

		return { success: true };
	}
};

