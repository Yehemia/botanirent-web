import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Fetch packages with the count of items inside them
	let query = supabase
		.from('packages')
		.select('*, package_items(count)')
		.order('created_at', { ascending: false });

	if (profile.branch_id) {
		query = query.eq('branch_id', profile.branch_id);
	}

	const { data: packages, error } = await query;

	if (error) {
		console.error("Error fetching packages:", error);
	}

	return {
		packages: packages || []
	};
}
