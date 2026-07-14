import { fail, redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const packagesData = await packageController.getPackages(supabase, profile);
	return {
		...packagesData,
		role: profile.role
	};
}

export const actions = {
	deletePackage: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { error: 'ID paket tidak valid' });
		}

		try {
			await packageController.deletePackage(supabase, profile, id);
			return { success: true };
		} catch (err) {
			console.error('Error deleting package in action:', err);
			return fail(500, { error: 'Gagal menghapus paket' });
		}
	}
};
