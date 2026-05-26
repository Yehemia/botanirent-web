import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const payload = await request.json();
        
        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            fraud_status,
            transaction_id
        } = payload;

        if (!order_id || !status_code || !gross_amount || !signature_key) {
            return json({ error: 'Payload tidak lengkap' }, { status: 400 });
        }

        // Komputasi hash SHA-512 secara lokal untuk memverifikasi keaslian data
        const concatenatedString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;
        const locallyComputedHash = crypto
            .createHash('sha512')
            .update(concatenatedString)
            .digest('hex');

        // Proteksi spoofing: Bandingkan signature key
        if (locallyComputedHash !== signature_key) {
            console.error(`[Midtrans Webhook] Signature Mismatch untuk Order: ${order_id}`);
            return json({ error: 'Signature mismatch' }, { status: 403 });
        }

        // Gunakan Service Role Key karena ini adalah webhook background (tidak ada session kasir)
        const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);

        console.log(`[Midtrans Webhook] Menerima update untuk order ${order_id}. Status: ${transaction_status}`);

        // Pemetaan status Midtrans ke Supabase transactions
        if (['capture', 'settlement'].includes(transaction_status)) {
            // Jika ada fraud_status, pastikan bernilai 'accept'
            if (!fraud_status || fraud_status === 'accept') {
                const { error } = await supabaseAdmin
                    .from('transactions')
                    .update({ 
                        payment_status: 'paid', 
                        paid_at: new Date().toISOString(),
                        midtrans_transaction_id: transaction_id
                    })
                    .eq('transaction_code', order_id);

                if (error) throw error;
                console.log(`[Midtrans Webhook] Transaksi ${order_id} LUNAS.`);
            }
        } 
        // Jika gagal / expired / dibatalkan
        else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
            const { error } = await supabaseAdmin
                .from('transactions')
                .update({ payment_status: 'failed' })
                .eq('transaction_code', order_id);

            if (error) throw error;
            console.log(`[Midtrans Webhook] Transaksi ${order_id} GAGAL/EXPIRED.`);
        }

        return json({ status: 'OK' });
    } catch (e) {
        console.error("[Midtrans Webhook] Webhook Processing Error:", e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

