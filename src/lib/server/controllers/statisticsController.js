import { branchModel } from '../models/branchModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { cacheGet } from '../cache.js';

export const statisticsController = {
	/**
	 * Hitung dan kembalikan semua data statistik.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 */
	async getStatistics(supabase, profile) {
		const cacheKey = `statistics_${profile.branch_id || 'all'}`;

		return cacheGet(cacheKey, async () => {
			const [branches, txList, penaltyList, allItems] = await Promise.all([
				branchModel.getAllBranches(supabase),
				transactionModel.getPaidTransactions(supabase, profile.branch_id),
				transactionModel.getPaidPenalties(supabase, profile.branch_id),
				transactionModel.getTransactionItems(supabase, profile.branch_id)
			]);

			const branchMap = new Map((branches || []).map((b) => [b.id, b.name]));

			let itemList = allItems || [];
			if (profile.branch_id) {
				const activeTxIds = new Set(txList.map((t) => t.id));
				itemList = itemList.filter((item) => activeTxIds.has(item.transaction_id));
			}

			const totalTxRevenue = txList.reduce((acc, t) => acc + Number(t.total_amount), 0);
			const totalPenaltyRevenue = penaltyList.reduce(
				(acc, p) => acc + Number(p.calculated_amount),
				0
			);
			const totalRevenue = totalTxRevenue + totalPenaltyRevenue;
			const totalTxCount = txList.length;
			const avgTxValue = totalTxCount > 0 ? totalTxRevenue / totalTxCount : 0;

			/** @type {Record<string, { name: string, revenue: number, count: number, penalty_revenue: number }>} */
			const branchStats = {};
			branchMap.forEach((name, id) => {
				branchStats[id] = { name, revenue: 0, count: 0, penalty_revenue: 0 };
			});

			txList.forEach((t) => {
				if (branchStats[t.branch_id]) {
					branchStats[t.branch_id].revenue += Number(t.total_amount);
					branchStats[t.branch_id].count += 1;
				} else {
					branchStats[t.branch_id] = {
						name: 'Cabang Unknown',
						revenue: Number(t.total_amount),
						count: 1,
						penalty_revenue: 0
					};
				}
			});

			penaltyList.forEach((p) => {
				if (branchStats[p.branch_id]) {
					branchStats[p.branch_id].revenue += Number(p.calculated_amount);
					branchStats[p.branch_id].penalty_revenue += Number(p.calculated_amount);
				}
			});

			/** @type {Record<string, { name: string, quantity: number, type: string, total: number }>} */
			const itemStats = {};
			itemList.forEach((item) => {
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

			const typeBreakdown = {
				retail: { count: 0, revenue: 0 },
				rental: { count: 0, revenue: 0 },
				package: { count: 0, revenue: 0 },
				penalty: { count: penaltyList.length, revenue: totalPenaltyRevenue }
			};

			itemList.forEach((item) => {
				const type = /** @type {keyof typeof typeBreakdown} */ (item.type);
				if (typeBreakdown[type]) {
					typeBreakdown[type].count += item.quantity;
					typeBreakdown[type].revenue += Number(item.subtotal);
				}
			});

			/** @type {Record<string, number>} */
			const monthlyRevenue = {};
			const monthNames = [
				'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
				'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
			];

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

			txList.forEach((t) => {
				const dateObj = new Date(t.created_at);
				const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
				if (monthlyRevenue[key] !== undefined) {
					monthlyRevenue[key] += Number(t.total_amount);
				}
			});

			penaltyList.forEach((p) => {
				const dateObj = new Date(p.created_at);
				const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
				if (monthlyRevenue[key] !== undefined) {
					monthlyRevenue[key] += Number(p.calculated_amount);
				}
			});

			const trendData = trendLabels.map((t) => monthlyRevenue[t.key]);
			const trendLabelStrings = trendLabels.map((t) => t.label);

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
		}, 15000);
	}
};
