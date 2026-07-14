export const branchModel = {
	/**
	 * Ambil semua cabang (hanya id dan nama).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getAllBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('id, name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil cabang yang AKTIF saja, diurutkan A-Z.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getActiveBranches(supabase) {
		const { data, error } = await supabase
			.from('branches')
			.select('*')
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Fetch active branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil SEMUA cabang (aktif maupun nonaktif), diurutkan A-Z.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('*').order('name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambah cabang baru.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} branchData
	 */
	async insertBranch(supabase, branchData) {
		const { data, error } = await supabase.from('branches').insert([branchData]).select();

		if (error) {
			console.error('Insert branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update data cabang yang sudah ada.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} branchData
	 */
	async updateBranch(supabase, id, branchData) {
		const { data, error } = await supabase
			.from('branches')
			.update(branchData)
			.eq('id', id)
			.select();

		if (error) {
			console.error('Update branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Nonaktifkan cabang berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string|null} notes
	 */
	async deactivateBranch(supabase, id, notes) {
		const { data, error } = await supabase
			.from('branches')
			.update({ is_active: false, deactivation_notes: notes })
			.eq('id', id)
			.select();

		if (error) {
			console.error('Deactivate branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Aktifkan kembali cabang berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async activateBranch(supabase, id) {
		const { data, error } = await supabase
			.from('branches')
			.update({ is_active: true, deactivation_notes: null })
			.eq('id', id)
			.select();

		if (error) {
			console.error('Activate branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hitung total jumlah cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranchesCount(supabase) {
		const { count, error } = await supabase
			.from('branches')
			.select('*', { count: 'exact', head: true });

		if (error) {
			console.error('Fetch branches count error:', error);
			throw new Error(error.message);
		}
		return count || 0;
	},

	/**
	 * Ambil detail satu cabang: nama, alamat, telepon.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getBranchDetails(supabase, id) {
		const { data, error } = await supabase
			.from('branches')
			.select('name, address, phone')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Fetch branch details error in model:', error);
			throw new Error(error.message);
		}
		return data;
	}
};
