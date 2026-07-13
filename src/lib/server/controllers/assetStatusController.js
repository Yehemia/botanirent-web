import { assetModel } from '../models/assetModel.js';
import { invalidateDashboardCache } from '../cache.js';

export const assetStatusController = {
	/**
	 * Ambil semua data asset untuk ditampilkan di halaman Asset Status.
	 *
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
	 * Proses perubahan status satu unit asset.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null, id: string }} profile
	 * @param {FormData} formData
	 */
	async updateStatus(supabase, profile, formData) {
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString();

		if (!id || !status) {
			return { success: false, status: 400, error: 'Data tidak lengkap.' };
		}

		if (status === 'rented') {
			return {
				success: false,
				status: 400,
				error: 'Status "Sedang Disewa" hanya bisa diubah otomatis melalui transaksi penyewaan di POS.'
			};
		}

		try {
			const { data: currentAsset, error: fetchError } = await supabase
				.from('rental_assets')
				.select('status')
				.eq('id', id)
				.single();

			if (fetchError) {
				throw fetchError;
			}

			if (currentAsset && currentAsset.status === 'rented') {
				return {
					success: false,
					status: 400,
					error: 'Aset yang sedang disewa tidak dapat diubah statusnya secara manual. Harap lakukan proses Pengembalian.'
				};
			}

			await assetModel.updateAssetStatus(supabase, id, status);

			if (status === 'ready') {
				await assetModel.deleteMaintenanceBookingForAsset(supabase, id);
			}

			invalidateDashboardCache(profile.branch_id);

			return { success: true };
		} catch (error) {
			console.error('Error updating asset status in controller:', error);
			return { success: false, status: 500, error: 'Gagal mengupdate status aset.' };
		}
	}
};
