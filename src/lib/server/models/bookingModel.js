export const bookingModel = {
	/**
	 * Ambil semua booking aktif (tidak cancelled) untuk satu cabang.
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
			.neq('status', 'cancelled');

		if (error) {
			console.error('Error fetching bookings in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Buat booking baru.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} bookingData
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
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async getBookingDetails(supabase, id) {
		const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();

		if (error) {
			console.error('Error fetching booking details in model:', error);
			return null;
		}
		return data;
	},

	/**
	 * Hapus satu booking berdasarkan ID.
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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} transactionItemId
	 * @param {string} status
	 */
	async updateBookingStatusByTransactionItem(supabase, transactionItemId, status) {
		const { error } = await supabase
			.from('bookings')
			.update({ status })
			.eq('transaction_item_id', transactionItemId);

		if (error) {
			console.error('Error updating booking status in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Update status satu booking berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {string} status
	 */
	async updateBookingStatus(supabase, id, status) {
		const { error } = await supabase
			.from('bookings')
			.update({ status })
			.eq('id', id);

		if (error) {
			console.error('Error updating booking status in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
