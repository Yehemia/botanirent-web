import { redirect } from '@sveltejs/kit';
import { transactionController } from '$lib/server/controllers/transactionController.js';
import { branchModel } from '$lib/server/models/branchModel.js';
import { cacheGet } from '$lib/server/cache.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url, parent }) {
	const { supabase } = locals;
	const { session, profile } = await parent();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const search = url.searchParams.get('q') || '';
	const branchId = url.searchParams.get('branchId') || '';
	const type = url.searchParams.get('type') || '';
	const status = url.searchParams.get('status') || '';

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
	const limit = 10;
	
	const filters = { branchId, type, status };

	const activeBranchesPromise = profile.role === 'owner'
		? cacheGet(
				'active_branches',
				() => branchModel.getActiveBranches(supabase),
				30000
			).catch((error) => {
				console.error('Failed to load active branches in transactions list:', error);
				return [];
			})
		: Promise.resolve([]);

	const [data, activeBranches] = await Promise.all([
		transactionController.getTransactionsList(supabase, profile, search, page, limit, filters),
		activeBranchesPromise
	]);

	return {
		transactions: data.transactions,
		totalCount: data.totalCount,
		search: data.search,
		page: data.page,
		limit: data.limit,
		filters: data.filters,
		activeBranches
	};
}
