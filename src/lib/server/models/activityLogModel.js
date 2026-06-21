/**
 * ============================================================
 * FILE: activityLogModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "activity_logs".
 *
 * APA ITU ACTIVITY LOG?
 *   Audit trail — catatan semua aksi penting yang dilakukan user.
 *   Mirip "buku catatan pengawasan" di toko fisik.
 *
 * CONTOH LOG YANG DICATAT:
 *   - "Budi (kasir) membuat transaksi TRX-AB12-123456"
 *   - "Owner menambah staf baru: Sari"
 *   - "Sari (kasir) memproses pengembalian barang oleh pelanggan Andi"
 *   - "Owner mengubah pengaturan denda"
 *
 * MENGAPA PENTING?
 *   1. Audit: Siapa melakukan apa dan kapan? (penting untuk bisnis)
 *   2. Debugging: Jika ada masalah, bisa lacak kronologinya
 *   3. Akuntabilitas: Staf tahu aksi mereka dicatat
 *
 * STRUKTUR LOG:
 *   user_id     → siapa yang melakukan aksi
 *   branch_id   → di cabang mana
 *   action      → apa yang dilakukan (misal: 'create_customer', 'checkout')
 *   entity_type → jenis data yang diubah (misal: 'customer', 'transaction')
 *   entity_id   → ID data yang diubah
 *   metadata    → data tambahan dalam format JSON (misal: nama pelanggan, jumlah transaksi)
 * ============================================================
 */

export const activityLogModel = {
	/**
	 * Simpan satu entri activity log ke database.
	 * Dipanggil oleh SETIAP controller setelah melakukan aksi penting.
	 *
	 * CATATAN: Jika gagal, hanya log error ke console — TIDAK throw.
	 *   Ini disengaja agar kegagalan pencatatan log TIDAK mengganggu operasi utama.
	 *   Misalnya: Jika gagal catat log "buat customer", customer tetap berhasil dibuat.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string} params.userId - ID user yang melakukan aksi
	 * @param {string|null} params.branchId - ID cabang (null jika aksi global)
	 * @param {string} params.action - Nama aksi (contoh: 'create_customer', 'checkout')
	 * @param {string} params.entityType - Tipe entitas (contoh: 'customer', 'transaction')
	 * @param {string} params.entityId - ID entitas yang diubah
	 * @param {object} params.metadata - Data tambahan dalam objek (akan disimpan sebagai JSON)
	 */
	async logActivity(supabase, { userId, branchId, action, entityType, entityId, metadata }) {
		const { error } = await supabase.from('activity_logs').insert({
			user_id: userId,
			branch_id: branchId,
			action,
			entity_type: entityType,
			entity_id: entityId,
			metadata // Objek JS → Supabase otomatis konversi ke JSONB di PostgreSQL
		});

		if (error) {
			// Hanya log error, TIDAK throw → log gagal tidak boleh hentikan proses utama
			console.error('Error inserting activity log:', error);
		}
	},

	/**
	 * Ambil log aktivitas dengan filter, pagination, dan total hitungan.
	 * Dipakai halaman Activity Log untuk menampilkan semua aktivitas.
	 *
	 * FITUR:
	 *   - Filter per cabang (branchId)
	 *   - Pencarian di kolom action DAN entity_type
	 *   - Pagination (from-to)
	 *   - JOIN ke profiles (nama user) dan branches (nama cabang)
	 *
	 * .or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`)
	 *   → Cari di field action ATAU entity_type
	 *   → ilike = case-insensitive like (tidak bedakan huruf besar/kecil)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} params
	 * @param {string|null} [params.branchId]
	 * @param {string|null} [params.search]
	 * @param {number} params.from - Index baris awal (0-based, untuk pagination)
	 * @param {number} params.to   - Index baris akhir (inklusif)
	 */
	async getActivityLogs(supabase, { branchId = null, search = null, from, to }) {
		let query = supabase.from('activity_logs').select(
			`
				*,
				profile:profiles(full_name, role),
				branch:branches(name)
			`,
			{ count: 'exact' } // Hitung total untuk pagination
		);

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		if (search) {
			// Cari di action ATAU entity_type, case-insensitive
			query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
		}

		// Urut terbaru dulu, lalu batasi range halaman
		query = query.order('created_at', { ascending: false }).range(from, to);

		const { data, count, error } = await query;
		if (error) {
			console.error('Fetch activity logs error in model:', error);
			throw new Error(error.message);
		}
		return {
			logs: data || [],
			count: count || 0 // Total log untuk info "halaman X dari Y"
		};
	},

	/**
	 * Ambil log aktivitas TERBARU dalam jumlah terbatas.
	 * Dipakai widget "Aktivitas Terkini" di dashboard owner.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {number} limit - Berapa log yang diambil (default 5)
	 */
	async getRecentLogs(supabase, branchId = null, limit = 5) {
		let query = supabase
			.from('activity_logs')
			.select('*, profile:profiles(full_name, role), branch:branches(name)')
			.order('created_at', { ascending: false }) // Terbaru dulu
			.limit(limit); // Batasi jumlah

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch recent logs error in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	}
};
