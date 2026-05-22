import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const isOwner = profile.role === 'owner';
	
	// Determine which branch to display
	let selectedBranchId = url.searchParams.get('branch_id') || profile.branch_id;
	
	// If owner and no branch is explicitly selected, default to the first branch
	let branches = [];
	if (isOwner) {
		const { data: activeBranches, error: branchError } = await supabase
			.from('branches')
			.select('*')
			.eq('is_active', true)
			.order('name');
			
		if (!branchError) {
			branches = activeBranches || [];
			if (!selectedBranchId && branches.length > 0) {
				selectedBranchId = branches[0].id;
			}
		}
	} else {
		selectedBranchId = profile.branch_id;
	}

	if (!selectedBranchId) {
		return {
			branches: [],
			categories: [],
			items: [],
			assets: [],
			bookings: [],
			selectedBranchId: null,
			role: profile.role
		};
	}

	// 1. Fetch categories with type = 'sewa'
	const { data: categories, error: catError } = await supabase
		.from('categories')
		.select('*')
		.eq('type', 'sewa')
		.order('sort_order');

	if (catError) {
		console.error("Error fetching categories:", catError);
	}

	// 2. Fetch all rental items for the selected branch
	// Note: We join categories to filter items of type 'sewa'
	const { data: items, error: itemError } = await supabase
		.from('items')
		.select('*, category:categories!inner(name, type)')
		.eq('branch_id', selectedBranchId)
		.eq('categories.type', 'sewa')
		.eq('is_active', true)
		.order('name');

	if (itemError) {
		console.error("Error fetching items:", itemError);
	}

	// 3. Fetch all physical rental assets for these items
	const { data: assets, error: assetError } = await supabase
		.from('rental_assets')
		.select('*, item:items!inner(branch_id, name)')
		.eq('items.branch_id', selectedBranchId)
		.order('asset_code');

	if (assetError) {
		console.error("Error fetching assets:", assetError);
	}

	// 4. Fetch all bookings for this branch
	const { data: bookings, error: bookingError } = await supabase
		.from('bookings')
		.select(`
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
		`)
		.eq('branch_id', selectedBranchId)
		.neq('status', 'cancelled'); // Don't show cancelled bookings

	if (bookingError) {
		console.error("Error fetching bookings:", bookingError);
	}

	return {
		branches,
		categories: categories || [],
		items: items || [],
		assets: assets || [],
		bookings: bookings || [],
		selectedBranchId,
		role: profile.role
	};
}

export const actions = {
	createMaintenance: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const rental_asset_id = formData.get('rental_asset_id')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;
		const start_date = formData.get('start_date')?.toString();
		const end_date = formData.get('end_date')?.toString();
		const notes = formData.get('notes')?.toString() || 'Maintenance';
		const status = formData.get('status')?.toString() || 'maintenance'; // 'maintenance' or 'washing'

		if (!rental_asset_id || !start_date || !end_date) {
			return fail(400, { error: 'Data tidak lengkap. Harap isi tanggal mulai, tanggal selesai, dan pilih unit.' });
		}

		if (new Date(start_date) > new Date(end_date)) {
			return fail(400, { error: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.' });
		}

		// Insert maintenance block into bookings table (with transaction_item_id = null)
		const { data: booking, error: bookingError } = await supabase
			.from('bookings')
			.insert({
				rental_asset_id,
				branch_id,
				start_date,
				end_date,
				status: 'active', // 'active' booking status
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (bookingError) {
			console.error("Error creating maintenance booking:", bookingError);
			return fail(500, { error: 'Gagal membuat pemblokiran di database.' });
		}

		// Write to audit activity log
		await supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id,
			action: 'create_maintenance',
			entity_type: 'booking',
			entity_id: booking.id,
			metadata: { rental_asset_id, start_date, end_date, notes }
		});

		// Check if today is inside the block range to update asset's current operational status
		const todayStr = new Date().toISOString().split('T')[0];
		if (start_date <= todayStr && todayStr <= end_date) {
			const { error: assetUpdateError } = await supabase
				.from('rental_assets')
				.update({ 
					status, 
					notes,
					last_status_change: new Date().toISOString() 
				})
				.eq('id', rental_asset_id);
				
			if (assetUpdateError) {
				console.error("Error updating asset status during maintenance block:", assetUpdateError);
			}
		}

		return { success: true };
	},

	deleteBooking: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const rental_asset_id = formData.get('rental_asset_id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID booking tidak ditemukan.' });
		}

		// Fetch the booking first to see if it is a maintenance booking (transaction_item_id is null)
		const { data: booking } = await supabase
			.from('bookings')
			.select('*')
			.eq('id', id)
			.single();

		if (!booking) {
			return fail(404, { error: 'Booking tidak ditemukan.' });
		}

		const isMaintenance = !booking.transaction_item_id;

		// Delete the booking
		const { error: deleteError } = await supabase
			.from('bookings')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error("Error deleting booking:", deleteError);
			return fail(500, { error: 'Gagal menghapus booking.' });
		}

		// Write to audit activity log
		await supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: booking.branch_id,
			action: 'delete_booking',
			entity_type: 'booking',
			entity_id: id,
			metadata: { isMaintenance, rental_asset_id: booking.rental_asset_id }
		});

		// If it's a maintenance booking and currently active today, set the asset status back to 'ready'
		const todayStr = new Date().toISOString().split('T')[0];
		if (isMaintenance && booking.start_date <= todayStr && todayStr <= booking.end_date) {
			const { error: assetUpdateError } = await supabase
				.from('rental_assets')
				.update({ 
					status: 'ready', 
					notes: 'Maintenance selesai',
					last_status_change: new Date().toISOString() 
				})
				.eq('id', booking.rental_asset_id);
				
			if (assetUpdateError) {
				console.error("Error releasing asset from maintenance status:", assetUpdateError);
			}
		}

		return { success: true };
	}
};
