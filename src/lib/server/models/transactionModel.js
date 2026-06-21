/**
 * ============================================================
 * FILE: transactionModel.js
 * TUJUAN: Lapisan AKSES DATA untuk tabel "transactions", "transaction_items",
 *         dan "penalties" — semua yang berkaitan dengan data transaksi.
 *
 * INI FILE MODEL TERBESAR karena transaksi adalah INTI BISNIS BotaniRent.
 * Hampir semua fitur (POS, Returns, Dashboard, Statistics) butuh file ini.
 *
 * TABEL UTAMA:
 *   transactions       → Header transaksi (kode, pelanggan, total, status bayar)
 *   transaction_items  → Detail per item dalam transaksi (barang, qty, harga)
 *   penalties          → Denda keterlambatan atau kerusakan per item
 *
 * KONSEP RPC (Remote Procedure Call):
 *   Beberapa operasi kompleks (seperti checkout) tidak bisa dilakukan dengan
 *   query sederhana. Kita panggil FUNCTION di database (PostgreSQL) yang
 *   mengeksekusi banyak operasi sekaligus dalam satu transaksi database.
 *   Ini memastikan ATOMICITY: semua berhasil atau semua gagal.
 * ============================================================
 */

export const transactionModel = {
	/**
	 * Ambil semua transaksi dengan status "paid" (lunas).
	 * Dipakai untuk statistik keseluruhan pendapatan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId - null = semua cabang (untuk owner)
	 */
	async getPaidTransactions(supabase, branchId = null) {
		let query = supabase
			.from('transactions')
			.select('id, branch_id, type, total_amount, created_at')
			.eq('payment_status', 'paid'); // Hanya yang sudah lunas

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch transactions error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua denda (penalties) yang sudah dibayar.
	 * Pendapatan dari denda dihitung TERPISAH dari pendapatan sewa.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getPaidPenalties(supabase, branchId = null) {
		let query = supabase
			.from('penalties')
			.select('id, branch_id, type, calculated_amount, created_at')
			.eq('payment_status', 'paid');

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch penalties error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua item dari semua transaksi (tanpa filter).
	 * Dipakai untuk menghitung statistik per jenis barang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 */
	async getTransactionItems(supabase) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('transaction_id, item_name, type, quantity, subtotal');

		if (error) {
			console.error('Fetch tx items error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil transaksi TERBARU dengan JOIN ke pelanggan dan kasir.
	 * Dipakai untuk widget "Transaksi Terkini" di dashboard.
	 *
	 * KONSEP JOIN SUPABASE:
	 *   customer:customers(full_name) → ambil full_name dari tabel customers,
	 *                                   simpan dengan nama alias "customer"
	 *   cashier:profiles(full_name)  → ambil full_name dari tabel profiles,
	 *                                   simpan dengan nama alias "cashier"
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {number} limit - Berapa baris yang diambil (default 5)
	 */
	async getRecentTransactions(supabase, branchId = null, limit = 5) {
		let query = supabase
			.from('transactions')
			.select('*, customer:customers(full_name), cashier:profiles(full_name)')
			.order('created_at', { ascending: false }) // Terbaru di atas
			.limit(limit); // Batasi jumlah baris

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch recent transactions error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil data transaksi mulai dari tanggal tertentu untuk kalkulasi pendapatan.
	 * Kita ambil mulai dari tanggal paling awal yang dibutuhkan (awal bulan ATAU 7 hari lalu).
	 *
	 * .gte('created_at', fromDateIso) → "greater than or equal" = tanggal >= from
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {string} fromDateIso - Tanggal awal dalam format ISO (misal: "2025-06-01T00:00:00.000Z")
	 */
	async getTransactionsForRevenue(supabase, branchId, fromDateIso) {
		let query = supabase
			.from('transactions')
			.select('created_at, total_amount, payment_status')
			.gte('created_at', fromDateIso); // Filter dari tanggal ini

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch transactions for revenue error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil data denda yang sudah dibayar mulai dari tanggal tertentu,
	 * untuk menghitung kontribusi denda ke total pendapatan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {string} fromDateIso
	 */
	async getPaidPenaltiesForRevenue(supabase, branchId, fromDateIso) {
		let query = supabase
			.from('penalties')
			.select('created_at, calculated_amount, payment_status')
			.eq('payment_status', 'paid')
			.gte('created_at', fromDateIso);

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Fetch paid penalties for revenue error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil transaksi yang DIBAYAR HARI INI untuk satu cabang.
	 * Dipakai kasir untuk melihat total pendapatan hari ini.
	 *
	 * startOfTodayIso = waktu 00:00:00 hari ini (awal hari)
	 * → mengambil semua transaksi dari jam 00:00 sampai sekarang
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 * @param {string} startOfTodayIso
	 */
	async getTodayPaidTransactions(supabase, branchId, startOfTodayIso) {
		const { data, error } = await supabase
			.from('transactions')
			.select('total_amount')
			.eq('branch_id', branchId)
			.eq('payment_status', 'paid')
			.gte('created_at', startOfTodayIso); // Dari awal hari ini

		if (error) {
			console.error('Fetch today paid transactions error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Hitung jumlah item sewa yang masih aktif (belum dikembalikan) di suatu cabang.
	 *
	 * KONSEP INNER JOIN:
	 *   transactions!inner(branch_id) → !inner berarti HANYA ambil data yang
	 *   transaction_items-nya PASTI punya transaksi yang cocok (seperti INNER JOIN di SQL)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActiveRentalsCount(supabase, branchId) {
		const { count, error } = await supabase
			.from('transaction_items')
			.select('id, transaction:transactions!inner(branch_id)', { count: 'exact', head: true })
			.eq('rental_status', 'active')
			.eq('transactions.branch_id', branchId);

		if (error) {
			console.error('Fetch active rentals count error:', error);
			throw new Error(error.message);
		}
		return count || 0;
	},

	/**
	 * Ambil item sewa yang MULAI HARI INI (penjemputan/pengiriman).
	 * Dipakai kasir untuk tahu barang mana yang harus disiapkan hari ini.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 * @param {string} todayStr - Format "YYYY-MM-DD", contoh "2025-06-21"
	 */
	async getTodaysPickups(supabase, branchId, todayStr) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
			.eq('rental_status', 'active')
			.eq('rental_start_date', todayStr) // Tanggal mulai sewa = hari ini
			.eq('transactions.branch_id', branchId);

		if (error) {
			console.error('Fetch today pickups error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil item sewa yang JATUH TEMPO PENGEMBALIAN hari ini atau sudah lewat.
	 * Dipakai kasir untuk reminder "barang yang harus sudah kembali".
	 *
	 * .lte('rental_end_date', todayStr) → "less than or equal" = tanggal_kembali <= hari_ini
	 * Artinya: barang yang harusnya sudah kembali hari ini atau sebelumnya
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 * @param {string} todayStr
	 */
	async getTodaysReturnsDue(supabase, branchId, todayStr) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
			.eq('rental_status', 'active')
			.lte('rental_end_date', todayStr) // Tanggal kembali sudah tiba atau lewat
			.eq('transactions.branch_id', branchId);

		if (error) {
			console.error('Fetch today returns due error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Jalankan checkout transaksi melalui DATABASE FUNCTION (RPC).
	 *
	 * KONSEP RPC (Remote Procedure Call):
	 *   supabase.rpc('checkout_transaction', { payload })
	 *   → Memanggil PostgreSQL function bernama "checkout_transaction"
	 *   → Function ini berjalan di DATABASE (bukan di Node.js server)
	 *   → Bisa melakukan banyak operasi INSERT/UPDATE sekaligus
	 *     dalam satu TRANSACTION DATABASE (semua berhasil atau semua dibatalkan)
	 *
	 * MENGAPA pakai RPC, bukan query biasa?
	 *   Checkout melibatkan banyak tabel:
	 *   - Insert ke tabel transactions
	 *   - Insert ke tabel transaction_items (banyak baris)
	 *   - Update stok di tabel rental_assets
	 *   - Insert ke tabel bookings
	 *   Jika salah satu gagal, semua harus dibatalkan (atomic operation).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} payload - Data checkout lengkap (items, customer, payment, dll)
	 */
	async checkoutTransaction(supabase, payload) {
		const { data, error } = await supabase.rpc('checkout_transaction', { payload });
		if (error) {
			console.error('RPC Checkout Error:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Update data transaksi (misalnya menambahkan midtrans_transaction_id setelah QRIS dibuat).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionId
	 * @param {object} updateData - Kolom-kolom yang akan diupdate
	 */
	async updateTransaction(supabase, transactionId, updateData) {
		const { error } = await supabase
			.from('transactions')
			.update(updateData)
			.eq('id', transactionId);

		if (error) {
			console.error('Error updating transaction in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil daftar transaksi dengan fitur SEARCH dan PAGINATION.
	 *
	 * KONSEP PAGINATION:
	 *   Daripada mengambil 10.000 transaksi sekaligus (berat!),
	 *   kita ambil sedikit demi sedikit sesuai halaman yang diminta.
	 *   Contoh: halaman 1 → ambil baris 0-9
	 *            halaman 2 → ambil baris 10-19
	 *   .range(offset, offset + limit - 1) → ambil baris dari index offset sampai offset+limit-1
	 *
	 * KONSEP ilike (search case-insensitive):
	 *   .ilike('kolom', '%teks%') → cari teks di kolom (% = wildcard, seperti LIKE di SQL)
	 *   case-insensitive = tidak bedakan huruf besar/kecil
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {string} search - Kata kunci pencarian kode transaksi
	 * @param {number} page - Nomor halaman (mulai dari 1)
	 * @param {number} limit - Jumlah data per halaman
	 * @returns {Promise<{ data: any[], count: number }>}
	 */
	async getTransactions(supabase, branchId = null, search = '', page = 1, limit = 10) {
		let query = supabase
			.from('transactions')
			// { count: 'exact' } → hitung total baris (untuk info "halaman X dari Y")
			.select('*, customer:customers(full_name), cashier:profiles(full_name)', { count: 'exact' })
			.order('created_at', { ascending: false });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		if (search) {
			// Cari transaksi berdasarkan kode (contoh: "TRX-AB12-123456")
			query = query.ilike('transaction_code', `%${search}%`);
		}

		// Hitung offset dari nomor halaman
		const offset = (page - 1) * limit;
		query = query.range(offset, offset + limit - 1);

		const { data, count, error } = await query;
		if (error) {
			console.error('Error fetching transactions list in model:', error);
			throw new Error(error.message);
		}
		return {
			data: data || [],
			count: count || 0 // Total semua baris (bukan hanya halaman ini)
		};
	},

	/**
	 * Ambil detail lengkap satu transaksi berdasarkan ID.
	 *
	 * .maybeSingle() → ambil 0 atau 1 baris. Tidak error jika data tidak ditemukan.
	 *                  Berbeda dengan .single() yang error jika tidak ditemukan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string|null} branchId
	 */
	async getTransactionDetail(supabase, id, branchId = null) {
		let query = supabase
			.from('transactions')
			.select('*, customer:customers(*), cashier:profiles(full_name)')
			.eq('id', id);

		if (branchId) {
			query = query.eq('branch_id', branchId);
		}

		const { data, error } = await query.maybeSingle();
		if (error) {
			console.error('Error fetching transaction detail in model:', error);
			throw new Error(error.message);
		}
		return data; // Bisa null jika tidak ditemukan
	},

	/**
	 * Ambil semua item dalam satu transaksi, beserta data denda tiap item.
	 * Dipakai untuk halaman detail transaksi dan struk.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionId
	 */
	async getTransactionItemsList(supabase, transactionId) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('*, penalties(*)')
			.eq('transaction_id', transactionId)
			.order('id', { ascending: true }); // Urutkan berdasarkan urutan tambah

		if (error) {
			console.error('Error fetching transaction items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua item sewa yang MASIH AKTIF (belum dikembalikan) untuk halaman Returns.
	 * Data ini dipakai kasir untuk memilih barang yang dikembalikan oleh pelanggan.
	 *
	 * QUERY KOMPLEKS:
	 *   'transaction:transactions!inner(...)' → !inner = HANYA ambil item yang transaksinya ada
	 *   'item:items(sell_price)' → ambil harga jual dari tabel items untuk perhitungan denda kerusakan
	 *
	 * .order('rental_end_date', { ascending: true }) → urut dari yang paling segera jatuh tempo
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getActiveRentalsForReturns(supabase, branchId = null) {
		let query = supabase
			.from('transaction_items')
			.select(
				'*, transaction:transactions!inner(transaction_code, type, created_at, branch_id, customer:customers(full_name, phone)), item:items(sell_price)'
			)
			.eq('rental_status', 'active')
			.order('rental_end_date', { ascending: true }); // Yang paling lewat jatuh tempo tampil pertama

		if (branchId) {
			query = query.eq('transactions.branch_id', branchId);
		}

		const { data, error } = await query;
		if (error) {
			console.error('Error fetching active rentals for returns in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Update status dan kondisi satu item transaksi saat dikembalikan.
	 * Contoh: rental_status → 'returned', return_condition → 'rusak', returned_at → timestamp
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id - ID transaction_item
	 * @param {object} updateData
	 */
	async updateTransactionItem(supabase, id, updateData) {
		const { error } = await supabase.from('transaction_items').update(updateData).eq('id', id);

		if (error) {
			console.error('Error updating transaction item in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil harga jual (sell_price) dari item yang terkait dengan transaction_item.
	 * Dipakai untuk menghitung denda kerusakan (persentase dari harga jual).
	 *
	 * NOTE: Hasil join bisa berupa object atau array tergantung konfigurasi Supabase,
	 *       sehingga ada penanganan khusus di baris terakhir.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id - ID transaction_item
	 */
	async getTransactionItemSellPrice(supabase, id) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('items(sell_price)')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Error fetching transaction item sell price:', error);
			return 0; // Jika gagal, kembalikan 0 (tidak crash)
		}
		// Normalisasi: items bisa berupa object atau array → ambil sell_price-nya
		const itemsVal = /** @type {any} */ (data?.items);
		return itemsVal?.sell_price || (Array.isArray(itemsVal) ? itemsVal[0]?.sell_price : 0) || 0;
	}
};
