/**
 * ============================================================
 * FILE: transactionController.js
 * TUJUAN: Logic bisnis untuk halaman Transactions (riwayat transaksi).
 *
 * FITUR:
 *   1. Lihat daftar transaksi dengan search dan pagination (getTransactionsList)
 *   2. Lihat detail satu transaksi / struk (getTransactionDetails)
 *
 * CATATAN: Proses CHECKOUT (membuat transaksi baru) ada di posController.js.
 *          Controller ini hanya untuk MEMBACA data transaksi yang sudah ada.
 * ============================================================
 */

import { transactionModel } from '../models/transactionModel.js';
import { branchModel } from '../models/branchModel.js';
import { cacheGet } from '../cache.js';

export const transactionController = {
	/**
	 * Ambil daftar transaksi dengan filter search dan pagination.
	 * Meneruskan parameter ke model dan menyusun hasil untuk halaman.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} search - Kata kunci pencarian (kode transaksi)
	 * @param {number} page - Nomor halaman
	 * @param {number} limit - Jumlah per halaman
	 * @param {{ branchId?: string, type?: string, status?: string }} filters - Filter tambahan
	 */
	async getTransactionsList(supabase, profile, search = '', page = 1, limit = 10, filters = {}) {
		const { data, count } = await transactionModel.getTransactions(
			supabase,
			profile.branch_id, // null untuk owner (lihat semua cabang)
			search,
			page,
			limit,
			filters
		);
		return {
			transactions: data,
			totalCount: count, // Total semua transaksi (untuk pagination)
			search,
			page,
			limit,
			filters
		};
	},

	/**
	 * Ambil detail lengkap satu transaksi untuk halaman struk/detail.
	 *
	 * DATA YANG DIKEMBALIKAN:
	 *   - transaction → data transaksi + data pelanggan & kasir
	 *   - transaction.items → semua item dalam transaksi (ditambahkan ke objek)
	 *   - branch → data cabang untuk header struk (di-cache 60 detik)
	 *   - isSuccess → apakah transaksi ini baru saja berhasil diproses?
	 *
	 * KONSEP isSuccess:
	 *   Setelah checkout berhasil, user di-redirect ke:
	 *   /transactions/[id]?success=true
	 *   Halaman mendeteksi ?success=true dan menampilkan animasi/pesan "Pembayaran berhasil!"
	 *   Tapi isSuccess = true HANYA jika payment_status juga 'paid'
	 *   (mencegah manipulasi URL untuk menampilkan pesan sukses palsu)
	 *
	 * CACHING BRANCH DATA:
	 *   Data cabang (nama, alamat, telepon) di-cache 60 detik.
	 *   Ini sering dipanggil (setiap lihat struk) tapi jarang berubah.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 * @param {string} id - ID transaksi
	 * @param {boolean} isSuccess - Dari query param ?success=true
	 */
	async getTransactionDetails(supabase, profile, id, isSuccess) {
		// Ambil data transaksi utama
		const transaction = await transactionModel.getTransactionDetail(
			supabase,
			id,
			profile.branch_id // Filter keamanan: kasir hanya bisa lihat transaksi cabangnya
		);

		// Jika transaksi tidak ditemukan → redirect ke halaman daftar
		if (!transaction) {
			return {
				success: false,
				redirect: '/transactions'
			};
		}

		// Ambil semua item dalam transaksi ini dan lampirkan ke objek transaksi
		const items = await transactionModel.getTransactionItemsList(supabase, id);
		transaction.items = items; // Tambahkan property 'items' ke objek transaction

		// Ambil data cabang untuk ditampilkan di header struk (nama, alamat, telepon)
		let branch = null;
		const branchId = profile.branch_id;
		if (branchId) {
			// Cache 60 detik — data cabang jarang berubah
			branch = await cacheGet(
				`branch_details_${branchId}`,
				() => branchModel.getBranchDetails(supabase, branchId),
				60000
			);
		}

		return {
			success: true,
			transaction,
			branch: branch || { name: 'BotaniRent', address: '', phone: '' }, // Fallback default
			// isSuccess = true HANYA jika URL punya ?success=true DAN transaksi benar-benar sudah dibayar
			isSuccess: isSuccess && transaction.payment_status === 'paid'
		};
	}
};
