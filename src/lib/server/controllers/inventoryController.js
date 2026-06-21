/**
 * ============================================================
 * FILE: inventoryController.js
 * TUJUAN: Logic bisnis untuk halaman Inventory (manajemen jenis barang).
 *
 * Controller ini sangat sederhana karena tugasnya hanya MEMBACA data.
 * Operasi CRUD item (tambah, edit, hapus, kelola stok) masing-masing
 * ditangani oleh itemController.js yang lebih kompleks.
 *
 * HALAMAN INVENTORY menampilkan:
 *   - Daftar semua kategori (untuk filter di sisi kiri)
 *   - Daftar semua item di cabang ini (tabel utama)
 * ============================================================
 */

import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';

export const inventoryController = {
	/**
	 * Ambil data yang dibutuhkan halaman inventory.
	 *
	 * Promise.all([A, B]) → jalankan 2 query paralel sekaligus
	 * (lebih cepat daripada await A kemudian await B)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile - branch_id null untuk owner (lihat semua)
	 */
	async getInventoryData(supabase, profile) {
		// Jalankan 2 query bersamaan
		const [categories, items] = await Promise.all([
			categoryModel.getCategories(supabase),          // Semua kategori (sewa + jual)
			itemModel.getItems(supabase, profile.branch_id) // Item sesuai cabang (atau semua jika owner)
		]);

		return {
			categories,
			items
		};
	}
};
