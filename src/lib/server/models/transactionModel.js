export const transactionModel = {
	/**
	 * Ambil semua transaksi dengan status "paid".
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getPaidTransactions(supabase, branchId = null) {
		let query = supabase
			.from('transactions')
			.select('id, branch_id, type, total_amount, created_at')
			.eq('payment_status', 'paid');

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
	 * Ambil semua item dari semua transaksi.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getTransactionItems(supabase, branchId = null) {
		const query = branchId
			? supabase
					.from('transaction_items')
					.select('transaction_id, item_name, type, quantity, subtotal, transaction:transactions!inner(branch_id)')
					.eq('transactions.branch_id', branchId)
			: supabase
					.from('transaction_items')
					.select('transaction_id, item_name, type, quantity, subtotal');

		const { data, error } = await query;

		if (error) {
			console.error('Fetch tx items error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil transaksi TERBARU dengan JOIN ke pelanggan dan kasir.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {number} limit
	 */
	async getRecentTransactions(supabase, branchId = null, limit = 5) {
		let query = supabase
			.from('transactions')
			.select('*, customer:customers(full_name), cashier:profiles(full_name)')
			.order('created_at', { ascending: false })
			.limit(limit);

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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {string} fromDateIso
	 */
	async getTransactionsForRevenue(supabase, branchId, fromDateIso) {
		let query = supabase
			.from('transactions')
			.select('created_at, total_amount, payment_status')
			.gte('created_at', fromDateIso);

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
	 * Ambil data denda yang sudah dibayar mulai dari tanggal tertentu.
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
			.gte('created_at', startOfTodayIso);

		if (error) {
			console.error('Fetch today paid transactions error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Hitung jumlah item sewa yang masih aktif (belum dikembalikan) di suatu cabang.
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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 * @param {string} todayStr
	 */
	async getTodaysPickups(supabase, branchId, todayStr) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
			.eq('rental_status', 'active')
			.eq('rental_start_date', todayStr)
			.eq('transactions.branch_id', branchId);

		if (error) {
			console.error('Fetch today pickups error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil item sewa yang JATUH TEMPO PENGEMBALIAN hari ini atau sudah lewat.
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
			.lte('rental_end_date', todayStr)
			.eq('transactions.branch_id', branchId);

		if (error) {
			console.error('Fetch today returns due error:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Jalankan checkout transaksi melalui DATABASE FUNCTION.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} payload
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
	 * Update data transaksi.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionId
	 * @param {object} updateData
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
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 * @param {string} search
	 * @param {number} page
	 * @param {number} limit
	 * @param {{ branchId?: string, type?: string, status?: string }} filters
	 * @returns {Promise<{ data: any[], count: number }>}
	 */
	async getTransactions(supabase, branchId = null, search = '', page = 1, limit = 10, filters = {}) {
		let query = supabase
			.from('transactions')
			.select('*, customer:customers(full_name), cashier:profiles(full_name), branch:branches(name)', { count: 'exact' })
			.order('created_at', { ascending: false });

		if (branchId) {
			query = query.eq('branch_id', branchId);
		} else if (filters.branchId) {
			query = query.eq('branch_id', filters.branchId);
		}

		if (filters.type) {
			query = query.eq('type', filters.type);
		}

		if (filters.status) {
			query = query.eq('payment_status', filters.status);
		}

		if (search) {
			query = query.or(`transaction_code.ilike.%${search}%,customers.full_name.ilike.%${search}%`);
		}

		const offset = (page - 1) * limit;
		query = query.range(offset, offset + limit - 1);

		const { data, count, error } = await query;
		if (error) {
			console.error('Error fetching transactions list in model:', error);
			throw new Error(error.message);
		}
		return {
			data: data || [],
			count: count || 0
		};
	},

	/**
	 * Ambil detail lengkap satu transaksi berdasarkan ID.
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
		return data;
	},

	/**
	 * Ambil semua item dalam satu transaksi, beserta data denda tiap item.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionId
	 */
	async getTransactionItemsList(supabase, transactionId) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('*, penalties(*)')
			.eq('transaction_id', transactionId)
			.order('id', { ascending: true });

		if (error) {
			console.error('Error fetching transaction items in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Ambil semua item sewa yang MASIH AKTIF (belum dikembalikan) untuk halaman Returns.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getActiveRentalsForReturns(supabase, branchId = null) {
		let query = supabase
			.from('transaction_items')
			.select(
				'*, transaction:transactions!inner(transaction_code, type, created_at, branch_id, customer:customers(full_name, phone)), item:items(name, sell_price)'
			)
			.eq('rental_status', 'active')
			.order('rental_end_date', { ascending: true });

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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
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
	 * Ambil harga jual dari item yang terkait dengan transaction_item.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getTransactionItemSellPrice(supabase, id) {
		const { data, error } = await supabase
			.from('transaction_items')
			.select('items(sell_price)')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			console.error('Error fetching transaction item sell price:', error);
			return 0;
		}
		const itemsVal = /** @type {any} */ (data?.items);
		return itemsVal?.sell_price || (Array.isArray(itemsVal) ? itemsVal[0]?.sell_price : 0) || 0;
	}
};
