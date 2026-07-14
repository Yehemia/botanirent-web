import { fail, redirect } from '@sveltejs/kit';
import { settingsController } from '$lib/server/controllers/settingsController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	return settingsController.getRentalSettings(supabase);
}

/** @type {import('./$types').Actions} */
export const actions = {
	updateRental: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		if (profile.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak. Hanya owner yang diizinkan.' });
		}

		const formData = await request.formData();
		const result = await settingsController.updateRentalSettings(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};
