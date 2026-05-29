import { transactionModel } from '../models/transactionModel.js';
import { branchModel } from '../models/branchModel.js';

export const transactionController = {
	/**
	 * Get list of transactions for a branch with optional search filter
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} search
	 */
	async getTransactionsList(supabase, profile, search = '') {
		const transactions = await transactionModel.getTransactions(supabase, profile.branch_id, search);
		return {
			transactions,
			search
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
		const transaction = await transactionModel.getTransactionDetail(supabase, id, profile.branch_id);

		if (!transaction) {
			return {
				success: false,
				redirect: '/transactions'
			};
		}

		const items = await transactionModel.getTransactionItemsList(supabase, id);
		transaction.items = items;

		let branch = null;
		if (profile.branch_id) {
			branch = await branchModel.getBranchDetails(supabase, profile.branch_id);
		}

		return {
			success: true,
			transaction,
			branch: branch || { name: 'BotaniRent', address: '', phone: '' },
			isSuccess
		};
	}
};
