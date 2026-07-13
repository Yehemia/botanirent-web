import { json } from '@sveltejs/kit';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { PUBLIC_MIDTRANS_ENV } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const payload = await request.json();

		if (!payload.transaction_code || !payload.total_amount) {
			return json({ error: 'Data transaksi tidak lengkap' }, { status: 400 });
		}

		const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);
		const isProduction = PUBLIC_MIDTRANS_ENV === 'production';
		const apiUrl = isProduction
			? 'https://app.midtrans.com/snap/v1/transactions'
			: 'https://app.sandbox.midtrans.com/snap/v1/transactions';

		console.log(`Menggunakan Midtrans API: ${apiUrl}`);

		const midtransPayload = {
			transaction_details: {
				order_id: payload.transaction_code,
				gross_amount: Math.round(payload.total_amount)
			},
			customer_details: {
				first_name: payload.customer_name || 'Pelanggan',
				phone: payload.customer_phone || '-'
			},
			callbacks: {
				finish: `${request.headers.get('origin')}/transactions?status=success`,
				error: `${request.headers.get('origin')}/transactions?status=error`
			}
		};

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Basic ${authString}`
			},
			body: JSON.stringify(midtransPayload)
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Midtrans Error:', data);
			return json(
				{ error: data.error_messages?.[0] || 'Gagal request token Midtrans' },
				{ status: 400 }
			);
		}

		return json({ token: data.token, redirect_url: data.redirect_url });
	} catch (e) {
		console.error('Midtrans Token Gen Error:', e);
		return json({ error: 'Server error saat menghubungi Midtrans' }, { status: 500 });
	}
}
