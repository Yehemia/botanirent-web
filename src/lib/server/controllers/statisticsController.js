/**
 * ============================================================
 * FILE: statisticsController.js
 * TUJUAN: Logic bisnis untuk halaman Statistics (laporan & analitik).
 *
 * Halaman statistik menampilkan berbagai analisis data bisnis:
 *   1. Total pendapatan, jumlah transaksi, rata-rata nilai transaksi
 *   2. Pendapatan per cabang (untuk owner)
 *   3. Barang terlaris (top 5 by quantity)
 *   4. Breakdown pendapatan per tipe (sewa, jual, paket, denda)
 *   5. Tren pendapatan 6 bulan terakhir (grafik garis)
 *
 * KONSEP MAP untuk lookup cepat:
 *   Map = struktur data key-value seperti kamus.
 *   new Map(array.map(item => [item.id, item.name]))
 *   → Konversi array [{id, name}, ...] ke Map {id → name, ...}
 *   → Lookup Map[id] jauh lebih cepat dari array.find() untuk data besar
 *
 * CACHING:
 *   Seluruh kalkulasi statistik di-cache selama 15 detik.
 *   Ini penting karena statistik melibatkan banyak data dan kalkulasi berat.
 * ============================================================
 */

import { branchModel } from '../models/branchModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { cacheGet } from '../cache.js';

