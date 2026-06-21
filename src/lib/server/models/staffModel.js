/**
 * ============================================================
 * FILE: staffModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "profiles" (data staf/karyawan).
 *
 * APA ITU "profiles"?
 *   Supabase menyediakan tabel "auth.users" untuk autentikasi.
 *   Tabel "profiles" adalah EKSTENSI dari auth.users yang menyimpan
 *   data tambahan seperti nama, role, dan cabang.
 *
 * MENGAPA MODEL INI SANGAT KECIL?
 *   Sebagian besar operasi staf (tambah, edit, hapus, lihat daftar)
 *   dilakukan melalui Supabase Admin API di controller, bukan lewat model ini.
 *   Model ini hanya menyediakan query sederhana yang sering dipakai.
 * ============================================================
 */

export const staffModel = {
	/**
	 * Hitung total jumlah staf, opsional difilter per cabang.
	 * Dipakai untuk widget "Jumlah Staf" di dashboard owner.
	 *
	 * { count: 'exact', head: true } → COUNT(*) tanpa mengambil data baris
	 *   Lebih efisien: hanya mengambil angka hitungan, bukan semua data staf
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId - null = hitung semua cabang (untuk owner)
	 */
	async getStaffCount(supabase, branchId = null) {
		let query = supabase.from('profiles').select('*', { count: 'exact', head: true });

		// Jika ada branchId, filter per cabang. Jika null, hitung semua staf.
		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { count, error } = await query;
		if (error) {
			console.error('Error fetching staff count in model:', error);
			throw new Error(error.message);
		}
		return count || 0;
	}
};
