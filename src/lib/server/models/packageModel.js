/**
 * ============================================================
 * FILE: packageModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "packages" dan "package_items".
 *
 * APA ITU PAKET?
 *   Paket adalah BUNDLING beberapa item sewa dengan harga spesial.
 *   Contoh: "Paket Camping Keluarga" = Tenda + Sleeping Bag x4 + Kompor
 *   Dengan harga paket yang lebih murah dari beli satuan.
 *
 * STRUKTUR DATABASE:
 *   packages       → Header paket (nama, harga, deskripsi)
 *   package_items  → Detail isi paket (paket ini berisi item apa saja, qty berapa)
 *
 * RELASI:
 *   packages (1) → package_items (banyak)
 * ============================================================
 */

export const packageModel = {
	/**
	 * Ambil semua paket dengan jumlah item di dalamnya.
	 *
	 * 'package_items(count)' → ambil dari tabel package_items, hitung jumlah item
	 *   Hasilnya: package_items: [{count: 3}] (paket ini berisi 3 item)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getPackages(supabase, branchId = null) {
		let query = supabase
			.from('packages')
			.select('*, package_items(count)') // Hitung jumlah item per paket
			.order('created_at', { ascending: false });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error fetching packages:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil paket yang AKTIF saja untuk satu cabang.
	 * Dipakai POS untuk menampilkan paket yang bisa dipilih pelanggan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActivePackages(supabase, branchId) {
		const { data, error } = await supabase
			.from('packages')
			.select('*')
			.eq('branch_id', branchId)
			.eq('is_active', true) // Hanya paket yang aktif
			.order('name'); // Urut A-Z

		if (error) {
			console.error('Error fetching active packages in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambah paket baru.
	 *
	 * ALUR TAMBAH PAKET (di controller):
	 *   1. insertPackage() → insert header paket, dapat id-nya
	 *   2. insertPackageItems() → insert detail item-item dalam paket menggunakan id tadi
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} packageData - Nama paket, harga, deskripsi, branch_id
	 */
	async insertPackage(supabase, packageData) {
		const { data, error } = await supabase.from('packages').insert(packageData).select().single();

		if (error) {
			console.error('Error inserting package in model:', error);
			throw new Error(error.message);
		}
		return data; // Kembalikan paket yang baru dibuat (termasuk ID-nya)
	},

	/**
	 * Tambah detail item-item ke dalam sebuah paket (bulk insert).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} packageItemsData
	 *   Contoh: [
	 *     { package_id: "uuid-paket", item_id: "uuid-tenda", quantity: 1 },
	 *     { package_id: "uuid-paket", item_id: "uuid-sleeping-bag", quantity: 4 }
	 *   ]
	 */
	async insertPackageItems(supabase, packageItemsData) {
		const { error } = await supabase.from('package_items').insert(packageItemsData);

		if (error) {
			console.error('Error inserting package items in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Hapus paket (biasanya untuk ROLLBACK jika insert package_items gagal).
	 *
	 * MENGAPA perlu rollback?
	 *   Jika insertPackage() berhasil tapi insertPackageItems() gagal,
	 *   paket sudah tersimpan tapi tanpa item di dalamnya (data tidak konsisten).
	 *   Controller akan panggil deletePackage() untuk membatalkan paket yang tanggung tersebut.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id - ID paket yang akan dihapus
	 */
	async deletePackage(supabase, id) {
		const { error } = await supabase.from('packages').delete().eq('id', id);

		if (error) {
			console.error('Error deleting package in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
