/**
 * ============================================================
 * FILE: bookingModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "bookings".
 *
 * APA ITU bookings?
 *   "Bookings" adalah RESERVASI WAKTU untuk setiap unit asset fisik.
 *   Setiap kali barang disewa, sistem membuat "booking" untuk
 *   memblokir asset tersebut agar tidak bisa disewa orang lain
 *   di periode yang sama.
 *
 * ADA 2 JENIS BOOKING:
 *   1. Booking Sewa (transaction_item_id ada) → terhubung ke transaksi pelanggan
 *   2. Booking Maintenance (transaction_item_id = NULL) → untuk maintenance internal
 *
 * CONTOH KASUS NYATA:
 *   "Tenda TDA-001" di-booking dari 21-25 Juni oleh Budi
 *   → Sistem buat booking: asset=TDA-001, start=21 Juni, end=25 Juni
 *   → Jika ada yang ingin sewa TDA-001 di tanggal 22 Juni, sistem tahu barang tidak tersedia
 * ============================================================
 */

export const bookingModel = {
	/**
	 * Ambil semua booking aktif (tidak cancelled) untuk satu cabang.
	 * Dipakai halaman Booking untuk menampilkan kalender ketersediaan barang.
	 *
	 * NESTED SELECT:
	 *   rental_asset → ambil data unit fisik (asset_code) dan nama itemnya
	 *   transaction_item → ambil data item transaksi dan datanya (kode transaksi, nama pelanggan)
	 *
	 * .neq('status', 'cancelled') → "not equal" = ambil semua kecuali yang sudah dibatalkan
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getBranchBookings(supabase, branchId) {
		const { data, error } = await supabase
			.from('bookings')
			.select(
				`
				*,
				rental_asset:rental_assets!inner(
					id,
					asset_code,
					item:items!inner(id, name)
				),
				transaction_item:transaction_items(
					id,
					transaction:transactions(
						id,
						transaction_code,
						customer:customers(id, full_name)
					)
				)
			`
			)
			.eq('branch_id', branchId)
			.neq('status', 'cancelled'); // Kecualikan yang sudah dibatalkan

		if (error) {
			console.error('Error fetching bookings in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Buat booking baru (saat asset mulai di-maintenance atau saat ada transaksi sewa baru).
	 *
	 * Spread operator {...bookingData} → salin semua property dari bookingData
	 * lalu tambahkan created_at (waktu buat booking).
	 *
	 * .single() → pastikan hasilnya 1 baris (untuk mendapat ID booking yang baru dibuat)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} bookingData - Data booking: asset_id, start_date, end_date, branch_id, dll
	 */
	async createBooking(supabase, bookingData) {
		const { data, error } = await supabase
			.from('bookings')
			.insert({
				...bookingData,
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating booking in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Ambil detail satu booking berdasarkan ID.
	 *
	 * .single() → ambil tepat 1 baris, error jika tidak ditemukan atau lebih dari 1
	 *
	 * NOTE: Berbeda dari getCustomerDetails, di sini return null jika gagal (bukan throw)
	 *       karena ini hanya untuk keperluan display, tidak kritis untuk operasi lain.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getBookingDetails(supabase, id) {
		const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();

		if (error) {
			console.error('Error fetching booking details in model:', error);
			return null; // Return null, jangan throw error
		}
		return data;
	},

	/**
	 * Hapus (delete permanen) satu booking berdasarkan ID.
	 * Dipanggil ketika maintenance selesai atau booking dibatalkan secara manual.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deleteBooking(supabase, id) {
		const { error } = await supabase.from('bookings').delete().eq('id', id);

		if (error) {
			console.error('Error deleting booking in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Update status booking berdasarkan transaction_item_id.
	 * Dipanggil saat barang dikembalikan (status → 'completed' atau 'cancelled').
	 *
	 * MENGAPA pakai transaction_item_id, bukan booking id?
	 *   Karena saat proses return, kita tahu transaction_item_id-nya,
	 *   tidak perlu mencari booking id terlebih dahulu.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionItemId
	 * @param {string} status - Status baru: 'completed' | 'cancelled'
	 */
	async updateBookingStatusByTransactionItem(supabase, transactionItemId, status) {
		const { error } = await supabase
			.from('bookings')
			.update({ status })
			.eq('transaction_item_id', transactionItemId); // Filter berdasarkan transaction item

		if (error) {
			console.error('Error updating booking status in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
