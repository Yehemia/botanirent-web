import { redirect } from '@sveltejs/kit';
import { dashboardController } from '$lib/server/controllers/dashboardController.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	return dashboardController.getDashboardData(supabase, profile);
}
