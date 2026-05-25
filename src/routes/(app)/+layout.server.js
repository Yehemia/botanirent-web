import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/login');
	}

	let branch = null;
	if (profile?.branch_id) {
		const { data } = await locals.supabase
			.from('branches')
			.select('name')
			.eq('id', profile.branch_id)
			.single();
		if (data) {
			branch = data;
		}
	}

	return {
		session,
		user,
		profile,
		branch
	};
};
