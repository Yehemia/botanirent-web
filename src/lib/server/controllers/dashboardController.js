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
		const branchId = profile.branch_id; // Null untuk owner (lihat semua cabang)
		// Format tanggal hari ini: "YYYY-MM-DD" contoh "2025-06-21"
		const todayStr = new Date().toISOString().split('T')[0];

		// --- BAGIAN 1: DATA UMUM (Semua Role) ---
		// Jalankan 2 query secara paralel untuk efisiensi
		const [assetStats, recentTransactions] = await Promise.all([
			// Hitung jumlah asset per status (ready, rented, maintenance, washing) - di-cache 15 detik
			cacheGet(
				`asset_status_counts_${branchId || 'all'}`,
				() => assetModel.getAssetsStatusCounts(supabase, branchId),
				15000
			),
			// Ambil 5 transaksi terbaru - di-cache 15 detik
			cacheGet(
				`recent_transactions_${branchId || 'all'}`,
				() => transactionModel.getRecentTransactions(supabase, branchId, 5),
				15000
			)
		]);

		// --- BAGIAN 2: DATA KHUSUS OWNER ---
		let ownerData = null;
		if (isOwner) {
			// Hitung tanggal 7 hari lalu (untuk grafik 7 hari terakhir)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 agar termasuk hari ini (7 hari total)
			sevenDaysAgo.setHours(0, 0, 0, 0); // Set ke jam 00:00:00

			// Hitung awal bulan ini
			const startOfMonth = new Date();
			startOfMonth.setDate(1); // Tanggal 1 bulan ini
			startOfMonth.setHours(0, 0, 0, 0);

			// Ambil data dari tanggal yang LEBIH AWAL antara awal bulan vs 7 hari lalu
			// Ini memastikan kita punya data untuk KEDUA keperluan (grafik 7 hari DAN total bulan)
			const queryDate = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;

			// Jalankan 7 query secara paralel
			const [
				allTrx,       // Semua transaksi dari queryDate hingga sekarang - di-cache 15 detik
				allPenalties, // Semua denda dari queryDate hingga sekarang - di-cache 15 detik
				staffCount,   // Jumlah staf (di-cache 15 detik)
				branchCount,  // Jumlah cabang (di-cache 30 detik)
				customerCount, // Jumlah pelanggan (di-cache 15 detik)
				recentLogs,   // 5 aktivitas terbaru - di-cache 15 detik
				rentalSettings // Pengaturan sewa (target pendapatan, dll) — di-cache 30 detik
			] = await Promise.all([
				cacheGet(
					`transactions_for_revenue_${branchId || 'all'}_${queryDate.toISOString()}`,
					() => transactionModel.getTransactionsForRevenue(supabase, branchId, queryDate.toISOString()),
					15000
				),
				cacheGet(
					`paid_penalties_for_revenue_${branchId || 'all'}_${queryDate.toISOString()}`,
					() => transactionModel.getPaidPenaltiesForRevenue(supabase, branchId, queryDate.toISOString()),
					15000
				),
				cacheGet(`staff_count_${branchId || 'all'}`, () => staffModel.getStaffCount(supabase, branchId), 15000),
				cacheGet('branch_count', () => branchModel.getBranchesCount(supabase), 30000),
				cacheGet(`customer_count_${branchId || 'all'}`, () => customerModel.getCustomersCount(supabase, branchId), 15000),
				cacheGet(
					`recent_logs_${branchId || 'all'}`,
					() => activityLogModel.getRecentLogs(supabase, branchId, 5),
					15000
				),
				cacheGet('rental_settings', () => settingsModel.getRentalSettings(supabase), 30000)
			]);

			// Target pendapatan bulanan dari pengaturan (default: 20 juta)
			const monthlyRevenueTarget = Number(rentalSettings.monthly_revenue_target) || 20000000;
			let totalTxRevenueMonth = 0;    // Total pendapatan sewa bulan ini
			let totalPenaltyRevenueMonth = 0; // Total pendapatan denda bulan ini
			let successfulTrxCountMonth = 0; // Jumlah transaksi lunas bulan ini

			// Siapkan data 7 hari (untuk grafik batang)
			// Array ini: [{ date: "2025-06-15", label: "Min 15", revenue: 0, penalty: 0 }, ...]
			/** @type {Array<{date: string, label: string, revenue: number, penalty: number}>} */
			const last7Days = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i); // i hari yang lalu
				last7Days.push({
					date: d.toISOString().split('T')[0], // Format "YYYY-MM-DD"
					// Format tampilan: "Min 15" / "Sen 16" / dsb
					label: new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d),
					revenue: 0, // Akan diisi dari data transaksi
					penalty: 0  // Akan diisi dari data denda
				});
			}

			// Proses data transaksi: hitung revenue per hari dan total bulan ini
			if (allTrx) {
				allTrx.forEach((t) => {
					if (t.payment_status === 'paid') {
						const trxDateObj = new Date(t.created_at);
						// Hitung untuk total bulan ini
						if (trxDateObj >= startOfMonth) {
							totalTxRevenueMonth += Number(t.total_amount) || 0;
							successfulTrxCountMonth++;
						}

						// Masukkan ke data grafik 7 hari (konversi ke timezone lokal)
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

			// Proses data denda: hitung penalty per hari dan total bulan ini
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

			// Susun data owner
			ownerData = {
				revenueData: {
					totalRevenueMonth: totalTxRevenueMonth + totalPenaltyRevenueMonth,
					totalTxRevenueMonth,
					totalPenaltyRevenueMonth,
					successfulTrxCountMonth,
					monthlyRevenueTarget
				},
				chartData: {
					labels: last7Days.map((d) => d.label),       // Label untuk sumbu X grafik
					revenueData: last7Days.map((d) => d.revenue), // Data revenue per hari
					penaltyData: last7Days.map((d) => d.penalty)  // Data denda per hari
				},
				staffCount,
				branchCount,
				customerCount,
				recentLogs
			};
		}

		// --- BAGIAN 3: DATA KHUSUS KASIR ---
		let kasirData = null;
		if (profile.role === 'kasir') {
			if (!branchId) {
				// Kasir tanpa cabang (kondisi tidak normal, tangani dengan aman)
				console.error('Cashier has no branch_id assigned.');
				kasirData = {
					todayRevenue: 0,
					todayTrxCount: 0,
					activeRentalsCount: 0,
					todaysPickups: [],
					todaysReturnsDue: []
				};
			} else {
				// Awal hari ini jam 00:00:00 lokal → konversi ke ISO string untuk filter database
				const startOfToday = new Date();
				startOfToday.setHours(0, 0, 0, 0);

				// Jalankan 4 query paralel untuk data kasir - di-cache 15 detik
				const [todayTrx, activeRentalsCount, todaysPickups, todaysReturnsDue] = await Promise.all([
					cacheGet(
						`today_paid_transactions_${branchId}_${startOfToday.toISOString()}`,
						() => transactionModel.getTodayPaidTransactions(supabase, branchId, startOfToday.toISOString()),
						15000
					),
					cacheGet(
						`active_rentals_count_${branchId}`,
						() => transactionModel.getActiveRentalsCount(supabase, branchId),
						15000
					),
					cacheGet(
						`todays_pickups_${branchId}_${todayStr}`,
						() => transactionModel.getTodaysPickups(supabase, branchId, todayStr),
						15000
					),
					cacheGet(
						`todays_returns_due_${branchId}_${todayStr}`,
						() => transactionModel.getTodaysReturnsDue(supabase, branchId, todayStr),
						15000
					)
				]);

				// Hitung total pendapatan hari ini dari semua transaksi lunas
				const todayRevenue = todayTrx.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

				kasirData = {
					todayRevenue,
					todayTrxCount: todayTrx.length, // Jumlah transaksi hari ini
					activeRentalsCount, // Total barang yang masih disewa
					todaysPickups, // Barang yang mulai disewa hari ini
					todaysReturnsDue // Barang yang harusnya sudah dikembalikan
				};
			}
		}

		// --- BAGIAN 4: DATA KHUSUS GUDANG ---
		let gudangData = null;
		if (profile.role === 'gudang') {
			if (!branchId) {
				console.error('Warehouse staff has no branch_id assigned.');
				gudangData = {
					washingAssets: [],
					maintenanceAssets: [],
					todaysShipments: []
				};
			} else {
				// Jalankan 3 query paralel untuk data gudang - di-cache 15 detik
				const [washingAssets, maintenanceAssets, todaysShipments] = await Promise.all([
					cacheGet(
						`washing_assets_${branchId}`,
						() => assetModel.getWashingAssets(supabase, branchId),
						15000
					),
					cacheGet(
						`maintenance_assets_${branchId}`,
						() => assetModel.getMaintenanceAssets(supabase, branchId),
						15000
					),
					cacheGet(
						`todays_pickups_${branchId}_${todayStr}`,
						() => transactionModel.getTodaysPickups(supabase, branchId, todayStr),
						15000
					)
				]);

				gudangData = {
					washingAssets,
					maintenanceAssets,
					todaysShipments
				};
			}
		}

		// Kembalikan semua data yang sudah disiapkan ke halaman
		return {
			role: profile.role,
			profile,
			assetStats,         // Untuk semua role: widget status barang
			recentTransactions, // Untuk semua role: tabel transaksi terkini
			ownerData,         // Hanya terisi jika role = owner
			kasirData,         // Hanya terisi jika role = kasir
			gudangData         // Hanya terisi jika role = gudang
		};
	}
};
