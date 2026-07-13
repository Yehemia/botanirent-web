import { fail, redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const data = await packageController.getNewPackageData(supabase, profile);
	return data;
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await packageController.createPackage(supabase, profile, formData);

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
