import { fail, redirect } from '@sveltejs/kit';
import { itemController } from '$lib/server/controllers/itemController.js';
import { categoryModel } from '$lib/server/models/categoryModel.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/login');
	}

	const categories = await categoryModel.getCategories(supabase);

	return {
		categories
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const file = formData.get('file');

		const result = await itemController.bulkUpload(supabase, profile, file);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true, count: result.count };
	}
};
