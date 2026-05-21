import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Fetch packages with the count of items inside them
	const { data: packages, error } = await supabase
		.from('packages')
		.select('*, package_items(count)')
		.eq('branch_id', profile.branch_id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error("Error fetching packages:", error);
	}

	return {
		packages: packages || []
	};
}
