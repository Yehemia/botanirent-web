import { inventoryController } from '$lib/server/controllers/inventoryController.js';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		return { items: [], categories: [] };
	}

	return inventoryController.getInventoryData(supabase, profile);
}

