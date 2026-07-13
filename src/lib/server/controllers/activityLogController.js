import { activityLogModel } from '../models/activityLogModel.js';
import { branchModel } from '../models/branchModel.js';
import { cacheGet } from '../cache.js';

export const activityLogController = {
	/**
	 * Ambil data activity log dengan pagination, pencarian, dan filter cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 * @param {URLSearchParams} searchParams
	 */
	async getActivityLogData(supabase, profile, searchParams) {
		const search = searchParams.get('search') || '';
		const branchId = searchParams.get('branchId') || '';
		const page = parseInt(searchParams.get('page') || '1', 10);
		const pageSize = 20;

		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;

		const [logsRes, branches] = await Promise.all([
			activityLogModel.getActivityLogs(supabase, { search, branchId, from, to }),
			cacheGet('get_branches', () => branchModel.getBranches(supabase), 15000)
		]);

		return {
			logs: logsRes.logs,
			branches,
			totalCount: logsRes.count,
			page,
			pageSize,
			filters: {
				search,
				branchId
			}
		};
	}
};
