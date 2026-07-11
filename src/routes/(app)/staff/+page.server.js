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
import { sendWhatsApp } from '$lib/server/fontee';

/**
 * LOAD FUNCTION
 * Dijalankan di server untuk mengambil daftar staff aktif/nonaktif dan daftar cabang toko.
 */
export const load = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();

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
		const phone = formData.get('phone');

		// Validasi input wajib
		if (!email || !role || !branch_id || !full_name || !phone) {
			return fail(400, { error: 'Semua field (termasuk nomor WhatsApp) harus diisi.' });
		}

		// LANGKAH 1: Generate link aktivasi via Admin Client (tanpa kirim email)
		let userId;
		let inviteLink = null;
		let isExisting = false;

		const { data: linkData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
			type: 'invite',
			email: email.toString(),
			options: {
				redirectTo: `${url.origin}/callback?type=invite`,
				data: { full_name: full_name.toString() }
			}
		});

		if (inviteError) {
			const isAlreadyRegistered = inviteError.status === 422 || 
				inviteError.code === 'email_exists' || 
				inviteError.message.includes('already registered') || 
				inviteError.message.includes('already exists');

			if (isAlreadyRegistered) {
				console.log(`User ${email} already exists in auth.users. Fetching details for recovery link...`);
				isExisting = true;

				// Fetch existing users to retrieve user ID
				const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
				if (listError) {
					console.error('Error listing users for recovery:', listError);
					return fail(500, { error: 'Email sudah terdaftar, dan gagal memuat detail user.' });
				}

				const existingUser = users.find((/** @type {any} */ u) => u.email === email.toString());
				if (!existingUser) {
					return fail(500, { error: 'Email sudah terdaftar, tetapi detail user tidak ditemukan.' });
				}

				userId = existingUser.id;

				// Buat link recovery/reset password manual
				const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
					type: 'recovery',
					email: email.toString(),
					options: {
						redirectTo: `${url.origin}/callback?type=recovery`
					}
				});

				if (recoveryError) {
					return fail(500, { error: 'Gagal membuat link reset password: ' + recoveryError.message });
				}
				inviteLink = `${url.origin}/callback?token_hash=${recoveryData.properties.hashed_token}&type=recovery`;
			} else {
				console.error('Error generating link:', inviteError);
				return fail(500, { error: 'Gagal memproses pendaftaran staff: ' + inviteError.message });
			}
		} else {
			userId = linkData.user.id;
			inviteLink = `${url.origin}/callback?token_hash=${linkData.properties.hashed_token}&type=invite`;
		}

		// LANGKAH 2: Update tabel public.profiles untuk mencatat detail nama, role, cabang, dan nomor telepon.
		let dbWarning = null;
		const { error: profileError } = await supabaseAdmin
			.from('profiles')
			.update({
				full_name: full_name.toString(),
				role: role.toString(),
				branch_id: branch_id.toString(),
				is_active: true,
				phone: phone.toString()
			})
			.eq('id', userId);

		if (profileError) {
			console.warn('Error updating profile with phone column, retrying without phone...', profileError.message);
			if (profileError.message.includes('phone') || profileError.message.includes('column') || profileError.message.includes('not exist')) {
				// Retry without phone column
				const { error: retryError } = await supabaseAdmin
					.from('profiles')
					.update({
						full_name: full_name.toString(),
						role: role.toString(),
						branch_id: branch_id.toString(),
						is_active: true
					})
					.eq('id', userId);

				if (retryError) {
					console.error('Error retrying profile update:', retryError);
					return fail(500, { error: 'Akun dibuat, namun gagal mengatur role/cabang.' });
				}
				dbWarning = 'Kolom phone belum dibuat di tabel profiles. Akun berhasil dibuat tanpa menyimpan nomor telepon di database.';
			} else {
				return fail(500, { error: 'Akun dibuat, namun gagal mengatur role/cabang: ' + profileError.message });
			}
		}

		// Invalidasi cache staff agar data langsung terupdate tanpa perlu reload
		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

		// LANGKAH 3: Kirim WhatsApp via Fontee
		const cleanPhone = phone.toString().replace(/[^0-9]/g, '');
		const formattedRole = role.toString() === 'kasir' ? 'Kasir' : 'Admin Gudang';
		
		let waMessage = `Halo *${full_name.toString()}*.\n\n`;
		waMessage += `Anda telah diundang sebagai *${formattedRole}* di *BotaniRent*.\n\n`;
		if (isExisting) {
			waMessage += `Silakan atur ulang kata sandi akun Anda melalui tautan berikut:\n${inviteLink}`;
		} else {
			waMessage += `Silakan aktifkan akun Anda dan buat kata sandi baru melalui tautan berikut:\n${inviteLink}`;
		}

		const waResult = await sendWhatsApp(cleanPhone, waMessage);

		return { 
			success: true, 
			isExisting, 
			inviteLink, 
			waSuccess: waResult.success, 
			waError: waResult.success ? null : waResult.message,
			dbWarning 
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

