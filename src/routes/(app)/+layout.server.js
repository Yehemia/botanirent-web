import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session || !profile || !profile.is_active) {
		throw redirect(303, '/login');
	}

	const branchPromise = profile?.branch_id
		? locals.supabase.from('branches').select('name').eq('id', profile.branch_id).single()
		: Promise.resolve({ data: null });

	const branchesPromise = profile?.role === 'owner'
		? locals.supabase.from('branches').select('id, name').order('name')
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
