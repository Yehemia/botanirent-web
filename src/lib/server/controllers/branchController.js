import { branchModel } from '../models/branchModel.js';
import { cacheGet, cacheInvalidate, cacheInvalidatePrefix } from '../cache.js';

export const branchController = {
	/**
	 * Get list of all branches
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const branches = await cacheGet('get_branches', () => branchModel.getBranches(supabase), 15000);
		return {
			branches
		};
	},

	/**
	 * Create or update a branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 * @param {FormData} formData
	 */
	async saveBranch(supabase, id, formData) {
		const name = formData.get('name');
		const address = formData.get('address');
		const phone = formData.get('phone');
		const is_active = formData.get('is_active') === 'true';

		if (!name) {
			return { success: false, status: 400, error: 'Nama cabang harus diisi.' };
		}

		const branchData = {
			name: name.toString(),
			address: address ? address.toString() : null,
			phone: phone ? phone.toString() : null,
			is_active
		};

		try {
			if (id) {
				await branchModel.updateBranch(supabase, id, branchData);
			} else {
				await branchModel.insertBranch(supabase, branchData);
			}
			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_');
			return { success: true };
		} catch (error) {
			console.error('Error saving branch in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyimpan data cabang.' };
		}
	},

	/**
	 * Delete a branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 */
	async deleteBranch(supabase, id) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			await branchModel.deleteBranch(supabase, id);
			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_');
			return { success: true };
		} catch (error) {
			console.error('Error deleting branch in controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal menghapus cabang (mungkin masih ada data terkait).'
			};
		}
	}
};
