import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session || !profile || !profile.is_active) {
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

	/** @type {any[]} */
	let branches = [];
	if (profile?.role === 'owner') {
		const { data } = await locals.supabase
			.from('branches')
			.select('id, name')
			.order('name');
		if (data) {
			branches = data;
		}
	}

	return {
		session,
		user,
		profile,
		branch,
		branches
	};
};
