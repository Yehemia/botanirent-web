import { redirect } from '@sveltejs/kit';
import { statisticsController } from '$lib/server/controllers/statisticsController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, parent }) {
	const { supabase } = locals;
	const { session, profile } = await parent();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	const stats = await statisticsController.getStatistics(supabase, profile);

	return stats;
}
