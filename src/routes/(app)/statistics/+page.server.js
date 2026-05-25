import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	// 1. Fetch Master Branches
	const { data: branches, error: branchesError } = await supabase
		.from('branches')
		.select('id, name');

	if (branchesError) console.error('Fetch branches error:', branchesError);
	const branchMap = new Map((branches || []).map(b => [b.id, b.name]));

	// 2. Fetch Paid Transactions
	// 2.5 Fetch Paid Penalties
	let txQuery = supabase
		.from('transactions')
		.select('id, branch_id, type, total_amount, created_at')
		.eq('payment_status', 'paid');
	
	let penaltiesQuery = supabase
		.from('penalties')
		.select('id, branch_id, type, calculated_amount, created_at')
		.eq('payment_status', 'paid');

	if (profile.branch_id) {
		txQuery = txQuery.eq('branch_id', profile.branch_id);
		penaltiesQuery = penaltiesQuery.eq('branch_id', profile.branch_id);
	}

	const [txRes, penaltiesRes, itemsRes] = await Promise.all([
		txQuery,
		penaltiesQuery,
		supabase
			.from('transaction_items')
			.select('transaction_id, item_name, type, quantity, subtotal')
	]);

	const txList = txRes.data || [];
	const penaltyList = penaltiesRes.data || [];
	
	// Filter items to current branch if branch is selected
	let itemList = itemsRes.data || [];
	if (profile.branch_id) {
		const activeTxIds = new Set(txList.map(t => t.id));
		itemList = itemList.filter(item => activeTxIds.has(item.transaction_id));
	}

	if (txRes.error) console.error('Fetch transactions error:', txRes.error);
	if (penaltiesRes.error) console.error('Fetch penalties error:', penaltiesRes.error);
	if (itemsRes.error) console.error('Fetch tx items error:', itemsRes.error);

	// --- Aggregation Logic (JS) ---

	// Main Metrics
	const totalTxRevenue = txList.reduce((acc, t) => acc + Number(t.total_amount), 0);
	const totalPenaltyRevenue = penaltyList.reduce((acc, p) => acc + Number(p.calculated_amount), 0);
	const totalRevenue = totalTxRevenue + totalPenaltyRevenue;
	const totalTxCount = txList.length;
	const avgTxValue = totalTxCount > 0 ? totalTxRevenue / totalTxCount : 0;

	// Revenue and transaction count per branch
	/** @type {Record<string, { name: string, revenue: number, count: number, penalty_revenue: number }>} */
	const branchStats = {};
	branchMap.forEach((name, id) => {
		branchStats[id] = { name, revenue: 0, count: 0, penalty_revenue: 0 };
	});

	txList.forEach(t => {
		if (branchStats[t.branch_id]) {
			branchStats[t.branch_id].revenue += Number(t.total_amount);
			branchStats[t.branch_id].count += 1;
		} else {
			// fallback in case branch is missing from master
			branchStats[t.branch_id] = {
				name: 'Cabang Unknown',
				revenue: Number(t.total_amount),
				count: 1,
				penalty_revenue: 0
			};
		}
	});

	penaltyList.forEach(p => {
		if (branchStats[p.branch_id]) {
			branchStats[p.branch_id].revenue += Number(p.calculated_amount);
			branchStats[p.branch_id].penalty_revenue += Number(p.calculated_amount);
		}
	});

	// Popular Items (top 5 by quantity)
	/** @type {Record<string, { name: string, quantity: number, type: string, total: number }>} */
	const itemStats = {};
	itemList.forEach(item => {
		const name = item.item_name;
		if (!itemStats[name]) {
			itemStats[name] = { name, quantity: 0, type: item.type, total: 0 };
		}
		itemStats[name].quantity += item.quantity;
		itemStats[name].total += Number(item.subtotal);
	});

	const popularItems = Object.values(itemStats)
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 5);

	// Type breakdown (retail, rental, package, penalty)
	const typeBreakdown = {
		retail: { count: 0, revenue: 0 },
		rental: { count: 0, revenue: 0 },
		package: { count: 0, revenue: 0 },
		penalty: { count: penaltyList.length, revenue: totalPenaltyRevenue }
	};

	itemList.forEach(item => {
		const type = /** @type {keyof typeof typeBreakdown} */ (item.type);
		if (typeBreakdown[type]) {
			typeBreakdown[type].count += item.quantity;
			typeBreakdown[type].revenue += Number(item.subtotal);
		}
	});

	// Monthly trend (last 6 months)
	/** @type {Record<string, number>} */
	const monthlyRevenue = {};
	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

	// Generate last 6 months list
	const trendLabels = [];
	for (let i = 5; i >= 0; i--) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		monthlyRevenue[key] = 0;
		trendLabels.push({
			key,
			label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
		});
	}

	txList.forEach(t => {
		const dateObj = new Date(t.created_at);
		const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
		if (monthlyRevenue[key] !== undefined) {
			monthlyRevenue[key] += Number(t.total_amount);
		}
	});

	penaltyList.forEach(p => {
		const dateObj = new Date(p.created_at);
		const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
		if (monthlyRevenue[key] !== undefined) {
			monthlyRevenue[key] += Number(p.calculated_amount);
		}
	});

	const trendData = trendLabels.map(t => monthlyRevenue[t.key]);
	const trendLabelStrings = trendLabels.map(t => t.label);

	return {
		metrics: {
			totalRevenue,
			totalTxRevenue,
			totalPenaltyRevenue,
			totalTxCount,
			avgTxValue
		},
		branchStats: Object.values(branchStats),
		popularItems,
		typeBreakdown,
		trend: {
			labels: trendLabelStrings,
			data: trendData
		}
	};
}
