import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

    // Hanya owner/admin yang bisa akses (asumsi role admin)
	if (profile.role !== 'admin' && profile.role !== 'owner') {
		// Optional: lempar ke dashboard jika kasir
        // throw redirect(303, '/dashboard');
	}

	// Fetch rental settings
	const { data: settingsData } = await supabase
		.from('settings')
		.select('*')
		.eq('key', 'rental')
		.single();
	
	const rentalSettings = settingsData?.value || { default_rental_duration_days: 4, late_fee_per_day_per_transaction: 10000 };

	return {
		rentalSettings
	};
}

export const actions = {
	updateRental: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const duration = parseInt(formData.get('default_rental_duration_days')?.toString() || '4', 10);
		const lateFee = parseFloat(formData.get('late_fee_per_day_per_transaction')?.toString() || '0');

		const value = {
			default_rental_duration_days: duration,
			late_fee_per_day_per_transaction: lateFee
		};

		const { error } = await supabase
			.from('settings')
			.upsert({
				key: 'rental',
				value: value,
				updated_at: new Date().toISOString()
			}, { onConflict: 'key' });

		if (error) {
			console.error('Error updating settings:', error);
			return fail(500, { error: 'Gagal menyimpan pengaturan penyewaan.' });
		}

		return { success: true };
	}
};
