import { penaltyModel } from '../models/penaltyModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet, cacheInvalidate, invalidateDashboardCache } from '../cache.js';

export const penaltiesController = {
	/**
	 * Ambil semua aturan denda untuk ditampilkan ke owner.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 */
	async getPenaltyRules(supabase, profile) {
		if (profile.role !== 'owner') {
			return {
				success: false,
				redirect: '/dashboard'
			};
		}

		const penaltyRules = await cacheGet(
			'penalty_rules',
			() => penaltyModel.getPenaltyRules(supabase),
			60000
		);
		return {
			success: true,
			penaltyRules
		};
	},

	/**
	 * Update besaran satu aturan denda.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null, role: string }} profile
	 * @param {FormData} formData
	 */
	async updatePenaltyRule(supabase, profile, formData) {
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
				values: Object.fromEntries(formData)
			};
		}

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

		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: 'penalty_rule_updated',
			entityType: 'penalty_rule',
			entityId: id.toString(),
			metadata: { updated_amount: parsedAmount }
		});

		cacheInvalidate('penalty_rules');
		invalidateDashboardCache(profile.branch_id);

		return { success: true };
	}
};
