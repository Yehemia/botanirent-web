import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';

export const inventoryController = {
	/**
	 * Get categories and items for the current branch/profile
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getInventoryData(supabase, profile) {
		const [categories, items] = await Promise.all([
			categoryModel.getCategories(supabase),
			itemModel.getItems(supabase, profile.branch_id)
		]);

		return {
			categories,
			items
		};
	}
};
