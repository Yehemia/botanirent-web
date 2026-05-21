import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	throw redirect(303, '/dashboard');
}
