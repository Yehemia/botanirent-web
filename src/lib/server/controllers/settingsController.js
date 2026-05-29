import { settingsModel } from '../models/settingsModel.js';

export const settingsController = {
	/**
	 * Get rental settings
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getRentalSettings(supabase) {
		const rentalSettings = await settingsModel.getRentalSettings(supabase);
		return {
			rentalSettings
		};
	},

	/**
	 * Update rental settings
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 * @param {FormData} formData
	 */
	async updateRentalSettings(supabase, profile, formData) {
		// Only owners or admins can modify settings
		if (profile.role !== 'admin' && profile.role !== 'owner') {
			return { success: false, status: 403, error: 'Akses ditolak.' };
		}

		const duration = parseInt(formData.get('default_rental_duration_days')?.toString() || '4', 10);
		const lateFee = parseFloat(formData.get('late_fee_per_day_per_transaction')?.toString() || '0');
		const target = parseFloat(formData.get('monthly_revenue_target')?.toString() || '20000000');

		const value = {
			default_rental_duration_days: duration,
			late_fee_per_day_per_transaction: lateFee,
			monthly_revenue_target: target
		};

		try {
			await settingsModel.upsertRentalSettings(supabase, value);
			return { success: true };
		} catch (error) {
			console.error('Error updating rental settings in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyimpan pengaturan penyewaan.' };
		}
	}
};
