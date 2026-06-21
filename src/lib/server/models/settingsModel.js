/**
 * ============================================================
 * FILE: settingsModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "settings" (pengaturan aplikasi).
 *
 * KONSEP KEY-VALUE STORE:
 *   Tabel settings menyimpan konfigurasi dalam format key-value:
 *   key   = nama pengaturan (contoh: "rental")
 *   value = data JSON pengaturan
 *
 *   Ini fleksibel karena bisa tambah jenis pengaturan baru tanpa ubah skema tabel.
 *
 * PENGATURAN SAAT INI ("rental"):
 *   {
 *     default_rental_duration_days: 4,       → durasi sewa default (hari)
 *     late_fee_per_day_per_transaction: 10000, → biaya keterlambatan per hari
 *     monthly_revenue_target: 20000000        → target pendapatan bulanan
 *   }
 *
 * KONSEP UPSERT:
 *   "Update + Insert" = UPDATE jika data sudah ada, INSERT jika belum ada.
 *   Dipakai agar tidak perlu cek dulu apakah data sudah ada sebelum menyimpan.
 * ============================================================
 */

export const settingsModel = {
	/**
	 * Ambil pengaturan sewa (rental settings).
	 *
	 * .eq('key', 'rental') → ambil baris dengan key = 'rental'
	 * .maybeSingle()       → bisa null jika belum ada pengaturan tersimpan
	 *
	 * data?.value → optional chaining: jika data null, return undefined (tidak error)
	 *
	 * FALLBACK DEFAULT:
	 *   Jika pengaturan belum pernah disimpan (data null/undefined),
	 *   return nilai default yang aman agar aplikasi tidak crash.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getRentalSettings(supabase) {
		const { data, error } = await supabase
			.from('settings')
			.select('*')
			.eq('key', 'rental')
			.maybeSingle();

		if (error) {
			console.error('Error fetching settings in model:', error);
			throw new Error(error.message);
		}

		// Jika pengaturan belum ada di database, gunakan nilai default
		return (
			data?.value || {
				default_rental_duration_days: 4,
				late_fee_per_day_per_transaction: 10000,
				monthly_revenue_target: 20000000
			}
		);
	},

	/**
	 * Simpan pengaturan sewa (UPDATE jika sudah ada, INSERT jika belum ada = UPSERT).
	 *
	 * KONSEP UPSERT dengan onConflict:
	 *   { onConflict: 'key' } → jika ada baris dengan key yang sama,
	 *   UPDATE baris tersebut daripada error karena duplikat.
	 *
	 * updated_at → catat kapan pengaturan terakhir diubah (audit trail)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} value - Objek pengaturan baru yang akan disimpan
	 */
	async upsertRentalSettings(supabase, value) {
		const { error } = await supabase.from('settings').upsert(
			{
				key: 'rental', // Primary key dari baris pengaturan ini
				value: value, // Data pengaturan (disimpan sebagai JSON di DB)
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'key' } // Jika key 'rental' sudah ada → UPDATE, bukan INSERT baru
		);

		if (error) {
			console.error('Error upserting settings in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
