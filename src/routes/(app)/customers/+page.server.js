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
			customers: [],
			branches: [],
			selectedBranchId: null,
			role: profile.role
		};
	}

	// Fetch customers with transactions and nested transaction items + penalties for dynamic status & metrics calculations
	const { data: customers, error: customerError } = await supabase
		.from('customers')
		.select(`
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
		`)
		.eq('branch_id', selectedBranchId)
		.order('created_at', { ascending: false });

	if (customerError) {
		console.error("Error fetching customers:", customerError);
	}

	return {
		customers: customers || [],
		branches,
		selectedBranchId,
		role: profile.role
	};
}

export const actions = {
	createCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const ktp_number = formData.get('ktp_number')?.toString() || '';
		const guarantee_type = formData.get('guarantee_type')?.toString() || '';
		const deposit_amount = parseFloat(formData.get('deposit_amount')?.toString() || '0');
		const notes = formData.get('notes')?.toString() || '';
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!full_name) {
			return fail(400, { error: 'Nama Lengkap wajib diisi.' });
		}

		// Serialize extra fields into the notes text field
		const notesObj = {
			ktp_number,
			guarantee_type,
			deposit_amount,
			notes
		};
		const notesJson = JSON.stringify(notesObj);

		const { data: customer, error: insertError } = await supabase
			.from('customers')
			.insert({
				branch_id,
				full_name,
				phone,
				email,
				address,
				notes: notesJson
			})
			.select()
			.single();

		if (insertError) {
			console.error("Error creating customer:", insertError);
			return fail(500, { error: 'Gagal membuat data penyewa.' });
		}

		// Log activity
		await supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id,
			action: 'create_customer',
			entity_type: 'customer',
			entity_id: customer.id,
			metadata: { full_name, phone }
		});

		return { success: true };
	},

	updateCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const ktp_number = formData.get('ktp_number')?.toString() || '';
		const guarantee_type = formData.get('guarantee_type')?.toString() || '';
		const deposit_amount = parseFloat(formData.get('deposit_amount')?.toString() || '0');
		const notes = formData.get('notes')?.toString() || '';
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!id || !full_name) {
			return fail(400, { error: 'Data tidak lengkap.' });
		}

		const notesObj = {
			ktp_number,
			guarantee_type,
			deposit_amount,
			notes
		};
		const notesJson = JSON.stringify(notesObj);

		const { error: updateError } = await supabase
			.from('customers')
			.update({
				full_name,
				phone,
				email,
				address,
				notes: notesJson
			})
			.eq('id', id);

		if (updateError) {
			console.error("Error updating customer:", updateError);
			return fail(500, { error: 'Gagal mengubah data penyewa.' });
		}

		// Log activity
		await supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id,
			action: 'update_customer',
			entity_type: 'customer',
			entity_id: id,
			metadata: { full_name, phone }
		});

		return { success: true };
	},

	deleteCustomer: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID tidak ditemukan.' });
		}

		// Fetch for logging before deletion
		const { data: customer } = await supabase
			.from('customers')
			.select('full_name, branch_id')
			.eq('id', id)
			.single();

		const { error: deleteError } = await supabase
			.from('customers')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error("Error deleting customer:", deleteError);
			return fail(500, { error: 'Gagal menghapus data penyewa. Pastikan pelanggan tidak memiliki riwayat transaksi aktif.' });
		}

		if (customer) {
			// Log activity
			await supabase.from('activity_logs').insert({
				user_id: profile.id,
				branch_id: customer.branch_id,
				action: 'delete_customer',
				entity_type: 'customer',
				entity_id: id,
				metadata: { full_name: customer.full_name }
			});
		}

		return { success: true };
	}
};
