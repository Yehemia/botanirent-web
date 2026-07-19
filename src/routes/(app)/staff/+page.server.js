import { error, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { cacheGet, cacheInvalidate, cacheInvalidatePrefix } from '$lib/server/cache.js';
import { sendWhatsApp } from '$lib/server/fontee';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();

	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

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
		15000
	);

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
		30000
	);

	const [staff, branches] = await Promise.all([staffPromise, branchesPromise]);

	return {
		staff,
		branches
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
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

		if (!email || !role || !branch_id || !full_name || !phone) {
			return fail(400, { error: 'Semua field (termasuk nomor WhatsApp) harus diisi.' });
		}

		// Validasi nomor WhatsApp unik di profiles
		const phoneStr = phone.toString().trim();
		const { data: existingPhone, error: phoneCheckError } = await supabaseAdmin
			.from('profiles')
			.select('id, full_name')
			.eq('phone', phoneStr)
			.maybeSingle();

		if (phoneCheckError) {
			console.error('Error checking duplicate phone in profiles:', phoneCheckError);
		}

		if (existingPhone) {
			return fail(400, {
				error: `Nomor WhatsApp "${phoneStr}" sudah terdaftar pada akun staff "${existingPhone.full_name}".`
			});
		}

		// Validasi email unik pada staff aktif
		const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
		if (listError) {
			console.error('Error listing users to check email duplicate:', listError);
		} else if (users) {
			const existingUser = users.find(
				(/** @type {any} */ u) => u.email?.toLowerCase() === email.toString().trim().toLowerCase()
			);
			if (existingUser) {
				const { data: existingProfile } = await supabaseAdmin
					.from('profiles')
					.select('id, full_name')
					.eq('id', existingUser.id)
					.maybeSingle();

				if (existingProfile) {
					return fail(400, {
						error: `Email "${email.toString().trim()}" sudah terdaftar pada akun staff "${existingProfile.full_name}".`
					});
				}
			}
		}

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

		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

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
			action: 'invite',
			isExisting, 
			inviteLink, 
			waSuccess: waResult.success, 
			waError: waResult.success ? null : waResult.message,
			dbWarning 
		};
	},

	updateStatus: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile: currentUser } = await safeGetSession();
		if (currentUser?.role !== 'owner') return fail(403, { error: 'Akses ditolak.' });

		const formData = await request.formData();
		const id = formData.get('id');
		const is_active = formData.get('is_active') === 'true';

		if (id === currentUser.id) {
			return fail(400, { error: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
		}

		const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id);

		if (error) {
			return fail(500, { error: 'Gagal mengubah status staff.' });
		}

		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

		return { success: true, action: 'updateStatus' };
	},

	update: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile: currentUser } = await safeGetSession();
		if (currentUser?.role !== 'owner') return fail(403, { error: 'Akses ditolak.' });

		const formData = await request.formData();
		const id = formData.get('id');
		const full_name = formData.get('full_name');
		const role = formData.get('role');
		const branch_id = formData.get('branch_id');
		const phone = formData.get('phone');

		if (!id || !full_name || !role || !branch_id || !phone) {
			return fail(400, { error: 'Semua field harus diisi.' });
		}

		// Validasi nomor WhatsApp unik pada update staff
		const phoneStr = phone.toString().trim();
		const { data: existingPhone, error: phoneCheckError } = await supabase
			.from('profiles')
			.select('id, full_name')
			.eq('phone', phoneStr)
			.neq('id', id)
			.maybeSingle();

		if (phoneCheckError) {
			console.error('Error checking duplicate phone in profiles update:', phoneCheckError);
		}

		if (existingPhone) {
			return fail(400, {
				error: `Nomor WhatsApp "${phoneStr}" sudah terdaftar pada akun staff "${existingPhone.full_name}".`
			});
		}

		const { error } = await supabase
			.from('profiles')
			.update({
				full_name: full_name.toString(),
				role: role.toString(),
				branch_id: branch_id.toString(),
				phone: phone.toString()
			})
			.eq('id', id);

		if (error) {
			console.error('Error updating staff profile:', error);
			return fail(500, { error: 'Gagal memperbarui data staff: ' + error.message });
		}

		cacheInvalidate('staff_list');
		cacheInvalidatePrefix('staff_count_');

		return { success: true, action: 'update' };
	}
};
