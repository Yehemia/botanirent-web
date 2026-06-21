/**
 * ============================================================
 * FILE: penaltyModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "penalty_rules" dan "penalties".
 *
 * ADA 2 TABEL TERKAIT DENDA:
 *
 * 1. penalty_rules → ATURAN denda (dikonfigurasi oleh owner)
 *    Contoh:
 *    - Terlambat: Rp 10.000/hari
 *    - Barang hilang: 100% harga jual
 *    - Barang rusak ringan: 25% harga jual
 *    - Barang rusak berat: 75% harga jual
 *
 * 2. penalties → CATATAN denda yang sudah TERJADI pada transaksi tertentu
 *    Contoh:
 *    - Budi terlambat 2 hari → denda Rp 20.000
 *    - Andi merusak tenda → denda Rp 150.000
 * ============================================================
 */

export const penaltyModel = {
	/**
	 * Ambil semua aturan denda yang dikonfigurasi.
	 * Dipakai di halaman Penalties untuk ditampilkan dan diedit owner.
	 *
	 * ascending: true → urut dari aturan yang pertama dibuat (paling lama)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getPenaltyRules(supabase) {
		const { data, error } = await supabase
			.from('penalty_rules')
			.select('*')
			.order('created_at', { ascending: true }); // Urut dari yang lama (stabil)

		if (error) {
			console.error('Fetch penalty rules error in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Update jumlah denda pada satu aturan denda.
	 * Dipanggil owner ketika mengubah besaran denda (misalnya dari 10.000 jadi 15.000/hari).
	 *
	 * { amount } → shorthand property: sama dengan { amount: amount }
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id - ID aturan denda
	 * @param {number} amount - Nilai baru denda
	 */
	async updatePenaltyRule(supabase, id, amount) {
		const { error } = await supabase.from('penalty_rules').update({ amount }).eq('id', id);

		if (error) {
			console.error('Update penalty rule error in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Catat kejadian denda baru (saat proses pengembalian barang).
	 * Dipanggil returnsController ketika kasir memilih kondisi barang rusak atau terlambat.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} penaltyData
	 *   Contoh: {
	 *     transaction_item_id: "uuid",
	 *     branch_id: "uuid",
	 *     type: "late" | "damage_light" | "damage_heavy" | "lost",
	 *     calculated_amount: 20000,
	 *     payment_status: "unpaid",
	 *     notes: "Terlambat 2 hari"
	 *   }
	 */
	async insertPenalty(supabase, penaltyData) {
		const { error } = await supabase.from('penalties').insert(penaltyData);

		if (error) {
			console.error('Insert penalty error in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
