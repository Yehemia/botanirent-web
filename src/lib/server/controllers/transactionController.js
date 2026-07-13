import { transactionModel } from '../models/transactionModel.js';
import { branchModel } from '../models/branchModel.js';
import { cacheGet } from '../cache.js';

export const transactionController = {
	/**
	 * Ambil daftar transaksi dengan filter search dan pagination.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} search
	 * @param {number} page
	 * @param {number} limit
	 * @param {{ branchId?: string, type?: string, status?: string }} filters
	 */
	async getTransactionsList(supabase, profile, search = '', page = 1, limit = 10, filters = {}) {
		const { data, count } = await transactionModel.getTransactions(
			supabase,
			profile.branch_id,
			search,
			page,
			limit,
			filters
		);
		return {
			transactions: data,
			totalCount: count,
			search,
			page,
			limit,
			filters
		};
	},

	/**
	 * Ambil detail lengkap satu transaksi untuk halaman struk/detail.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} id
	 * @param {boolean} isSuccess
	 */
	async getTransactionDetails(supabase, profile, id, isSuccess) {
		const transaction = await transactionModel.getTransactionDetail(
			supabase,
			id,
			profile.branch_id
		);

		if (!transaction) {
			return {
				success: false,
				redirect: '/transactions'
			};
		}

		const items = await transactionModel.getTransactionItemsList(supabase, id);
		transaction.items = items;

		let branch = null;
		const branchId = profile.branch_id;
		if (branchId) {
			branch = await cacheGet(
				`branch_details_${branchId}`,
				() => branchModel.getBranchDetails(supabase, branchId),
				60000
			);
		}

		return {
			success: true,
			transaction,
			branch: branch || { name: 'BotaniRent', address: '', phone: '' },
			isSuccess: isSuccess && transaction.payment_status === 'paid'
		};
	}
};
