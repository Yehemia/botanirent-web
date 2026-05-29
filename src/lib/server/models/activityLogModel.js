export const activityLogModel = {
	/**
	 * Log user activity in the database
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string} params.userId
	 * @param {string|null} params.branchId
	 * @param {string} params.action
	 * @param {string} params.entityType
	 * @param {string} params.entityId
	 * @param {object} params.metadata
	 */
	async logActivity(supabase, { userId, branchId, action, entityType, entityId, metadata }) {
		const { error } = await supabase.from('activity_logs').insert({
			user_id: userId,
			branch_id: branchId,
			action,
			entity_type: entityType,
			entity_id: entityId,
			metadata
		});

		if (error) {
			console.error("Error inserting activity log:", error);
		}
	},

	/**
	 * Fetch activity logs with filters, pagination, and count
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string|null} [params.branchId]
	 * @param {string|null} [params.search]
	 * @param {number} params.from
	 * @param {number} params.to
	 */
	async getActivityLogs(supabase, { branchId = null, search = null, from, to }) {
		let query = supabase
			.from('activity_logs')
			.select(`
				*,
				profile:profiles(full_name, role),
				branch:branches(name)
			`, { count: 'exact' });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		if (search) {
			query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
		}

		query = query.order('created_at', { ascending: false }).range(from, to);

		const { data, count, error } = await query;
		if (error) {
			console.error('Fetch activity logs error in model:', error);
			throw new Error(error.message);
		}
		return { logs: data || [], count: count || 0 };
	},

	/**
	 * Fetch recent activity logs
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {number} limit
	 */
	async getRecentLogs(supabase, branchId = null, limit = 5) {
		let query = supabase
			.from('activity_logs')
			.select('*, profile:profiles(full_name, role), branch:branches(name)')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch recent logs error in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	}
};
