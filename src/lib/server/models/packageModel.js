export const packageModel = {
	/**
	 * Ambil semua paket dengan jumlah item di dalamnya.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string|null} branchId
	 */
	async getPackages(supabase, branchId = null) {
		let query = supabase
			.from('packages')
			.select('*, package_items(count)')
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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} branchId
	 */
	async getActivePackages(supabase, branchId) {
		const { data, error } = await supabase
			.from('packages')
			.select('*')
			.eq('branch_id', branchId)
			.eq('is_active', true)
			.order('name');

		if (error) {
			console.error('Error fetching active packages in model:', error);
			throw new Error(error.message);
		}
		return data || [];
	},

	/**
	 * Tambah paket baru.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {object} packageData
	 */
	async insertPackage(supabase, packageData) {
		const { data, error } = await supabase.from('packages').insert(packageData).select().single();

		if (error) {
			console.error('Error inserting package in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Tambah detail item-item ke dalam sebuah paket (bulk insert).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {Array<object>} packageItemsData
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
	 * Hapus paket.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 */
	async deletePackage(supabase, id) {
		const { error } = await supabase.from('packages').delete().eq('id', id);

		if (error) {
			console.error('Error deleting package in model:', error);
			throw new Error(error.message);
		}
		return true;
	},

	/**
	 * Ambil satu paket berdasarkan ID.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id - ID paket
	 */
	async getPackageById(supabase, id) {
		const { data, error } = await supabase
			.from('packages')
			.select('*')
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching package by ID in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Ambil semua item yang ada di dalam sebuah paket.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} packageId
	 */
	async getPackageItems(supabase, packageId) {
		const { data, error } = await supabase
			.from('package_items')
			.select(`
				id,
				package_id,
				item_id,
				quantity,
				sort_order,
				items (
					id,
					name,
					rental_price_per_day
				)
			`)
			.eq('package_id', packageId)
			.order('sort_order', { ascending: true });

		if (error) {
			console.error('Error fetching package items in model:', error);
			throw new Error(error.message);
		}
		
		return (data || []).map(pi => {
			const item = Array.isArray(pi.items) ? pi.items[0] : pi.items;
			return {
				id: item?.id,
				name: item?.name,
				rental_price_per_day: item?.rental_price_per_day,
				quantity: pi.quantity
			};
		});
	},

	/**
	 * Perbarui data header paket.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} id
	 * @param {object} packageData
	 */
	async updatePackage(supabase, id, packageData) {
		const { data, error } = await supabase
			.from('packages')
			.update(packageData)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating package in model:', error);
			throw new Error(error.message);
		}
		return data;
	},

	/**
	 * Hapus detail item dari suatu paket.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {string} packageId
	 */
	async deletePackageItems(supabase, packageId) {
		const { error } = await supabase
			.from('package_items')
			.delete()
			.eq('package_id', packageId);

		if (error) {
			console.error('Error deleting package items in model:', error);
			throw new Error(error.message);
		}
		return true;
	}
};
