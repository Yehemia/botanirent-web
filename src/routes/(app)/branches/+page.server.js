import { error, fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const { profile } = await safeGetSession();

	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

	const { data: branches, error: fetchError } = await supabase
		.from('branches')
		.select('*')
		.order('name');

	if (fetchError) {
		console.error('Error fetching branches:', fetchError);
		throw error(500, 'Gagal memuat data cabang');
	}

	return {
		branches
	};
};

export const actions = {
	save: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();
		
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name');
		const address = formData.get('address');
		const phone = formData.get('phone');
		const is_active = formData.get('is_active') === 'true';

		if (!name) {
			return fail(400, { error: 'Nama cabang harus diisi.' });
		}

		const branchData = {
			name: name.toString(),
			address: address ? address.toString() : null,
			phone: phone ? phone.toString() : null,
			is_active
		};

		let result;
		if (id) {
			// Update existing
			result = await supabase
				.from('branches')
				.update(branchData)
				.eq('id', id);
		} else {
			// Insert new
			result = await supabase
				.from('branches')
				.insert([branchData]);
		}

		if (result.error) {
			console.error('Error saving branch:', result.error);
			return fail(500, { error: 'Gagal menyimpan data cabang.' });
		}

		return { success: true };
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();
		
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) return fail(400, { error: 'ID tidak valid' });

		// Instead of actual delete, we just deactivate it usually, but let's allow hard delete for now
		// or maybe just rely on is_active for soft delete. Let's do hard delete if they really want to.
		const { error } = await supabase
			.from('branches')
			.delete()
			.eq('id', id);

		if (error) {
			return fail(500, { error: 'Gagal menghapus cabang (mungkin masih ada data terkait).' });
		}

		return { success: true };
	}
};
