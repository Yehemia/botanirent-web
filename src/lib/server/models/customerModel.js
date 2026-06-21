/**
 * ============================================================
 * FILE: customerModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "customers".
 *         File ini HANYA BERTUGAS berbicara dengan database —
 *         tidak ada logic bisnis, tidak ada validasi input.
 *
 * POLA ARSITEKTUR: MVC (Model-View-Controller)
 *   ┌──────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐
 *   │  Halaman  │ → │ Controller │ → │   Model    │ → │ Database │
 *   │ (Svelte) │    │  (logic)   │    │ (query DB) │    │(Supabase)│
 *   └──────────┘    └────────────┘    └────────────┘    └──────────┘
 *
 * ANALOGI: Model = "pegawai gudang" yang tugasnya hanya mengambil/
 *          menyimpan barang dari rak sesuai perintah.
 *          Dia tidak memutuskan APAKAH boleh mengambil — itu urusan Controller.
 *
 * CARA PAKAI:
 *   import { customerModel } from './models/customerModel.js';
 *   const customers = await customerModel.getCustomers(supabase, branchId);
 *
 * KONSEP SUPABASE QUERY BUILDER:
 *   supabase.from('table')    → pilih tabel
 *     .select('kolom')        → pilih kolom (seperti SELECT di SQL)
 *     .eq('kolom', 'nilai')   → filter (seperti WHERE kolom = nilai)
 *     .order('kolom')         → urutan hasil
 *     .single()               → ambil 1 baris saja
 * ============================================================
 */

export const customerModel = {
	/**
	 * Ambil semua data pelanggan untuk satu cabang,
	 * BESERTA nested data: transaksi, item transaksi, dan denda.
	 *
	 * KONSEP NESTED SELECT (JOIN):
	 *   Supabase bisa mengambil data tabel-tabel terkait sekaligus
	 *   dalam satu query menggunakan relasi foreign key.
	 *   Hasilnya otomatis berbentuk objek bersarang (nested object).
	 *
	 * CONTOH HASIL:
	 *   {
	 *     id: "uuid",
	 *     full_name: "Budi",
	 *     transactions: [           ← data dari tabel transactions
	 *       {
	 *         id: "uuid",
	 *         transaction_items: [  ← data dari tabel transaction_items
	 *           {
	 *             penalties: [...]  ← data dari tabel penalties
	 *           }
	 *         ]
	 *       }
	 *     ]
	 *   }
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getCustomers(supabase, branchId) {
		const { data, error } = await supabase
			.from('customers')
			.select(
				`
				*,
				transactions(
					id,
					transaction_code,
					created_at,
					payment_status,
					type,
					total_amount,
					transaction_items(
						id,
						item_name,
						quantity,
						unit_price,
						subtotal,
						rental_start_date,
						rental_end_date,
						rental_status,
						returned_at,
						return_condition,
						return_notes,
						penalties(
							id,
							type,
							calculated_amount,
							payment_status,
							notes
						)
					)
				)
			`
			)
			// Filter hanya pelanggan dari cabang ini
			.eq('branch_id', branchId)
			// Urutkan: pelanggan terbaru di atas
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching customers:', error);
			throw new Error(error.message);
		}
		// Jika data null (tidak ada pelanggan), kembalikan array kosong []
		return data || [];
	},

	/**
	 * Ambil daftar pelanggan MINIMAL (hanya id, nama, telepon, notes)
	 * untuk keperluan DROPDOWN di form — tidak perlu data transaksi.
	 *
	 * MENGAPA ADA 2 VERSI?
	 *   getCustomers()        → data lengkap (berat, untuk halaman customers)
	 *   getCustomersMinimal() → data ringan (untuk dropdown di POS/checkout)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getCustomersMinimal(supabase, branchId) {
		const { data, error } = await supabase
			.from('customers')
			.select('id, full_name, phone, notes')
			.eq('branch_id', branchId)
			.order('full_name'); // Urutkan A-Z agar mudah dicari

		if (error) {
			console.error('Error fetching customers minimal:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambah pelanggan baru ke database.
	 *
	 * .insert(data)  → menyimpan baris baru (seperti INSERT INTO di SQL)
	 * .select()      → setelah insert, ambil data yang baru disimpan
	 * .single()      → pastikan hasilnya hanya 1 baris
	 *
	 * MENGAPA perlu .select().single() setelah insert?
	 *   Agar kita mendapat kembali data yang tersimpan (termasuk ID yang di-generate database)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} customerData
	 */
	async createCustomer(supabase, customerData) {
		const { data, error } = await supabase.from('customers').insert(customerData).select().single();

		if (error) {
			console.error('Error creating customer in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update data pelanggan yang sudah ada.
	 *
	 * .update(data) → ubah data (seperti UPDATE ... SET di SQL)
	 * .eq('id', id) → filter: hanya baris dengan id ini yang diubah
	 *
	 * MENGAPA return true, bukan data?
	 *   Kita tidak butuh data baliknya — cukup tahu apakah berhasil atau tidak.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} customerData
	 */
	async updateCustomer(supabase, id, customerData) {
		const { error } = await supabase.from('customers').update(customerData).eq('id', id);

		if (error) {
			console.error('Error updating customer in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Hapus pelanggan dari database berdasarkan ID.
	 *
	 * PENTING: Di database ada FOREIGN KEY CONSTRAINT.
	 *   Jika pelanggan masih punya transaksi aktif,
	 *   penghapusan akan GAGAL (error dari database).
	 *   Ini adalah fitur keamanan, bukan bug.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteCustomer(supabase, id) {
		const { error } = await supabase.from('customers').delete().eq('id', id);

		if (error) {
			console.error('Error deleting customer in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil data dasar pelanggan (nama & cabang) berdasarkan ID.
	 * Dipakai saat ingin mencatat activity log setelah menghapus pelanggan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getCustomerDetails(supabase, id) {
		const { data, error } = await supabase
			.from('customers')
			.select('full_name, branch_id')
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error getting customer details:', error);
			// Catatan: return null (bukan throw) — data ini hanya untuk log, bukan kritis
			return null;
		}
		return data;
	},

	/**
	 * Hitung total jumlah pelanggan, bisa difilter per cabang atau semua cabang.
	 *
	 * KONSEP COUNT:
	 *   { count: 'exact', head: true } → hitung semua baris TANPA mengambil datanya.
	 *   Ini jauh lebih efisien daripada .select('*') lalu .length
	 *   Seperti SELECT COUNT(*) di SQL.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getCustomersCount(supabase, branchId = null) {
		let query = supabase.from('customers').select('*', { count: 'exact', head: true });

		// Jika branchId ada → filter per cabang; jika null → hitung semua cabang (untuk owner)
		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { count, error } = await query;
		if (error) {
			console.error('Error fetching customers count:', error);
			throw new Error(error.message);
		}
		return count || 0;
	}
};
