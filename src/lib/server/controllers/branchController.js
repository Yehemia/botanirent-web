import { branchModel } from '../models/branchModel.js';

export const branchController = {
	/**
	 * Get list of all branches
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const branches = await branchModel.getBranches(supabase);
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
