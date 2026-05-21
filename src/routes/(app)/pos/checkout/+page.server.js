import { fail, redirect } from '@sveltejs/kit';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';

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

		// Jika QRIS, status awal adalah pending
		if (payload.payment_method === 'qris') {
			payload.payment_status = 'pending';
			payload.paid_amount = 0; // Belum dibayar
			payload.change_amount = 0;
		} else {
			// Validasi pembayaran tunai
			if (payload.paid_amount < payload.total_amount) {
				return fail(400, { error: 'Nominal pembayaran tunai tidak mencukupi.' });
			}
			payload.payment_status = 'paid';
		}

		// Panggil Fungsi RPC yang sudah dibuat di database
		const { data, error } = await supabase.rpc('checkout_transaction', { payload });

		if (error) {
			console.error("RPC Checkout Error:", error);
			return fail(500, { error: `Gagal Checkout: ${error.message}` });
		}

		// Log activity
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: profile.branch_id,
			action: 'transaction_completed',
			entity_type: 'transaction',
			entity_id: data.transaction_id,
			metadata: { code: payload.transaction_code, amount: payload.total_amount }
		}).then();

		// JIKA QRIS -> Request ke Midtrans API
		if (payload.payment_method === 'qris') {
			try {
				const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);
				const isProdKey = !MIDTRANS_SERVER_KEY.startsWith('SB-');
				const apiUrl = isProdKey 
					? 'https://app.midtrans.com/snap/v1/transactions' 
					: 'https://app.sandbox.midtrans.com/snap/v1/transactions';
				
				const midtransPayload = {
					transaction_details: {
						order_id: payload.transaction_code,
						gross_amount: Math.round(payload.total_amount)
					},
					customer_details: {
						first_name: payload.customer_name || 'Pelanggan',
						phone: payload.customer_phone || '-'
					}
				};

				const response = await fetch(apiUrl, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Basic ${authString}`
					},
					body: JSON.stringify(midtransPayload)
				});

				const midtransData = await response.json();
				if (response.ok && midtransData.redirect_url) {
					// Redirect user ke halaman pembayaran Midtrans
					throw redirect(303, midtransData.redirect_url);
				} else {
					console.error("Midtrans API Error:", midtransData);
				}
			} catch (e) {
				if (e.status === 303) throw e; // Pass SvelteKit redirect error
				console.error("Midtrans Request Error:", e);
				// Biarkan tetap lanjut ke struk, biar kasir tau kalau error Midtrans tapi data masuk
			}
		}

		// Redirect ke halaman struk
		throw redirect(303, `/transactions/${data.transaction_id}?success=true`);
	}
};
