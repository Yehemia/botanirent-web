import { branchModel } from '../models/branchModel.js';
import { cacheGet, cacheInvalidate, cacheInvalidatePrefix } from '../cache.js';

export const branchController = {
	/**
	 * Ambil daftar semua cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const branches = await cacheGet('get_branches', () => branchModel.getBranches(supabase), 15000);
		return {
			branches
		};
	},

	/**
	 * Simpan data cabang — bisa INSERT (baru) atau UPDATE (edit).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 * @param {FormData} formData
	 */
	async saveBranch(supabase, id, formData) {
		const name = formData.get('name');
		const address = formData.get('address');
		const phone = formData.get('phone');
		const is_active = formData.get('is_active') === 'true';
		const deactivation_notes = formData.get('deactivation_notes')?.toString() || null;

		if (!name) {
			return { success: false, status: 400, error: 'Nama cabang harus diisi.' };
		}

		const branchData = {
			name: name.toString(),
			address: address ? address.toString() : null,
			phone: phone ? phone.toString() : null,
			is_active,
			deactivation_notes: is_active ? null : deactivation_notes
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
	 * Nonaktifkan cabang berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 * @param {string|null} notes
	 */
	async deactivateBranch(supabase, id, notes) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			await branchModel.deactivateBranch(supabase, id, notes);

			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_');

			return { success: true };
		} catch (error) {
			console.error('Error deactivating branch in controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal menonaktifkan cabang.'
			};
		}
	},

	/**
	 * Aktifkan kembali cabang berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 */
	async activateBranch(supabase, id) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			await branchModel.activateBranch(supabase, id);

			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_');

			return { success: true };
		} catch (error) {
			console.error('Error activating branch in controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal mengaktifkan kembali cabang.'
			};
		}
	}
};
