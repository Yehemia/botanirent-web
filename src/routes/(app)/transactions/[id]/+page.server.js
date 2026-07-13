import { redirect } from '@sveltejs/kit';
import { transactionController } from '$lib/server/controllers/transactionController.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const { id } = params;
	const isSuccess = url.searchParams.get('success') === 'true';

	const result = await transactionController.getTransactionDetails(
		supabase,
		profile,
		id,
		isSuccess
	);

	if (!result.success) {
		throw redirect(303, result.redirect || '/transactions');
	}

	const successResult = /** @type {any} */ (result);

	return {
		transaction: successResult.transaction,
		branch: successResult.branch,
		isSuccess: successResult.isSuccess
	};
}
