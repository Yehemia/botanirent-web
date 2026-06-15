import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Error: keys missing in environment');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_CASHIER_IDS = [
	'e4adbecb-57e8-4c55-9cf0-6d33bd50c813', // test_kasir
	'3945ae75-d5d3-4453-b4b4-eec44e0b988f', // test_owner
	'a3456484-1a38-4d5f-87ed-456fc1222799' // test_gudang
];

async function cleanup() {
	console.log('=== CLEANING UP TEST DATA ===');

	// 1. Get transaction IDs created by test cashiers
	const { data: testTransactions, error: txError } = await supabase
		.from('transactions')
		.select('id')
		.in('cashier_id', TEST_CASHIER_IDS);

	if (txError) {
		console.error('Error fetching test transactions:', txError);
	} else if (testTransactions && testTransactions.length > 0) {
		const txIds = testTransactions.map((t) => t.id);
		console.log(`Found ${txIds.length} test transactions. Deleting transaction items...`);

		// Delete transaction items
		const { error: itemsDelError } = await supabase
			.from('transaction_items')
			.delete()
			.in('transaction_id', txIds);
		if (itemsDelError) console.error('Error deleting transaction items:', itemsDelError);

		// Delete activity logs
		console.log('Deleting test activity logs...');
		const { error: logsDelError } = await supabase
			.from('activity_logs')
			.delete()
			.in('user_id', TEST_CASHIER_IDS);
		if (logsDelError) console.error('Error deleting activity logs:', logsDelError);

		// Delete transactions
		console.log('Deleting transactions...');
		const { error: txsDelError } = await supabase.from('transactions').delete().in('id', txIds);
		if (txsDelError) console.error('Error deleting transactions:', txsDelError);
	} else {
		console.log('No test transactions found to clean up.');
	}

	// 2. Delete test customers (full_name starts with 'Test Customer' or phone '089999999999')
	console.log('Deleting test customers...');
	const { error: custDelError } = await supabase
		.from('customers')
		.delete()
		.or('full_name.ilike.Test Customer%,phone.eq.089999999999');
	if (custDelError) console.error('Error deleting test customers:', custDelError);

	// 3. Reset rental assets status to 'ready' for the test product (Tenda Dome)
	console.log('Resetting Tenda Dome assets status to ready...');
	const { error: assetResetError } = await supabase
		.from('rental_assets')
		.update({ status: 'ready' })
		.eq('item_id', '33333333-3333-3333-3333-333333333333');
	if (assetResetError) console.error('Error resetting assets status:', assetResetError);

	console.log('=== CLEANUP COMPLETED ===');
}

cleanup().catch((err) => {
	console.error('Unhandled cleanup error:', err);
	process.exit(1);
});
