import { inventoryController } from '$lib/server/controllers/inventoryController.js';
import { itemController } from '$lib/server/controllers/itemController.js';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		return { items: [], categories: [] };
	}

	return inventoryController.getInventoryData(supabase, profile);
}

/** @type {import('./$types').Actions} */
export const actions = {
	deactivate: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		if (profile.role !== 'owner' && profile.role !== 'gudang') {
			return fail(403, { error: 'Akses ditolak. Anda tidak memiliki izin untuk menonaktifkan barang.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		if (!id) {
			return fail(400, { error: 'ID barang tidak valid.' });
		}

		const result = await itemController.deactivateItem(supabase, profile, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	activate: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		if (profile.role !== 'owner' && profile.role !== 'gudang') {
			return fail(403, { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengaktifkan barang.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		if (!id) {
			return fail(400, { error: 'ID barang tidak valid.' });
		}

		const result = await itemController.activateItem(supabase, profile, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};
