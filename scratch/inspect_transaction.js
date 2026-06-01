import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting Latest Transaction ---');
    const { data: txs, error: err1 } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
        
    if (err1 || txs.length === 0) {
        console.error('Error fetching transactions or none found:', err1);
        return;
    }
    
    const tx = txs[0];
    console.log(`Latest Transaction: ID: ${tx.id}, Code: ${tx.transaction_code}, Type: ${tx.type}, Total: ${tx.total_amount}`);
    
    // Fetch transaction items
    const { data: items, error: err2 } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', tx.id);
        
    if (err2) {
        console.error('Error fetching transaction items:', err2);
        return;
    }
    
    console.log(`Transaction Items count: ${items.length}`);
    for (const item of items) {
        console.log(`- Item: ${item.item_name}, Type: ${item.type}, Qty: ${item.quantity}, Subtotal: ${item.subtotal}, Rental Status: ${item.rental_status}, Rental End: ${item.rental_end_date}`);
    }
}

inspect();
