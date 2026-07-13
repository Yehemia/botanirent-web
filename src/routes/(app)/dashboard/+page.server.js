import { redirect } from '@sveltejs/kit';
import { dashboardController } from '$lib/server/controllers/dashboardController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, parent }) {
	const { supabase } = locals;
	const { session, profile } = await parent();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	return dashboardController.getDashboardData(supabase, profile);
}
