/**
 * ============================================================
 * FILE: penaltiesController.js
 * TUJUAN: Logic bisnis untuk halaman Penalties (denda).
 *
 * Halaman ini hanya bisa diakses OWNER.
 * Fitur:
 *   1. Lihat semua aturan denda (getPenaltyRules)
 *   2. Update besaran denda (updatePenaltyRule)
 *
 * CATATAN: Pencatatan KEJADIAN denda (penalties) dilakukan di
 *          returnsController, bukan di sini.
 *          Controller ini hanya mengurus KONFIGURASI aturan denda.
 * ============================================================
 */

import { penaltyModel } from '../models/penaltyModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const penaltiesController = {
	/**
	 * Ambil semua aturan denda untuk ditampilkan ke owner.
	 *
	 * GUARD: Hanya owner yang boleh mengakses.
	 *   Jika bukan owner → redirect ke dashboard.
	 *   (Lapisan keamanan tambahan di controller, selain proteksi di route)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 */
	async getPenaltyRules(supabase, profile) {
		// RBAC check: hanya owner yang boleh lihat halaman ini
		if (profile.role !== 'owner') {
			return {
				success: false,
				redirect: '/dashboard' // Arahkan non-owner ke dashboard
			};
		}

		const penaltyRules = await penaltyModel.getPenaltyRules(supabase);
		return {
			success: true,
			penaltyRules
		};
	},

	/**
	 * Update besaran satu aturan denda.
	 *
	 * VALIDASI:
	 *   1. Hanya owner → 401 Unauthorized jika bukan
	 *   2. ID dan amount harus ada → 400 Bad Request
	 *   3. Amount harus angka positif → 400 Bad Request
	 *
	 * parseFloat() → konversi string ke angka desimal
	 *   "10000" → 10000
	 *   isNaN(value) → true jika bukan angka (NaN = Not a Number)
	 *
	 * Object.fromEntries(formData) → konversi FormData ke objek biasa
	 *   Dikembalikan sebagai 'values' agar form bisa menampilkan nilai yang sudah diisi
	 *   (tanpa harus user isi ulang jika ada error)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null, role: string }} profile
	 * @param {FormData} formData
	 */
	async updatePenaltyRule(supabase, profile, formData) {
		// Guard: hanya owner yang boleh edit
		if (profile.role !== 'owner') {
			return { success: false, status: 401, error: 'Unauthorized' };
		}

		const id = formData.get('id');
		const amount = formData.get('amount');

		if (!id || amount === null) {
			return {
				success: false,
				status: 400,
				error: 'ID dan Jumlah denda wajib diisi.',
				values: Object.fromEntries(formData) // Kembalikan nilai form agar tidak hilang
			};
		}

		// Konversi string ke angka dan validasi
		const parsedAmount = parseFloat(amount.toString());
		if (isNaN(parsedAmount) || parsedAmount < 0) {
			return {
				success: false,
				status: 400,
				error: 'Jumlah denda harus berupa angka positif.',
				values: Object.fromEntries(formData)
			};
		}

		try {
			// Update aturan denda di database
			await penaltyModel.updatePenaltyRule(supabase, id.toString(), parsedAmount);
		} catch (err) {
			console.error('Error updating penalty rule in controller:', err);
			return {
				success: false,
				status: 500,
				error: 'Gagal memperbarui aturan denda.',
				values: Object.fromEntries(formData)
			};
		}

		// Catat activity log — siapa yang mengubah denda berapa
		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: 'penalty_rule_updated',
			entityType: 'penalty_rule',
			entityId: id.toString(),
			metadata: { updated_amount: parsedAmount }
		});

		return { success: true };
	}
};
