import { fail, redirect } from '@sveltejs/kit';
import { returnsController } from '$lib/server/controllers/returnsController.js';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const data = await returnsController.getReturnsPageData(supabase, profile);
	return data;
}

/** @type {import('./$types').Actions} */
export const actions = {
	processReturn: async ({ request, locals, fetch: svelteFetch }) => {
		try {
			const { supabase } = locals;
			const { session, profile } = await locals.safeGetSession();

			if (!session || !profile) {
				console.warn('[processReturn Server] Unauthorized access attempt');
				return fail(401, { error: 'Unauthorized' });
			}

			const formData = await request.formData();
			const payload = formData.get('payload');
			console.log('[processReturn Server] Received request payload:', payload);

			const midtransConfig = {
				serverKey: MIDTRANS_SERVER_KEY,
				env: PUBLIC_MIDTRANS_ENV,
				fetch: svelteFetch
			};

			const result = await returnsController.processReturn(supabase, profile, formData, midtransConfig);
			
			console.log('[processReturn Server] Controller execution result:', result);

			if (!result.success) {
				console.error('[processReturn Server] Action failed:', result.error);
				return fail(result.status || 500, { error: result.error });
			}

			return result;
		} catch (err) {
			console.error('[processReturn Server] Uncaught exception in action:', err);
			return fail(500, { error: err instanceof Error ? err.message : String(err) });
		}
	}
};
