import { json, error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request, locals }) => {
	const { profile } = await locals.safeGetSession();
	if (!profile) {
		throw error(401, 'Unauthorized');
	}

	if (profile.role !== 'owner') {
		throw error(403, 'Forbidden: Only owners can switch branches');
	}

	const { branchId } = await request.json();
	const targetBranchId = branchId || null;

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
