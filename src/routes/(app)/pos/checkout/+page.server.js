import { fail, redirect } from '@sveltejs/kit';
import { posController } from '$lib/server/controllers/posController.js';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const data = await posController.getCheckoutData(supabase, profile);
	return data;
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals, fetch: svelteFetch }) => {
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

		const result = await posController.checkout(supabase, profile, formData, midtransConfig);

		if (!result.success) {
			if (result.redirect) {
				throw redirect(303, result.redirect);
			}
			const errorResult = /** @type {any} */ (result);
			return fail(errorResult.status || 500, {
				error: errorResult.error,
				values: errorResult.values
			});
		}

		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		return result;
	}
};
