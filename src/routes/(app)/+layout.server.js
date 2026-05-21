import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	return {
		session,
		user,
		profile
	};
};
