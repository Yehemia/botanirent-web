import { redirect, fail } from '@sveltejs/kit';
import { penaltiesController } from '$lib/server/controllers/penaltiesController.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const result = await penaltiesController.getPenaltyRules(supabase, profile);

	if (result.redirect) {
		throw redirect(303, result.redirect);
	}

	return {
		penaltyRules: result.penaltyRules || []
	};
}

export const actions = {
	updateRule: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const result = await penaltiesController.updatePenaltyRule(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error, values: result.values });
		}

		return { success: true };
	}
};
