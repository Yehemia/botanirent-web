import { settingsModel } from '../models/settingsModel.js';
import { cacheGet, cacheInvalidate, invalidateDashboardCache } from '../cache.js';

export const settingsController = {
	/**
	 * Ambil pengaturan sewa untuk ditampilkan di form.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getRentalSettings(supabase) {
		const rentalSettings = await cacheGet(
			'rental_settings',
			() => settingsModel.getRentalSettings(supabase),
			60000
		);
		return {
			rentalSettings
		};
	},

	/**
	 * Update pengaturan sewa.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null, role: string }} profile
	 * @param {FormData} formData
	 */
	async updateRentalSettings(supabase, profile, formData) {
		if (profile.role !== 'owner') {
			return { success: false, status: 403, error: 'Akses ditolak. Hanya owner yang diizinkan.' };
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

			cacheInvalidate('rental_settings');
			invalidateDashboardCache(profile.branch_id);

			return { success: true };
		} catch (error) {
			console.error('Error updating rental settings in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyimpan pengaturan penyewaan.' };
		}
	}
};
