import { json } from '@sveltejs/kit';

export async function GET({ params, locals }) {
    const { session } = await locals.safeGetSession();
    
    // Proteksi route
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
        return json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    try {
        const { data: transaction, error } = await locals.supabase
            .from('transactions')
            .select('payment_status')
            .eq('id', id)
            .single();

        if (error || !transaction) {
            console.error('[Transaction Status API] Error or not found:', error);
            return json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
        }

        return json({ payment_status: transaction.payment_status });
    } catch (e) {
        console.error('[Transaction Status API] Server error:', e);
        return json({ error: 'Server error saat memriksa status transaksi' }, { status: 500 });
    }
}
