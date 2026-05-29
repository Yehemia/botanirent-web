import { redirect } from '@sveltejs/kit';
import { statisticsController } from '$lib/server/controllers/statisticsController.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	const stats = await statisticsController.getStatistics(supabase, profile);

	return stats;
}

