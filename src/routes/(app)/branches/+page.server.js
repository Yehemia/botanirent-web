import { error, fail } from '@sveltejs/kit';
import { branchController } from '$lib/server/controllers/branchController.js';

export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const { profile } = await safeGetSession();

	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

	try {
		return await branchController.getBranches(supabase);
	} catch (err) {
		console.error('Error fetching branches in load:', err);
		throw error(500, 'Gagal memuat data cabang');
	}
};

export const actions = {
	save: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		const result = await branchController.saveBranch(supabase, id, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		const result = await branchController.deleteBranch(supabase, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};
