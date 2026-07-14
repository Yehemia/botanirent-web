import { fail, redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

export async function load({ params, locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner' && profile.role !== 'gudang') {
		throw redirect(303, '/packages');
	}

	const data = await packageController.getPackage(supabase, profile, params.id);
	
	if (data.redirect) {
		throw redirect(303, data.redirect);
	}

	return data;
}

export const actions = {
	default: async ({ params, request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await packageController.updatePackage(supabase, profile, params.id, formData);

		if (!result.success) {
			if (result.redirect) {
				throw redirect(303, result.redirect);
			}
			return fail(result.status || 500, { error: result.error, ...result.values });
		}

		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		return { success: true };
	}
};
