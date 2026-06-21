/**
 * ============================================================
 * FILE: branchController.js
 * TUJUAN: Logic bisnis untuk manajemen cabang (hanya owner).
 *
 * FITUR:
 *   1. Lihat daftar semua cabang (getBranches)
 *   2. Tambah atau edit cabang (saveBranch — satu fungsi untuk keduanya)
 *   3. Hapus cabang (deleteBranch)
 *
 * POLA SAVE (Upsert Pattern):
 *   saveBranch() menangani DUA aksi sekaligus:
 *   - id ada   → UPDATE cabang yang sudah ada
 *   - id null  → INSERT cabang baru
 *   Ini menghemat kode daripada membuat 2 fungsi berbeda (createBranch + updateBranch).
 *
 * PENTINGNYA INVALIDASI CACHE:
 *   Setiap kali data cabang berubah (tambah/edit/hapus),
 *   kita WAJIB hapus semua cache yang terkait cabang.
 *   Jika tidak, user masih melihat data cabang yang lama dari cache.
 * ============================================================
 */

import { branchModel } from '../models/branchModel.js';
import { cacheGet, cacheInvalidate, cacheInvalidatePrefix } from '../cache.js';

export const branchController = {
	/**
	 * Ambil daftar semua cabang (dengan cache 15 detik).
	 * Dipakai halaman Branches untuk menampilkan tabel cabang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		// Cache selama 15 detik untuk menghindari query berulang saat refresh
		const branches = await cacheGet('get_branches', () => branchModel.getBranches(supabase), 15000);
		return {
			branches
		};
	},

	/**
	 * Simpan data cabang — bisa INSERT (baru) atau UPDATE (edit).
	 *
	 * MENGAPA satu fungsi untuk dua aksi?
	 *   Form tambah dan edit cabang menggunakan form yang sama.
	 *   Perbedaannya hanya ada/tidak ada field 'id'.
	 *   Lebih simple daripada membuat endpoint terpisah.
	 *
	 * CACHE INVALIDATION setelah save:
	 *   'get_branches'      → list semua cabang (halaman Branches)
	 *   'layout_branches'   → list cabang di Sidebar/TopBar
	 *   'branch_count'      → jumlah cabang di dashboard owner
	 *   'active_branches'   → dropdown pilih cabang
	 *   'branch_details_*'  → detail setiap cabang (prefix-based)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id - null untuk INSERT baru, string UUID untuk UPDATE
	 * @param {FormData} formData
	 */
	async saveBranch(supabase, id, formData) {
		const name = formData.get('name');
		const address = formData.get('address');
		const phone = formData.get('phone');
		// formData.get() mengembalikan string 'true'/'false', perlu konversi ke boolean
		const is_active = formData.get('is_active') === 'true';

		if (!name) {
			return { success: false, status: 400, error: 'Nama cabang harus diisi.' };
		}

		const branchData = {
			name: name.toString(),
			address: address ? address.toString() : null, // null jika kosong
			phone: phone ? phone.toString() : null,
			is_active
		};

		try {
			if (id) {
				// id ada → UPDATE cabang yang sudah ada
				await branchModel.updateBranch(supabase, id, branchData);
			} else {
				// id null → INSERT cabang baru
				await branchModel.insertBranch(supabase, branchData);
			}

			// WAJIB: Invalidasi semua cache terkait cabang
			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_'); // Hapus semua cache detail cabang

			return { success: true };
		} catch (error) {
			console.error('Error saving branch in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyimpan data cabang.' };
		}
	},

	/**
	 * Hapus cabang berdasarkan ID.
	 *
	 * PERINGATAN: Database akan menolak penghapusan jika cabang masih punya
	 *             data terkait (staff, items, transaksi).
	 *             Ini adalah fitur keamanan, bukan bug.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} id
	 */
	async deleteBranch(supabase, id) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			await branchModel.deleteBranch(supabase, id);

			// Invalidasi cache setelah hapus
			cacheInvalidate('get_branches');
			cacheInvalidate('layout_branches');
			cacheInvalidate('branch_count');
			cacheInvalidate('active_branches');
			cacheInvalidatePrefix('branch_details_');

			return { success: true };
		} catch (error) {
			console.error('Error deleting branch in controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal menghapus cabang (mungkin masih ada data terkait).'
			};
		}
	}
};
