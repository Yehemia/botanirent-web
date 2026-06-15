export const customerModel = {
	/**
	 * Fetch customers for a branch, with nested transactions, items, and penalties
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
			.eq('branch_id', branchId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching customers:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Fetch basic customer list (id, full_name, phone) for dropdowns
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getCustomersMinimal(supabase, branchId) {
		const { data, error } = await supabase
			.from('customers')
			.select('id, full_name, phone')
			.eq('branch_id', branchId)
			.order('full_name');

		if (error) {
			console.error('Error fetching customers minimal:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Create a new customer
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
	 * Update an existing customer
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
	 * Delete a customer by ID
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
	 * Get basic customer details (e.g. for logging)
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
			return null;
		}
		return data;
	},

	/**
	 * Get count of customers, optionally filtered by branch
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getCustomersCount(supabase, branchId = null) {
		let query = supabase.from('customers').select('*', { count: 'exact', head: true });

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
