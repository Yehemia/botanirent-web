import { json, error } from '@sveltejs/kit';

export const POST = async ({ request, locals }) => {
	const { profile } = await locals.safeGetSession();
	if (!profile) {
		throw error(401, 'Unauthorized');
	}

	// Verify the user is an owner
	if (profile.role !== 'owner') {
		throw error(403, 'Forbidden: Only owners can switch branches');
	}

	const { branchId } = await request.json();
	// If branchId is empty string or not provided, we set it to null to represent "Semua Cabang"
	const targetBranchId = branchId || null;

	// Update the profile's branch_id in Supabase
	const { error: updateError } = await locals.supabase
		.from('profiles')
		.update({ branch_id: targetBranchId })
		.eq('id', profile.id);

	if (updateError) {
		console.error('Error updating active branch:', updateError);
		throw error(500, updateError.message);
	}

	return json({ success: true });
};
