export const staffModel = {
	/**
	 * Hitung total jumlah staf, opsional difilter per cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getStaffCount(supabase, branchId = null) {
		let query = supabase.from('profiles').select('*', { count: 'exact', head: true });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { count, error } = await query;
		if (error) {
			console.error('Error fetching staff count in model:', error);
			throw new Error(error.message);
		}
		return count || 0;
	}
};
