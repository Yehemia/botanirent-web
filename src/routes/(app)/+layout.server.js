import { redirect } from '@sveltejs/kit';
import { cacheGet } from '$lib/server/cache.js';

export const load = async ({ locals }) => {
	const { session, user, profile } = await locals.safeGetSession();

	if (!session || !profile || !profile.is_active) {
		throw redirect(303, '/login');
	}

	const branchPromise = profile?.branch_id
		? cacheGet(
				`branch_name_${profile.branch_id}`,
				async () => {
					const { data } = await locals.supabase
						.from('branches')
						.select('name')
						.eq('id', profile.branch_id)
						.single();
					return { data };
				},
				30000
			)
		: Promise.resolve({ data: null });

	const branchesPromise = profile?.role === 'owner'
		? cacheGet(
				'layout_branches',
				async () => {
					const { data } = await locals.supabase
						.from('branches')
						.select('id, name')
						.order('name');
					return { data };
				},
				20000
			)
		: Promise.resolve({ data: null });

	const [branchRes, branchesRes] = await Promise.all([branchPromise, branchesPromise]);

	let unpaidDendaCount = 0;
	try {
		let query = locals.supabase
			.from('penalties')
			.select('id, transaction_items(transactions(customer_id))')
			.eq('payment_status', 'unpaid');

		if (profile.branch_id) {
			query = query.eq('branch_id', profile.branch_id);
		}

		const { data: penData, error: penErr } = await query;
		if (!penErr && penData) {
			const customerIds = new Set();
			penData.forEach((p) => {
				const itemsVal = /** @type {any} */ (p.transaction_items);
				const firstItem = Array.isArray(itemsVal) ? itemsVal[0] : itemsVal;
				const txVal = firstItem?.transactions;
				const transaction = Array.isArray(txVal) ? txVal[0] : txVal;
				const customerId = transaction?.customer_id;
				if (customerId) {
					customerIds.add(customerId);
				}
			});
			unpaidDendaCount = customerIds.size;
		}
	} catch (err) {
		console.error('Error fetching unpaid denda customer count in layout:', err);
	}

	return {
		session,
		user,
		profile,
		branch: branchRes.data,
		branches: branchesRes.data || [],
		unpaidDendaCount
	};
};
