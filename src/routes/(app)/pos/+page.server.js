import { redirect } from '@sveltejs/kit';
import { posController } from '$lib/server/controllers/posController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const data = await posController.getPOSData(supabase, profile);
	return data;
}
