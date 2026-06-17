import { redirect } from '@sveltejs/kit';
import { cacheGet } from '$lib/server/cache.js';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session || !profile || !profile.is_active) {
		throw redirect(303, '/login');
	}

	const branchPromise = profile?.branch_id
		? cacheGet(
				`branch_name_${profile.branch_id}`,
				async () => {
					const { data } = await locals.supabase
						.from('branches')
						.select('name')
						.eq('id', profile.branch_id)
						.single();
					return { data };
				},
				30000
			)
		: Promise.resolve({ data: null });

	const branchesPromise = profile?.role === 'owner'
		? cacheGet(
				'layout_branches',
				async () => {
					const { data } = await locals.supabase
						.from('branches')
						.select('id, name')
						.order('name');
					return { data };
				},
				20000
			)
		: Promise.resolve({ data: null });

	const [branchRes, branchesRes] = await Promise.all([branchPromise, branchesPromise]);

	return {
		session,
		user,
		profile,
		branch: branchRes.data,
		branches: branchesRes.data || []
	};
};
