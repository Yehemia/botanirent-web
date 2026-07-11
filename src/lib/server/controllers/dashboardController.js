/**
 * ============================================================
 * FILE: dashboardController.js
 * TUJUAN: Menyiapkan semua data yang dibutuhkan halaman Dashboard
 *         berdasarkan PERAN (role) user yang sedang login.
 *
 * INI CONTROLLER PALING KOMPLEKS karena Dashboard menampilkan:
 *   - Ringkasan performa bisnis (owner)
 *   - Data operasional hari ini (kasir)
 *   - Status gudang dan pengiriman (gudang)
 *
 * KONSEP RBAC (Role-Based Access Control):
 *   Dashboard menampilkan konten BERBEDA tergantung role:
 *   - owner  → grafik pendapatan, statistik, semua cabang
 *   - kasir  → pendapatan hari ini, penjemputan, pengembalian
 *   - gudang → status barang (cuci/maintenance), pengiriman hari ini
 *
 * KONSEP PARALLEL FETCHING:
 *   Promise.all([queryA, queryB, queryC])
 *   → Jalankan semua query BERSAMAAN (paralel), tidak perlu antri satu-satu.
 *   → Jauh lebih cepat daripada await queryA; await queryB; await queryC; (sekuensial)
 *   Analogi: Minta 3 karyawan bekerja bersamaan, bukan minta satu dulu selesai baru yang lain mulai.
 * ============================================================
 */

import { assetModel } from '../models/assetModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { staffModel } from '../models/staffModel.js';
import { branchModel } from '../models/branchModel.js';
import { customerModel } from '../models/customerModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { cacheGet } from '../cache.js';

