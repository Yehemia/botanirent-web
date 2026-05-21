import { error, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const { profile } = await safeGetSession();

	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

	// Fetch profiles (staff)
	const { data: staff, error: fetchError } = await supabase
		.from('profiles')
		.select('*, branches(name)')
		.order('created_at', { ascending: false });

	if (fetchError) {
		console.error('Error fetching staff:', fetchError);
		throw error(500, 'Gagal memuat data staff');
	}

	// Fetch branches for the dropdown
	const { data: branches } = await supabase
		.from('branches')
		.select('id, name')
		.eq('is_active', true)
		.order('name');

	return {
		staff,
		branches: branches || []
	};
};

export const actions = {
	invite: async ({ request, locals: { safeGetSession }, url }) => {
		const { profile } = await safeGetSession();
		
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const role = formData.get('role');
		const branch_id = formData.get('branch_id');
		const full_name = formData.get('full_name');

		if (!email || !role || !branch_id || !full_name) {
			return fail(400, { error: 'Semua field harus diisi.' });
		}

		// 1. Invite user via Supabase Admin API
		const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
			email.toString(),
			{ redirectTo: `${url.origin}/reset-password` }
		);

		if (inviteError) {
			console.error('Error inviting user:', inviteError);
			if (inviteError.message.includes('User already registered')) {
				return fail(400, { error: 'Email tersebut sudah terdaftar.' });
			}
			return fail(500, { error: 'Gagal mengirim email undangan.' });
		}

		const userId = inviteData.user.id;

		// 2. Update their profile with the assigned role, branch, and name
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
			console.error('Error updating profile after invite:', profileError);
			// We don't fail completely since the invite was sent, but we should notify
			return fail(500, { error: 'Undangan terkirim, namun gagal mengatur role/cabang. Silakan edit profil secara manual.' });
		}

		return { success: true };
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

		const { error } = await supabase
			.from('profiles')
			.update({ is_active })
			.eq('id', id);

		if (error) {
			return fail(500, { error: 'Gagal mengubah status staff.' });
		}

		return { success: true };
	}
};
