export const settingsModel = {
	/**
	 * Ambil pengaturan sewa (rental settings).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getRentalSettings(supabase) {
		const { data, error } = await supabase
			.from('settings')
			.select('*')
			.eq('key', 'rental')
			.maybeSingle();

		if (error) {
			console.error('Error fetching settings in model:', error);
			throw new Error(error.message);
		}

		return (
			data?.value || {
				default_rental_duration_days: 4,
				late_fee_per_day_per_transaction: 10000,
				monthly_revenue_target: 20000000
			}
		);
	},

	/**
	 * Simpan pengaturan sewa.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} value
	 */
	async upsertRentalSettings(supabase, value) {
		const { error } = await supabase.from('settings').upsert(
			{
				key: 'rental',
				value: value,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'key' }
		);

		if (error) {
			console.error('Error upserting settings in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