export const dashboardController = {
	/**
	 * Kumpulkan semua data dashboard berdasarkan role user.
	 *
	 * HASIL AKHIR (tergantung role):
	 *   Semua role → { role, profile, assetStats, recentTransactions }
	 *   owner     → + ownerData (grafik, revenue, statistik)
	 *   kasir     → + kasirData (pendapatan hari ini, penjemputan)
	 *   gudang    → + gudangData (barang cuci/maintenance, pengiriman)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {any} profile - Data profil user (role, branch_id, dll)
	 */
	async getDashboardData(supabase, profile) {
		const isOwner = profile.role === 'owner';
		const isKasir = profile.role === 'kasir';
		const isGudang = profile.role === 'gudang';
		const branchId = profile.branch_id; // Null untuk owner (lihat semua cabang)
		const todayStr = new Date().toISOString().split('T')[0];

		// Tempat penampung semua promise query
		/** @type {Record<string, Promise<any>>} */
		const promises = {};

		// --- 1. DATA UMUM (Semua Role) ---
		promises.assetStats = cacheGet(
			`asset_status_counts_${branchId || 'all'}`,
			() => assetModel.getAssetsStatusCounts(supabase, branchId),
			15000
		);
		promises.recentTransactions = cacheGet(
			`recent_transactions_${branchId || 'all'}`,
			() => transactionModel.getRecentTransactions(supabase, branchId, 5),
			15000
		);

		// --- 2. DATA KHUSUS OWNER ---
		let queryDate = null;
		let startOfMonth = null;
		if (isOwner) {
			// Hitung tanggal 7 hari lalu (untuk grafik 7 hari terakhir)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 agar termasuk hari ini (7 hari total)
			sevenDaysAgo.setHours(0, 0, 0, 0); // Set ke jam 00:00:00

			// Hitung awal bulan ini
			startOfMonth = new Date();
			startOfMonth.setDate(1); // Tanggal 1 bulan ini
			startOfMonth.setHours(0, 0, 0, 0);

			// Ambil data dari tanggal yang LEBIH AWAL antara awal bulan vs 7 hari lalu
			queryDate = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;
			const queryDateIso = queryDate.toISOString();

			promises.allTrx = cacheGet(
				`transactions_for_revenue_${branchId || 'all'}_${queryDateIso}`,
				() => transactionModel.getTransactionsForRevenue(supabase, branchId, queryDateIso),
				15000
			);
			promises.allPenalties = cacheGet(
				`paid_penalties_for_revenue_${branchId || 'all'}_${queryDateIso}`,
				() => transactionModel.getPaidPenaltiesForRevenue(supabase, branchId, queryDateIso),
				15000
			);
			promises.staffCount = cacheGet(`staff_count_${branchId || 'all'}`, () => staffModel.getStaffCount(supabase, branchId), 15000);
			promises.branchCount = cacheGet('branch_count', () => branchModel.getBranchesCount(supabase), 30000);
			promises.customerCount = cacheGet(`customer_count_${branchId || 'all'}`, () => customerModel.getCustomersCount(supabase, branchId), 15000);
			promises.recentLogs = cacheGet(
				`recent_logs_${branchId || 'all'}`,
				() => activityLogModel.getRecentLogs(supabase, branchId, 5),
				15000
			);
			promises.rentalSettings = cacheGet('rental_settings', () => settingsModel.getRentalSettings(supabase), 30000);
		}

		// --- 3. DATA KHUSUS KASIR ---
		let startOfToday = null;
		if (isKasir && branchId) {
			startOfToday = new Date();
			startOfToday.setHours(0, 0, 0, 0);
			const startOfTodayIso = startOfToday.toISOString();

			promises.todayTrx = cacheGet(
				`today_paid_transactions_${branchId}_${startOfTodayIso}`,
				() => transactionModel.getTodayPaidTransactions(supabase, branchId, startOfTodayIso),
				15000
			);
			promises.activeRentalsCount = cacheGet(
				`active_rentals_count_${branchId}`,
				() => transactionModel.getActiveRentalsCount(supabase, branchId),
				15000
			);
			promises.todaysPickups = cacheGet(
				`todays_pickups_${branchId}_${todayStr}`,
				() => transactionModel.getTodaysPickups(supabase, branchId, todayStr),
				15000
			);
			promises.todaysReturnsDue = cacheGet(
				`todays_returns_due_${branchId}_${todayStr}`,
				() => transactionModel.getTodaysReturnsDue(supabase, branchId, todayStr),
				15000
			);
		}

		// --- 4. DATA KHUSUS GUDANG ---
		if (isGudang && branchId) {
			promises.washingAssets = cacheGet(
				`washing_assets_${branchId}`,
				() => assetModel.getWashingAssets(supabase, branchId),
				15000
			);
			promises.maintenanceAssets = cacheGet(
				`maintenance_assets_${branchId}`,
				() => assetModel.getMaintenanceAssets(supabase, branchId),
				15000
			);
			promises.todaysShipments = cacheGet(
				`todays_pickups_${branchId}_${todayStr}`,
				() => transactionModel.getTodaysPickups(supabase, branchId, todayStr),
				15000
			);
		}

		// Jalankan semua query yang didefinisikan secara paralel (sekaligus)
		const keys = Object.keys(promises);
		const results = await Promise.all(Object.values(promises));

		// Map kembali hasil ke dataMap agar mudah diakses
		/** @type {Record<string, any>} */
		const dataMap = {};
		keys.forEach((key, index) => {
			dataMap[key] = results[index];
		});

		const assetStats = dataMap.assetStats;
		const recentTransactions = dataMap.recentTransactions;

		// --- PROSES DATA OWNER ---
		let ownerData = null;
		if (isOwner && queryDate && startOfMonth) {
			const allTrx = /** @type {any[]} */ (dataMap.allTrx);
			const allPenalties = /** @type {any[]} */ (dataMap.allPenalties);
			const staffCount = dataMap.staffCount;
			const branchCount = dataMap.branchCount;
			const customerCount = dataMap.customerCount;
			const recentLogs = dataMap.recentLogs;
			const rentalSettings = dataMap.rentalSettings;

			const monthlyRevenueTarget = Number(rentalSettings?.monthly_revenue_target) || 20000000;
			let totalTxRevenueMonth = 0;
			let totalPenaltyRevenueMonth = 0;
			let successfulTrxCountMonth = 0;

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
				allTrx.forEach((t) => {
					if (t.payment_status === 'paid') {
						const trxDateObj = new Date(t.created_at);
						if (trxDateObj >= startOfMonth) {
							totalTxRevenueMonth += Number(t.total_amount) || 0;
							successfulTrxCountMonth++;
						}

						const tDateStr = new Date(trxDateObj.getTime() - trxDateObj.getTimezoneOffset() * 60000)
							.toISOString()
							.split('T')[0];
						const chartItem = last7Days.find((d) => d.date === tDateStr);
						if (chartItem) {
							chartItem.revenue += Number(t.total_amount) || 0;
						}
					}
				});
			}

			if (allPenalties) {
				allPenalties.forEach((p) => {
					const penaltyDateObj = new Date(p.created_at);
					const amount = Number(p.calculated_amount) || 0;

					if (penaltyDateObj >= startOfMonth) {
						totalPenaltyRevenueMonth += amount;
					}

					const pDateStr = new Date(
						penaltyDateObj.getTime() - penaltyDateObj.getTimezoneOffset() * 60000
					)
						.toISOString()
						.split('T')[0];
					const chartItem = last7Days.find((d) => d.date === pDateStr);
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
					labels: last7Days.map((d) => d.label),
					revenueData: last7Days.map((d) => d.revenue),
					penaltyData: last7Days.map((d) => d.penalty)
				},
				staffCount,
				branchCount,
				customerCount,
				recentLogs
			};
		}

		// --- PROSES DATA KASIR ---
		let kasirData = null;
		if (isKasir) {
			if (!branchId) {
				console.error('Cashier has no branch_id assigned.');
				kasirData = {
					todayRevenue: 0,
					todayTrxCount: 0,
					activeRentalsCount: 0,
					todaysPickups: [],
					todaysReturnsDue: []
				};
			} else {
				const todayTrx = /** @type {any[]} */ (dataMap.todayTrx || []);
				const activeRentalsCount = dataMap.activeRentalsCount || 0;
				const todaysPickups = dataMap.todaysPickups || [];
				const todaysReturnsDue = dataMap.todaysReturnsDue || [];

				const todayRevenue = todayTrx.reduce((/** @type {number} */ acc, /** @type {any} */ t) => acc + (Number(t.total_amount) || 0), 0);

				kasirData = {
					todayRevenue,
					todayTrxCount: todayTrx.length,
					activeRentalsCount,
					todaysPickups,
					todaysReturnsDue
				};
			}
		}

		// --- PROSES DATA GUDANG ---
		let gudangData = null;
		if (isGudang) {
			if (!branchId) {
				console.error('Warehouse staff has no branch_id assigned.');
				gudangData = {
					washingAssets: [],
					maintenanceAssets: [],
					todaysShipments: []
				};
			} else {
				gudangData = {
					washingAssets: dataMap.washingAssets || [],
					maintenanceAssets: dataMap.maintenanceAssets || [],
					todaysShipments: dataMap.todaysShipments || []
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
