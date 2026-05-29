import { fail, redirect } from '@sveltejs/kit';
import { settingsController } from '$lib/server/controllers/settingsController.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	return settingsController.getRentalSettings(supabase);
}

export const actions = {
	updateRental: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const result = await settingsController.updateRentalSettings(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};