export const statisticsController = {
	/**
	 * Hitung dan kembalikan semua data statistik.
	 *
	 * ALUR:
	 * 1. Ambil data dari database (paralel)
	 * 2. Buat Map cabang untuk lookup cepat
	 * 3. Filter item sesuai cabang (jika bukan semua cabang)
	 * 4. Hitung metrik utama (total revenue, count, average)
	 * 5. Hitung revenue per cabang
	 * 6. Cari barang terlaris
	 * 7. Breakdown per tipe transaksi
	 * 8. Hitung tren 6 bulan
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 */
	async getStatistics(supabase, profile) {
		// Cache key unik per cabang: 'statistics_all' atau 'statistics_[id]'
		const cacheKey = `statistics_${profile.branch_id || 'all'}`;

		// Seluruh kalkulasi di-cache 15 detik
		return cacheGet(cacheKey, async () => {
			// 1. Ambil data dari database secara paralel
			const [branches, txList, penaltyList, allItems] = await Promise.all([
				branchModel.getAllBranches(supabase),                             // Semua cabang
				transactionModel.getPaidTransactions(supabase, profile.branch_id), // Transaksi lunas
				transactionModel.getPaidPenalties(supabase, profile.branch_id),   // Denda lunas
				transactionModel.getTransactionItems(supabase, profile.branch_id)  // Item transaksi
			]);

			// 2. Buat Map cabang untuk lookup cepat (O(1) vs O(n) untuk array.find)
			// branches = [{id: 'uuid', name: 'Cabang A'}, ...]
			// branchMap = Map {'uuid' → 'Cabang A', ...}
			const branchMap = new Map((branches || []).map((b) => [b.id, b.name]));

			// 3. Filter item sesuai cabang aktif (jika kasir, bukan owner)
			let itemList = allItems || [];
			if (profile.branch_id) {
				// Buat Set ID transaksi yang valid untuk cabang ini
				// Set lebih cepat dari array untuk pengecekan .has()
				const activeTxIds = new Set(txList.map((t) => t.id));
				// Hanya ambil item yang transaction_id-nya ada dalam Set
				itemList = itemList.filter((item) => activeTxIds.has(item.transaction_id));
			}

			// 4. Hitung metrik utama
			// .reduce() = iterasi array dan akumulasi nilai
			// acc = accumulator (nilai yang terkumpul)
			const totalTxRevenue = txList.reduce((acc, t) => acc + Number(t.total_amount), 0);
			const totalPenaltyRevenue = penaltyList.reduce(
				(acc, p) => acc + Number(p.calculated_amount),
				0
			);
			const totalRevenue = totalTxRevenue + totalPenaltyRevenue;
			const totalTxCount = txList.length;
			// Rata-rata nilai transaksi (hindari division by zero)
			const avgTxValue = totalTxCount > 0 ? totalTxRevenue / totalTxCount : 0;

			// 5. Hitung revenue per cabang
			/** @type {Record<string, { name: string, revenue: number, count: number, penalty_revenue: number }>} */
			const branchStats = {};
			// Inisialisasi counter untuk semua cabang yang diketahui
			branchMap.forEach((name, id) => {
				branchStats[id] = { name, revenue: 0, count: 0, penalty_revenue: 0 };
			});

			// Akumulasi revenue transaksi per cabang
			txList.forEach((t) => {
				if (branchStats[t.branch_id]) {
					branchStats[t.branch_id].revenue += Number(t.total_amount);
					branchStats[t.branch_id].count += 1;
				} else {
					// Fallback: cabang tidak ada di master data (cabang sudah dihapus tapi transaksi masih ada)
					branchStats[t.branch_id] = {
						name: 'Cabang Unknown',
						revenue: Number(t.total_amount),
						count: 1,
						penalty_revenue: 0
					};
				}
			});

			// Akumulasi revenue denda per cabang
			penaltyList.forEach((p) => {
				if (branchStats[p.branch_id]) {
					branchStats[p.branch_id].revenue += Number(p.calculated_amount);
					branchStats[p.branch_id].penalty_revenue += Number(p.calculated_amount);
				}
			});

			// 6. Hitung barang terlaris (top 5 by quantity)
			/** @type {Record<string, { name: string, quantity: number, type: string, total: number }>} */
			const itemStats = {};
			itemList.forEach((item) => {
				const name = item.item_name;
				if (!itemStats[name]) {
					// Inisialisasi jika nama barang belum ada
					itemStats[name] = { name, quantity: 0, type: item.type, total: 0 };
				}
				// Akumulasi quantity dan total pendapatan per nama barang
				itemStats[name].quantity += item.quantity;
				itemStats[name].total += Number(item.subtotal);
			});

			// Urutkan dari yang terbanyak, ambil 5 teratas
			const popularItems = Object.values(itemStats)
				.sort((a, b) => b.quantity - a.quantity) // Sort descending by quantity
				.slice(0, 5); // Ambil 5 teratas

			// 7. Breakdown per tipe transaksi
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

			// 8. Hitung tren pendapatan 6 bulan terakhir
			/** @type {Record<string, number>} */
			const monthlyRevenue = {};
			const monthNames = [
				'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
				'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
			];

			// Generate key dan label untuk 6 bulan terakhir (format: "2025-06")
			const trendLabels = [];
			for (let i = 5; i >= 0; i--) {
				const date = new Date();
				date.setMonth(date.getMonth() - i); // Mundur i bulan
				// Key format: "YYYY-MM" — padStart memastikan selalu 2 digit (contoh: "06" bukan "6")
				const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				monthlyRevenue[key] = 0; // Inisialisasi ke 0
				trendLabels.push({
					key,
					label: `${monthNames[date.getMonth()]} ${date.getFullYear()}` // Contoh: "Jun 2025"
				});
			}

			// Akumulasi pendapatan transaksi per bulan
			txList.forEach((t) => {
				const dateObj = new Date(t.created_at);
				const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
				if (monthlyRevenue[key] !== undefined) {
					monthlyRevenue[key] += Number(t.total_amount);
				}
			});

			// Akumulasi pendapatan denda per bulan
			penaltyList.forEach((p) => {
				const dateObj = new Date(p.created_at);
				const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
				if (monthlyRevenue[key] !== undefined) {
					monthlyRevenue[key] += Number(p.calculated_amount);
				}
			});

			// Konversi ke array untuk grafik
			const trendData = trendLabels.map((t) => monthlyRevenue[t.key]); // Array nilai
			const trendLabelStrings = trendLabels.map((t) => t.label); // Array label

			// Kembalikan semua data yang sudah dihitung
			return {
				metrics: {
					totalRevenue,        // Total semua pendapatan (sewa + denda)
					totalTxRevenue,      // Pendapatan dari transaksi sewa/jual
					totalPenaltyRevenue, // Pendapatan dari denda
					totalTxCount,        // Jumlah transaksi
					avgTxValue           // Rata-rata nilai per transaksi
				},
				branchStats: Object.values(branchStats), // Array statistik per cabang
				popularItems,   // Top 5 barang terlaris
				typeBreakdown,  // Pendapatan per tipe (retail/rental/package/penalty)
				trend: {
					labels: trendLabelStrings, // Label sumbu X grafik (bulan)
					data: trendData             // Data nilai untuk grafik
				}
			};
		}, 15000); // Cache 15 detik
	}
};
