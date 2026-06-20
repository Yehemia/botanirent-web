import { fail, redirect } from '@sveltejs/kit';
import { returnsController } from '$lib/server/controllers/returnsController.js';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const data = await returnsController.getReturnsPageData(supabase, profile);
	return data;
}

export const actions = {
	processReturn: async ({ request, locals, fetch: svelteFetch }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();

		const midtransConfig = {
			serverKey: MIDTRANS_SERVER_KEY,
			env: PUBLIC_MIDTRANS_ENV,
			fetch: svelteFetch
		};

		const result = await returnsController.processReturn(supabase, profile, formData, midtransConfig);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return result;
	}
};
