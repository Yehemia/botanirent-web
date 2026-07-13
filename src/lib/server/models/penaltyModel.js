export const penaltyModel = {
	/**
	 * Ambil semua aturan denda yang dikonfigurasi.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getPenaltyRules(supabase) {
		const { data, error } = await supabase
			.from('penalty_rules')
			.select('*')
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Fetch penalty rules error in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Update jumlah denda pada satu aturan denda.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {number} amount
	 */
	async updatePenaltyRule(supabase, id, amount) {
		const { error } = await supabase.from('penalty_rules').update({ amount }).eq('id', id);

		if (error) {
			console.error('Update penalty rule error in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Catat kejadian denda baru (saat proses pengembalian barang).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} penaltyData
	 */
	async insertPenalty(supabase, penaltyData) {
		const { error } = await supabase.from('penalties').insert(penaltyData);

		if (error) {
			console.error('Insert penalty error in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
