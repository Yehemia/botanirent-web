/**
 * ============================================================
 * FILE: assetStatusController.js
 * TUJUAN: Logic bisnis untuk halaman Asset Status (kondisi unit fisik barang).
 *
 * Halaman ini memungkinkan staf gudang mengubah status unit fisik:
 *   - 'ready'       → siap disewa
 *   - 'maintenance' → sedang diperbaiki
 *   - 'washing'     → sedang dicuci
 *   - 'rented'      → (otomatis, saat diproses di POS)
 *
 * CATATAN PENTING:
 *   Ketika status diubah ke 'ready', sistem otomatis MENGHAPUS
 *   booking maintenance yang masih aktif di kalender.
 *   Ini karena maintenance sudah selesai, slot waktu harus dibebaskan.
 * ============================================================
 */

import { assetModel } from '../models/assetModel.js';

export const assetStatusController = {
	/**
	 * Ambil semua data asset untuk ditampilkan di halaman Asset Status.
	 *
	 * LOGIKA RBAC:
	 *   Owner → bisa lihat semua cabang (branchId = null)
	 *   Gudang/Kasir → hanya cabang mereka sendiri
	 *
	 * Diurutkan berdasarkan last_status_change descending (perubahan terbaru di atas)
	 * agar mudah memantau perubahan yang baru terjadi.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 */
	async getAssets(supabase, profile) {
		let branchId = null; // Default: owner lihat semua cabang

		if (profile.role !== 'owner') {
			// Non-owner harus punya cabang yang terdaftar
			if (!profile.branch_id) {
				console.error('User has no branch_id assigned');
				return { assets: [] };
			}
			branchId = profile.branch_id;
		}

		try {
			const assets = await assetModel.getAssets(supabase, {
				branchId,
				orderBy: 'last_status_change', // Urutkan: yang terbaru diubah statusnya tampil di atas
				ascending: false
			});
			return {
				assets
			};
		} catch (error) {
			console.error('Error loading assets in assetStatusController:', error);
			return {
				assets: [] // Return data kosong jika error (tidak crash halaman)
			};
		}
	},

	/**
	 * Proses perubahan status satu unit asset.
	 *
	 * EFEK SAMPING PENTING:
	 *   Jika status baru = 'ready' → hapus booking maintenance yang aktif.
	 *   Alasan: Maintenance selesai, blokir kalender tidak diperlukan lagi.
	 *   Jika tidak dihapus, kalender booking masih menampilkan barang "terblokir"
	 *   padahal sudah bisa digunakan kembali.
	 *
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

		if (status === 'rented') {
			return {
				success: false,
				status: 400,
				error: 'Status "Sedang Disewa" hanya bisa diubah otomatis melalui transaksi penyewaan di POS.'
			};
		}

		try {
			// Cek status saat ini di database
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

			// Update status di database
			await assetModel.updateAssetStatus(supabase, id, status);

			// Efek samping: Jika status berubah ke 'ready', bebaskan blokir maintenance di kalender
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
