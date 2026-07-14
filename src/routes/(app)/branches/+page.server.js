import { error, fail } from '@sveltejs/kit';
import { branchController } from '$lib/server/controllers/branchController.js';

/** @type {import('./$types').PageServerLoad} */
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

/** @type {import('./$types').Actions} */
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
		const notes = formData.get('deactivation_notes')?.toString() || null;

		const result = await branchController.deactivateBranch(supabase, id, notes);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	activate: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		const result = await branchController.activateBranch(supabase, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};
