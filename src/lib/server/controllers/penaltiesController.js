import { penaltyModel } from '../models/penaltyModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const penaltiesController = {
	/**
	 * Get penalty rules for owner dashboard
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

		const penaltyRules = await penaltyModel.getPenaltyRules(supabase);
		return {
			success: true,
			penaltyRules
		};
	},

	/**
	 * Update penalty rule
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
			return { success: false, status: 400, error: 'ID dan Jumlah denda wajib diisi.', values: Object.fromEntries(formData) };
		}

		const parsedAmount = parseFloat(amount.toString());
		if (isNaN(parsedAmount) || parsedAmount < 0) {
			return { success: false, status: 400, error: 'Jumlah denda harus berupa angka positif.', values: Object.fromEntries(formData) };
		}

		try {
			await penaltyModel.updatePenaltyRule(supabase, id.toString(), parsedAmount);
		} catch (err) {
			console.error("Error updating penalty rule in controller:", err);
			return { success: false, status: 500, error: 'Gagal memperbarui aturan denda.', values: Object.fromEntries(formData) };
		}

		// Log activity
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
