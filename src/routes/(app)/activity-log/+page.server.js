import { redirect } from '@sveltejs/kit';
import { activityLogController } from '$lib/server/controllers/activityLogController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	return activityLogController.getActivityLogData(supabase, profile, url.searchParams);
}
