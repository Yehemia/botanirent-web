import { assetModel } from '../models/assetModel.js';

export const assetStatusController = {
	/**
	 * Get assets list for status tracking
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 */
	async getAssets(supabase, profile) {
		let branchId = null;

		if (profile.role !== 'owner') {
			if (!profile.branch_id) {
				console.error('User has no branch_id assigned');
				return { assets: [] };
			}
			branchId = profile.branch_id;
		}

		try {
			const assets = await assetModel.getAssets(supabase, {
				branchId,
				orderBy: 'last_status_change',
				ascending: false
			});
			return {
				assets
			};
		} catch (error) {
			console.error('Error loading assets in assetStatusController:', error);
			return {
				assets: []
			};
		}
	},

	/**
	 * Update operational status of a physical asset
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 * @param {FormData} formData
	 */
	async updateStatus(supabase, profile, formData) {
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString(); // 'ready', 'rented', 'maintenance', 'washing'

		if (!id || !status) {
			return { success: false, status: 400, error: 'Data tidak lengkap.' };
		}

		try {
			await assetModel.updateAssetStatus(supabase, id, status);

			// If status is changed back to 'ready', remove active maintenance bookings in calendar
			if (status === 'ready') {
				await assetModel.deleteMaintenanceBookingForAsset(supabase, id);
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating asset status in controller:', error);
			return { success: false, status: 500, error: 'Gagal mengupdate status aset.' };
		}
	}
};
