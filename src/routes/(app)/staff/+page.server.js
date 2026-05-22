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
	invite: async ({ request, locals: { safeGetSession } }) => {
		const { profile } = await safeGetSession();
		
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const role = formData.get('role');
		const branch_id = formData.get('branch_id');
		const full_name = formData.get('full_name');

		if (!email || !password || !role || !branch_id || !full_name) {
			return fail(400, { error: 'Semua field harus diisi.' });
		}

		if (password.toString().length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter.' });
		}

		// 1. Create user directly via Supabase Admin API
		const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
			email: email.toString(),
			password: password.toString(),
			email_confirm: true, // Langsung aktif tanpa verifikasi email
			user_metadata: { full_name: full_name.toString() }
		});

		if (createError) {
			console.error('Error creating user:', createError);
			if (createError.message.includes('already registered')) {
				return fail(400, { error: 'Email tersebut sudah terdaftar.' });
			}
			return fail(500, { error: 'Gagal membuat akun staff: ' + createError.message });
		}

		const userId = userData.user.id;

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
			console.error('Error updating profile after creation:', profileError);
			return fail(500, { error: 'Akun dibuat, namun gagal mengatur role/cabang.' });
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
