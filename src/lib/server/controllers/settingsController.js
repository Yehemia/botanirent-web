/**
 * ============================================================
 * FILE: settingsController.js
 * TUJUAN: Logic bisnis untuk halaman Settings (pengaturan sewa).
 *
 * Pengaturan yang bisa diubah owner:
 *   - Durasi sewa default (hari)
 *   - Biaya keterlambatan per hari
 *   - Target pendapatan bulanan (untuk grafik progress di dashboard)
 *
 * KONSEP parseInt vs parseFloat:
 *   parseInt('4.5', 10) → 4    (ambil angka bulat, radix 10 = sistem desimal)
 *   parseFloat('10000.5') → 10000.5 (ambil angka desimal)
 *   Durasi hari harus bulat (parseInt), sedangkan fee bisa desimal (parseFloat).
 * ============================================================
 */

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
	 * GUARD: Hanya owner atau admin yang boleh mengubah pengaturan.
	 *   Status 403 = Forbidden (bisa akses tapi tidak punya izin untuk aksi ini)
	 *
	 * PARSING ANGKA:
	 *   Semua nilai dari FormData adalah string, perlu dikonversi ke angka.
	 *   || fallback → jika parsing gagal, pakai nilai default yang aman.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null, role: string }} profile
	 * @param {FormData} formData
	 */
	async updateRentalSettings(supabase, profile, formData) {
		// RBAC: hanya owner yang boleh ubah pengaturan
		if (profile.role !== 'owner') {
			return { success: false, status: 403, error: 'Akses ditolak. Hanya owner yang diizinkan.' };
		}

		// Ambil dan parse nilai dari form (semua string dari FormData → angka)
		const duration = parseInt(formData.get('default_rental_duration_days')?.toString() || '4', 10);
		const lateFee = parseFloat(formData.get('late_fee_per_day_per_transaction')?.toString() || '0');
		const target = parseFloat(formData.get('monthly_revenue_target')?.toString() || '20000000');

		// Susun objek pengaturan baru
		const value = {
			default_rental_duration_days: duration,
			late_fee_per_day_per_transaction: lateFee,
			monthly_revenue_target: target
		};

		try {
			// Simpan menggunakan UPSERT (update jika ada, insert jika belum ada)
			await settingsModel.upsertRentalSettings(supabase, value);

			// Invalidate cache
			cacheInvalidate('rental_settings');
			invalidateDashboardCache(profile.branch_id);

			return { success: true };
		} catch (error) {
			console.error('Error updating rental settings in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyimpan pengaturan penyewaan.' };
		}
	}
};
