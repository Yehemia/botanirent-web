import { assetModel } from '../models/assetModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { staffModel } from '../models/staffModel.js';
import { branchModel } from '../models/branchModel.js';
import { customerModel } from '../models/customerModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { settingsModel } from '../models/settingsModel.js';

export const dashboardController = {
	/**
	 * Gather dashboard metrics based on user role
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {any} profile
	 */
	async getDashboardData(supabase, profile) {
		const isOwner = profile.role === 'owner';
		const branchId = profile.branch_id;
		const todayStr = new Date().toISOString().split('T')[0];

		// 1. Get physical asset status counts
		const assetStats = await assetModel.getAssetsStatusCounts(supabase, branchId);

		// 2. Fetch 5 recent transactions
		const recentTransactions = await transactionModel.getRecentTransactions(supabase, branchId, 5);

		// 3. Compile owner specific data
		let ownerData = null;
		if (isOwner) {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
			sevenDaysAgo.setHours(0, 0, 0, 0);

			const startOfMonth = new Date();
			startOfMonth.setDate(1);
			startOfMonth.setHours(0, 0, 0, 0);

			const queryDate = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;

			const [
				allTrx,
				allPenalties,
				staffCount,
				branchCount,
				customerCount,
				recentLogs,
				rentalSettings
			] = await Promise.all([
				transactionModel.getTransactionsForRevenue(supabase, branchId, queryDate.toISOString()),
				transactionModel.getPaidPenaltiesForRevenue(supabase, branchId, queryDate.toISOString()),
				staffModel.getStaffCount(supabase, branchId),
				branchModel.getBranchesCount(supabase),
				customerModel.getCustomersCount(supabase, branchId),
				activityLogModel.getRecentLogs(supabase, branchId, 5),
				settingsModel.getRentalSettings(supabase)
			]);

			const monthlyRevenueTarget = Number(rentalSettings.monthly_revenue_target) || 20000000;
			let totalTxRevenueMonth = 0;
			let totalPenaltyRevenueMonth = 0;
			let successfulTrxCountMonth = 0;

			// Prepare 7 days labels/keys for charts
			/** @type {Array<{date: string, label: string, revenue: number, penalty: number}>} */
			const last7Days = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				last7Days.push({
					date: d.toISOString().split('T')[0],
					label: new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d),
					revenue: 0,
					penalty: 0
				});
			}

			if (allTrx) {
				allTrx.forEach(t => {
					if (t.payment_status === 'paid') {
						const trxDateObj = new Date(t.created_at);
						if (trxDateObj >= startOfMonth) {
							totalTxRevenueMonth += Number(t.total_amount) || 0;
							successfulTrxCountMonth++;
						}

						const tDateStr = new Date(trxDateObj.getTime() - (trxDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
						const chartItem = last7Days.find(d => d.date === tDateStr);
						if (chartItem) {
							chartItem.revenue += Number(t.total_amount) || 0;
						}
					}
				});
			}

			if (allPenalties) {
				allPenalties.forEach(p => {
					const penaltyDateObj = new Date(p.created_at);
					const amount = Number(p.calculated_amount) || 0;

					if (penaltyDateObj >= startOfMonth) {
						totalPenaltyRevenueMonth += amount;
					}

					const pDateStr = new Date(penaltyDateObj.getTime() - (penaltyDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
					const chartItem = last7Days.find(d => d.date === pDateStr);
					if (chartItem) {
						chartItem.penalty += amount;
					}
				});
			}

			ownerData = {
				revenueData: {
					totalRevenueMonth: totalTxRevenueMonth + totalPenaltyRevenueMonth,
					totalTxRevenueMonth,
					totalPenaltyRevenueMonth,
					successfulTrxCountMonth,
					monthlyRevenueTarget
				},
				chartData: {
					labels: last7Days.map(d => d.label),
					revenueData: last7Days.map(d => d.revenue),
					penaltyData: last7Days.map(d => d.penalty)
				},
				staffCount,
				branchCount,
				customerCount,
				recentLogs
			};
		}

		// 4. Compile Cashier specific data
		let kasirData = null;
		if (profile.role === 'kasir') {
			if (!branchId) {
				console.error("Cashier has no branch_id assigned.");
				kasirData = {
					todayRevenue: 0,
					todayTrxCount: 0,
					activeRentalsCount: 0,
					todaysPickups: [],
					todaysReturnsDue: []
				};
			} else {
				const startOfToday = new Date();
				startOfToday.setHours(0, 0, 0, 0);

				const [
					todayTrx,
					activeRentalsCount,
					todaysPickups,
					todaysReturnsDue
				] = await Promise.all([
					transactionModel.getTodayPaidTransactions(supabase, branchId, startOfToday.toISOString()),
					transactionModel.getActiveRentalsCount(supabase, branchId),
					transactionModel.getTodaysPickups(supabase, branchId, todayStr),
					transactionModel.getTodaysReturnsDue(supabase, branchId, todayStr)
				]);

				const todayRevenue = todayTrx.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

				kasirData = {
					todayRevenue,
					todayTrxCount: todayTrx.length,
					activeRentalsCount,
					todaysPickups,
					todaysReturnsDue
				};
			}
		}

		// 5. Compile Warehouse specific data
		let gudangData = null;
		if (profile.role === 'gudang') {
			if (!branchId) {
				console.error("Warehouse staff has no branch_id assigned.");
				gudangData = {
					washingAssets: [],
					maintenanceAssets: [],
					todaysShipments: []
				};
			} else {
				const [
					washingAssets,
					maintenanceAssets,
					todaysShipments
				] = await Promise.all([
					assetModel.getWashingAssets(supabase, branchId),
					assetModel.getMaintenanceAssets(supabase, branchId),
					transactionModel.getTodaysPickups(supabase, branchId, todayStr)
				]);

				gudangData = {
					washingAssets,
					maintenanceAssets,
					todaysShipments
				};
			}
		}

		return {
			role: profile.role,
			profile,
			assetStats,
			recentTransactions,
			ownerData,
			kasirData,
			gudangData
		};
	}
};
