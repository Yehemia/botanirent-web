import { redirect } from '@sveltejs/kit';
import { transactionController } from '$lib/server/controllers/transactionController.js';

export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const search = url.searchParams.get('q') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
	const limit = 10;
	const data = await transactionController.getTransactionsList(supabase, profile, search, page, limit);
	return data;
}
