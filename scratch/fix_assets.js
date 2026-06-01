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

async function fix() {
    const itemId = '62482b07-957c-4899-a7d5-44f1233c6b87';
    console.log('Inserting physical units for Tracking Pole Arei 130cm...');
    
    const assets = [
        { item_id: itemId, asset_code: 'TPL-001', status: 'ready' },
        { item_id: itemId, asset_code: 'TPL-002', status: 'ready' },
        { item_id: itemId, asset_code: 'TPL-003', status: 'ready' },
        { item_id: itemId, asset_code: 'TPL-004', status: 'ready' }
    ];
    
    const { data, error } = await supabase
        .from('rental_assets')
        .insert(assets)
        .select();
        
    if (error) {
        console.error('Error inserting assets:', error);
    } else {
        console.log('Successfully inserted assets:', data);
    }
}

fix();
