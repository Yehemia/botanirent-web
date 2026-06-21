/**
 * ============================================================
 * FILE: itemModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "items" (jenis barang).
 *
 * APA ITU "items"?
 *   Items adalah JENIS/TIPE barang yang ada di inventaris.
 *   Contoh: "Tenda Dome 4 Orang", "Sleeping Bag Mummy", "Kompor Portable"
 *
 *   Berbeda dengan "rental_assets" yang adalah unit FISIK barang.
 *   items     = "Tenda Dome 4 Orang" (konsep / jenis)
 *   rental_assets = "TDA-001", "TDA-002" (unit fisik yang bisa dilacak)
 *
 * ADA 2 TIPE ITEM:
 *   'sewa'  → disewakan, punya unit fisik (rental_assets), punya tanggal kembali
 *   'jual'  → dijual langsung, tidak perlu dikembalikan (seperti logistik/baterai)
 * ============================================================
 */

export const itemModel = {
	/**
	 * Ambil semua item dengan data kategori, opsional difilter per cabang.
	 *
	 * 'category:categories(name, type)' → JOIN ke tabel categories,
	 *   ambil nama dan tipe kategori, simpan dengan alias "category"
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getItems(supabase, branchId = null) {
		let query = supabase
			.from('items')
			.select('*, category:categories(name, type)')
			.order('created_at', { ascending: false }); // Terbaru di atas

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error loading items:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil item tipe SEWA yang aktif untuk satu cabang.
	 * Dipakai POS saat kasir menambahkan barang sewa ke keranjang.
	 *
	 * 'categories!inner(name, type)' → !inner = INNER JOIN
	 *   Hanya ambil item yang PASTI punya kategori (filter ketat)
	 * .eq('categories.type', 'sewa') → hanya kategori bertipe sewa
	 * .eq('is_active', true) → hanya item yang masih aktif
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActiveSewaItems(supabase, branchId) {
		const { data, error } = await supabase
			.from('items')
			.select('*, category:categories!inner(name, type)')
			.eq('branch_id', branchId)
			.eq('categories.type', 'sewa') // Filter: hanya tipe sewa
			.eq('is_active', true) // Filter: hanya yang aktif
			.order('name'); // Urut A-Z

		if (error) {
			console.error('Error fetching active sewa items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil SEMUA item aktif (sewa DAN jual) untuk satu cabang.
	 * Dipakai POS untuk menampilkan semua barang yang bisa ditambahkan ke keranjang.
	 *
	 * Berbeda dari getActiveSewaItems() — ini juga termasuk item jual.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActiveItems(supabase, branchId) {
		const { data, error } = await supabase
			.from('items')
			.select('*, category:categories(type)') // Ambil type kategori untuk membedakan sewa vs jual
			.eq('branch_id', branchId)
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Error fetching active items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil detail lengkap satu item beserta semua info kategorinya.
	 * Dipakai halaman edit item.
	 *
	 * 'categories(*)' → ambil SEMUA kolom dari tabel categories
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getItemDetails(supabase, id) {
		const { data, error } = await supabase
			.from('items')
			.select('*, categories(*)')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Error fetching item details in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Tambah item baru ke database.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} itemData - Nama, harga sewa, harga jual, stok, gambar, dll
	 */
	async insertItem(supabase, itemData) {
		const { data, error } = await supabase.from('items').insert(itemData).select().single();

		if (error) {
			console.error('Error inserting item in model:', error);
			throw new Error(error.message);
		}
		return data; // Kembalikan item yang baru dibuat (termasuk ID-nya)
	},

	/**
	 * Update item yang sudah ada.
	 *
	 * .select().single() setelah update → kembalikan data terbaru item tersebut
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} itemData
	 */
	async updateItem(supabase, id, itemData) {
		const { data, error } = await supabase
			.from('items')
			.update(itemData)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating item in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hapus item dari database.
	 *
	 * CATATAN: Jika item masih punya rental_assets atau transaction_items,
	 *          penghapusan akan gagal (foreign key constraint).
	 *          Di halaman inventory, ada cek terlebih dahulu sebelum delete.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteItem(supabase, id) {
		const { error } = await supabase.from('items').delete().eq('id', id);

		if (error) {
			console.error('Error deleting item in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Tambah banyak item sekaligus (bulk insert).
	 * Dipakai untuk fitur import data inventaris secara massal.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} itemsList - Array berisi data setiap item
	 */
	async bulkInsertItems(supabase, itemsList) {
		const { error } = await supabase.from('items').insert(itemsList);

		if (error) {
			console.error('Error bulk inserting items in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
