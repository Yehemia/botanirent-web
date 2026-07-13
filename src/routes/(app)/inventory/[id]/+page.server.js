import { fail, redirect } from '@sveltejs/kit';
import { itemController } from '$lib/server/controllers/itemController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner' && profile.role !== 'gudang') {
		throw redirect(303, '/inventory');
	}

	const result = await itemController.getItemDetails(supabase, profile, params.id);

	if (result.redirect) {
		throw redirect(303, result.redirect);
	}

	return {
		item: result.item,
		categories: result.categories
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ params, request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await itemController.updateItem(supabase, profile, params.id, formData);

		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		if (!result.success) {
			return fail(result.status || 500, { error: result.error, values: result.values });
		}

		return { success: true };
	}
};
