import { transactionModel } from '../models/transactionModel.js';
import { branchModel } from '../models/branchModel.js';
import { cacheGet } from '../cache.js';

export const transactionController = {
	/**
	 * Get list of transactions for a branch with optional search filter and pagination
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} search
	 * @param {number} page
	 * @param {number} limit
	 */
	async getTransactionsList(supabase, profile, search = '', page = 1, limit = 10) {
		const { data, count } = await transactionModel.getTransactions(
			supabase,
			profile.branch_id,
			search,
			page,
			limit
		);
		return {
			transactions: data,
			totalCount: count,
			search,
			page,
			limit
		};
	},

	/**
	 * Get details of a single transaction for receipt or view
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
			// isSuccess hanya true jika query param success=true DAN payment sudah benar-benar paid
			isSuccess: isSuccess && transaction.payment_status === 'paid'
		};
	}
};
