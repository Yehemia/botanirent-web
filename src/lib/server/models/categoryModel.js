/**
 * ============================================================
 * FILE: categoryModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "categories" (kategori barang).
 *
 * KATEGORI BARANG:
 *   Setiap item harus punya kategori. Contoh:
 *   - Tenda          → kategori: "Tenda" (type: sewa)
 *   - Sleeping Bag   → kategori: "Sleeping Bag" (type: sewa)
 *   - Perlengkapan   → kategori: "Perlengkapan" (type: jual)
 *   - Logistik       → kategori: "Logistik" (type: jual)
 *
 * ADA 2 TIPE KATEGORI:
 *   'sewa' → barang yang disewakan (dikembalikan setelah pakai)
 *   'jual' → barang yang dijual (tidak perlu dikembalikan)
 *
 * 'sort_order' → urutan tampil kategori (bukan urutan alfabet)
 *   Memudahkan menampilkan kategori sesuai yang diinginkan bisnis.
 * ============================================================
 */

export const categoryModel = {
	/**
	 * Ambil SEMUA kategori, diurutkan berdasarkan sort_order.
	 * Dipakai di form tambah/edit item untuk dropdown pilih kategori.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getCategories(supabase) {
		const { data, error } = await supabase.from('categories').select('*').order('sort_order');

		if (error) {
			console.error('Error loading categories:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil kategori yang difilter berdasarkan TIPE ('sewa' atau 'jual').
	 * Dipakai POS untuk mengelompokkan item di keranjang berdasarkan tipenya.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} type - 'sewa' atau 'jual'
	 */
	async getCategoriesByType(supabase, type) {
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.eq('type', type) // Filter berdasarkan tipe
			.order('sort_order');

		if (error) {
			console.error(`Error loading categories of type ${type}:`, error);
			throw new Error(error.message);
		}
		return data || [];
	}
};
