import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/auth/login');
	}

	// Ambil daftar pelanggan yang sudah ada
	const { data: customers } = await supabase
		.from('customers')
		.select('id, full_name, phone')
		.eq('branch_id', profile.branch_id)
		.order('full_name');

	return {
		customers: customers || []
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const payloadRaw = formData.get('payload');
		
		if (!payloadRaw) return fail(400, { error: 'Data checkout kosong.' });
		
		let payload;
		try {
			payload = JSON.parse(payloadRaw.toString());
		} catch (e) {
			return fail(400, { error: 'Format data transaksi tidak valid.' });
		}
		
		// Injeksi data server-side
		payload.branch_id = profile.branch_id;
		payload.cashier_id = profile.id;
		
		// Generate Transaction Code (e.g., TRX-1A2B-123456)
		const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
		const timeStr = Date.now().toString().slice(-6);
		payload.transaction_code = `TRX-${randomStr}-${timeStr}`;
		
		// Handle Customer (Jika pelanggan baru, insert dulu)
		if (payload.customer_name && !payload.customer_id) {
			const { data: newCust, error: custErr } = await supabase
				.from('customers')
				.insert({
					branch_id: profile.branch_id,
					full_name: payload.customer_name,
					phone: payload.customer_phone
				})
				.select('id')
				.single();
			
			if (!custErr && newCust) {
				payload.customer_id = newCust.id;
			}
		}

		// Validasi jumlah pembayaran
		if (payload.paid_amount < payload.total_amount) {
			return fail(400, { error: 'Nominal pembayaran tidak mencukupi.' });
		}

		// Panggil Fungsi RPC yang sudah dibuat di database
		const { data, error } = await supabase.rpc('checkout_transaction', { payload });

		if (error) {
			console.error("RPC Checkout Error:", error);
			// Biasanya error dari RAISE EXCEPTION Postgres akan terbaca di error.message
			return fail(500, { error: `Gagal Checkout: ${error.message}` });
		}

		// Log activity fire-and-forget
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: profile.branch_id,
			action: 'transaction_completed',
			entity_type: 'transaction',
			entity_id: data.transaction_id,
			metadata: { code: payload.transaction_code, amount: payload.total_amount }
		}).then();

		// Redirect ke halaman sukses/detail struk
		throw redirect(303, `/transactions/${data.transaction_id}?success=true`);
	}
};
