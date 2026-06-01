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
    const packageId = 'fcc7bdf6-a9dc-4cb8-adf8-8c26fd8574b8';
    
    console.log('--- Inspecting Package Items ---');
    const { data: pkgItems, error: err1 } = await supabase
        .from('package_items')
        .select('*, item:items(*)')
        .eq('package_id', packageId);
        
    if (err1) {
        console.error('Error fetching package items:', err1);
        return;
    }
    
    console.log(`Package has ${pkgItems.length} items:`);
    for (const pi of pkgItems) {
        console.log(`- Item Name: ${pi.item.name}, Item ID: ${pi.item.id}, Qty in Package: ${pi.quantity}`);
        
        // Fetch rental assets for this item
        const { data: assets, error: err2 } = await supabase
            .from('rental_assets')
            .select('*')
            .eq('item_id', pi.item.id);
            
        if (err2) {
            console.error(`Error fetching assets for item ${pi.item.id}:`, err2);
            continue;
        }
        
        console.log(`  Physical units (${assets.length}):`);
        for (const asset of assets) {
            console.log(`    * Code: ${asset.asset_code}, Status: ${asset.status}, ID: ${asset.id}`);
        }
    }
}

inspect();
