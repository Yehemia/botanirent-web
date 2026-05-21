import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Fetch all rental assets that belong to items in the current branch
	const { data: assets, error } = await supabase
		.from('rental_assets')
		.select('*, item:items!inner(name, branch_id)')
		.eq('items.branch_id', profile.branch_id)
		.order('last_status_change', { ascending: false });

	if (error) {
		console.error("Error fetching assets:", error);
	}

	return {
		assets: assets || []
	};
}

export const actions = {
	updateStatus: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session } = await locals.safeGetSession();

		if (!session) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status'); // 'ready', 'rented', 'maintenance', 'washing'

		if (!id || !status) {
			return fail(400, { error: 'Data tidak lengkap.' });
		}

		const { error } = await supabase
			.from('rental_assets')
			.update({ 
				status, 
				last_status_change: new Date().toISOString() 
			})
			.eq('id', id);

		if (error) {
			console.error("Update asset status error:", error);
			return fail(500, { error: 'Gagal mengupdate status aset.' });
		}

		return { success: true };
	}
};
