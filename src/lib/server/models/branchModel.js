/**
 * ============================================================
 * FILE: branchModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "branches" (cabang).
 *
 * BotaniRent bisa punya BANYAK CABANG (multi-branch).
 * Model ini mengurus semua operasi CRUD untuk data cabang.
 *
 * KONSEP MULTI-BRANCH:
 *   - Owner bisa kelola semua cabang
 *   - Kasir & Gudang hanya bisa akses data cabang mereka sendiri
 *   - Banyak query di model lain filter berdasarkan branch_id
 * ============================================================
 */

export const branchModel = {
	/**
	 * Ambil semua cabang (hanya id dan nama).
	 * Dipakai untuk keperluan referensi ringan (lookup/mapping).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getAllBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('id, name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil cabang yang AKTIF saja, diurutkan A-Z.
	 * Dipakai untuk dropdown pemilih cabang di TopBar.
	 * (Cabang non-aktif tidak muncul di pilihan)
	 *
	 * .eq('is_active', true) → hanya ambil yang is_active = true
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getActiveBranches(supabase) {
		const { data, error } = await supabase
			.from('branches')
			.select('*')
			.eq('is_active', true) // Filter hanya yang aktif
			.order('name'); // Urutkan A-Z

		if (error) {
			console.error('Fetch active branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil SEMUA cabang (aktif maupun nonaktif), diurutkan A-Z.
	 * Dipakai di halaman manajemen cabang (owner bisa lihat semua).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranches(supabase) {
		const { data, error } = await supabase.from('branches').select('*').order('name');

		if (error) {
			console.error('Fetch branches error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambah cabang baru.
	 *
	 * insert([branchData]) → bungkus dalam array [] karena insert menerima array
	 * .select() → kembalikan data yang baru dimasukkan (termasuk id auto-generate)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} branchData - Nama cabang, alamat, telepon, dll
	 */
	async insertBranch(supabase, branchData) {
		const { data, error } = await supabase.from('branches').insert([branchData]).select();

		if (error) {
			console.error('Insert branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update data cabang yang sudah ada.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} branchData - Data yang akan diupdate
	 */
	async updateBranch(supabase, id, branchData) {
		const { data, error } = await supabase
			.from('branches')
			.update(branchData)
			.eq('id', id)
			.select(); // Kembalikan data yang sudah diupdate

		if (error) {
			console.error('Update branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Nonaktifkan cabang berdasarkan ID (Soft Deactivation).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string|null} notes - alasan penonaktifan
	 */
	async deactivateBranch(supabase, id, notes) {
		const { data, error } = await supabase
			.from('branches')
			.update({ is_active: false, deactivation_notes: notes })
			.eq('id', id)
			.select();

		if (error) {
			console.error('Deactivate branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Aktifkan kembali cabang berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async activateBranch(supabase, id) {
		const { data, error } = await supabase
			.from('branches')
			.update({ is_active: true, deactivation_notes: null })
			.eq('id', id)
			.select();

		if (error) {
			console.error('Activate branch error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hitung total jumlah cabang (untuk widget di dashboard owner).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getBranchesCount(supabase) {
		const { count, error } = await supabase
			.from('branches')
			.select('*', { count: 'exact', head: true }); // COUNT tanpa ambil data

		if (error) {
			console.error('Fetch branches count error:', error);
			throw new Error(error.message);
		}
		return count || 0;
	},

	/**
	 * Ambil detail satu cabang: nama, alamat, telepon.
	 * Dipakai untuk activity log dan struk transaksi.
	 *
	 * .maybeSingle() → ambil 0 atau 1 baris (tidak error jika tidak ditemukan)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getBranchDetails(supabase, id) {
		const { data, error } = await supabase
			.from('branches')
			.select('name, address, phone')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Fetch branch details error in model:', error);
			throw new Error(error.message);
		}
		return data; // Bisa null jika tidak ditemukan
	}
};
