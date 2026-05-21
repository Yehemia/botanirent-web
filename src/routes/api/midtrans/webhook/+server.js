import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const payload = await request.json();
        
        if (!payload.order_id || !payload.transaction_status) {
            return json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Gunakan Service Role Key karena ini adalah webhook background (tidak ada session kasir)
        const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY);

        console.log(`[Midtrans Webhook] Menerima update untuk order ${payload.order_id}. Status: ${payload.transaction_status}`);

        // Jika status settlement atau capture, berarti LUNAS
        if (['capture', 'settlement'].includes(payload.transaction_status)) {
            const { error } = await supabaseAdmin
                .from('transactions')
                .update({ 
                    payment_status: 'paid', 
                    paid_at: new Date().toISOString(),
                    midtrans_transaction_id: payload.transaction_id
                })
                .eq('transaction_code', payload.order_id);

            if (error) throw error;
        } 
        // Jika gagal / expired
        else if (['expire', 'cancel', 'deny'].includes(payload.transaction_status)) {
            await supabaseAdmin
                .from('transactions')
                .update({ payment_status: 'failed' })
                .eq('transaction_code', payload.order_id);
        }

        return json({ status: 'OK' });
    } catch (e) {
        console.error("Webhook Processing Error:", e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
