import { redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	return packageController.getPackages(supabase, profile);
}
