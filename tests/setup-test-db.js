import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error(
		'Error: PUBLIC_SUPABASE_URL or PRIVATE_SUPABASE_SERVICE_ROLE_KEY missing in environment'
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

const TEST_USERS = [
	{
		email: 'test_owner@botanirent.com',
		password: 'PasswordTest123!',
		role: 'owner',
		fullName: 'Test Owner',
		branchId: '11111111-1111-1111-1111-111111111111' // Bogor Branch
	},
	{
		email: 'test_kasir@botanirent.com',
		password: 'PasswordTest123!',
		role: 'kasir',
		fullName: 'Test Kasir',
		branchId: '11111111-1111-1111-1111-111111111111' // Bogor Branch
	},
	{
		email: 'test_gudang@botanirent.com',
		password: 'PasswordTest123!',
		role: 'gudang',
		fullName: 'Test Gudang',
		branchId: '11111111-1111-1111-1111-111111111111' // Bogor Branch
	}
];

async function setupTestUsers() {
	console.log('=== SEEDING TEST USERS FOR E2E TESTING ===');

	// 1. Get all existing users
	const {
		data: { users },
		error: listError
	} = await supabase.auth.admin.listUsers();
	if (listError) {
		console.error('Error listing users:', listError);
		process.exit(1);
	}

	for (const testUser of TEST_USERS) {
		const existingUser = users.find((u) => u.email === testUser.email);
		let userId;

		if (existingUser) {
			console.log(`User ${testUser.email} already exists. Updating password...`);
			userId = existingUser.id;
			const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
				password: testUser.password
			});
			if (updateError) {
				console.error(`Error updating password for ${testUser.email}:`, updateError);
			}
		} else {
			console.log(`User ${testUser.email} does not exist. Creating...`);
			const { data, error: createError } = await supabase.auth.admin.createUser({
				email: testUser.email,
				password: testUser.password,
				email_confirm: true,
				user_metadata: { full_name: testUser.fullName }
			});

			if (createError) {
				console.error(`Error creating user ${testUser.email}:`, createError);
				continue;
			}
			userId = data.user.id;
		}

		// Update or ensure profiles table has the correct role and branch_id
		console.log(`Ensuring profile roles for ${testUser.email} (ID: ${userId})...`);

		// First, check if the profile exists
		const { data: profile, error: fetchProfileErr } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();

		if (fetchProfileErr && fetchProfileErr.code !== 'PGRST116') {
			// PGRST116 means no row found
			console.error(`Error checking profile for ${testUser.email}:`, fetchProfileErr);
			continue;
		}

		if (!profile) {
			console.log(`Inserting profile for ${testUser.email}...`);
			const { error: insertErr } = await supabase.from('profiles').insert({
				id: userId,
				full_name: testUser.fullName,
				role: testUser.role,
				branch_id: testUser.branchId,
				is_active: true
			});
			if (insertErr) {
				console.error(`Error inserting profile for ${testUser.email}:`, insertErr);
			}
		} else {
			console.log(`Updating profile for ${testUser.email}...`);
			const { error: updateErr } = await supabase
				.from('profiles')
				.update({
					full_name: testUser.fullName,
					role: testUser.role,
					branch_id: testUser.branchId,
					is_active: true
				})
				.eq('id', userId);
			if (updateErr) {
				console.error(`Error updating profile for ${testUser.email}:`, updateErr);
			}
		}
	}

	console.log('=== SEEDING TEST USERS COMPLETED ===');
}

setupTestUsers().catch((err) => {
	console.error('Unhandled setup error:', err);
	process.exit(1);
});
