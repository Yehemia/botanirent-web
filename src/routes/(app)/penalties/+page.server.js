import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	const { data: penaltyRules, error } = await supabase
		.from('penalty_rules')
		.select('*')
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Fetch penalty rules error:', error);
	}

	return {
		penaltyRules: penaltyRules || []
	};
}

export const actions = {
	updateRule: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile || profile.role !== 'owner') {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id');
		const amount = formData.get('amount');

		if (!id || amount === null) {
			return fail(400, { error: 'ID dan Jumlah denda wajib diisi.' });
		}

		const parsedAmount = parseFloat(amount.toString());
		if (isNaN(parsedAmount) || parsedAmount < 0) {
			return fail(400, { error: 'Jumlah denda harus berupa angka positif.' });
		}

		const { error: updateError } = await supabase
			.from('penalty_rules')
			.update({ amount: parsedAmount })
			.eq('id', id);

		if (updateError) {
			console.error('Update penalty rule error:', updateError);
			return fail(500, { error: 'Gagal memperbarui aturan denda.' });
		}

		// Log activity
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: profile.branch_id,
			action: 'penalty_rule_updated',
			entity_type: 'penalty_rule',
			entity_id: id,
			metadata: { updated_amount: parsedAmount }
		}).then();

		return { success: true };
	}
};
