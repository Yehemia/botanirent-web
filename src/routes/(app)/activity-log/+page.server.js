import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	// Filters and pagination from URL
	const search = url.searchParams.get('search') || '';
	const branchId = url.searchParams.get('branchId') || '';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const pageSize = 20;

	// Query with profiles and branches join
	let query = supabase
		.from('activity_logs')
		.select(`
			*,
			profile:profiles(full_name, role),
			branch:branches(name)
		`, { count: 'exact' });

	// Filter by branch
	if (branchId) {
		query = query.eq('branch_id', branchId);
	}

	// Filter by search string
	if (search) {
		query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
	}

	// Sort by newest first
	query = query.order('created_at', { ascending: false });

	// Range limits for pagination
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;
	query = query.range(from, to);

	const { data: logs, count, error } = await query;
	if (error) {
		console.error('Fetch activity logs error:', error);
	}

	// Fetch all branches for filtering dropdown
	const { data: branches, error: branchesError } = await supabase
		.from('branches')
		.select('id, name')
		.order('name');

	if (branchesError) {
		console.error('Fetch branches in log error:', branchesError);
	}

	return {
		logs: logs || [],
		branches: branches || [],
		totalCount: count || 0,
		page,
		pageSize,
		filters: {
			search,
			branchId
		}
	};
}
