/**
 * ============================================================
 * FILE: routes/(app)/settings/+page.server.js
 * TUJUAN: Logika server untuk Pengaturan Aplikasi Toko (Global App Settings).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk mengelola konfigurasi operasional toko (seperti tarif sewa dasar,
 *   ketentuan durasi sewa, biaya jasa pengiriman, dll).
 *   Pengaturan ini dimuat di server dan diperbarui langsung melalui Form Actions.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { settingsController } from '$lib/server/controllers/settingsController.js';

/**
 * LOAD FUNCTION
 * Mengambil data pengaturan operasional rental yang saat ini tersimpan di database.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Guard role: hanya owner yang diizinkan mengakses pengaturan sistem
	if (profile.role !== 'owner') {
		throw redirect(303, '/dashboard');
	}

	// Delegasikan ke controller untuk mengambil dataset pengaturan
	return settingsController.getRentalSettings(supabase);
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani pembaruan pengaturan toko.
 */
export const actions = {
	/**
	 * Aksi 'updateRental': Memperbarui data pengaturan rental
	 */
	updateRental: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		// Guard role: hanya owner yang diizinkan memperbarui pengaturan
		if (profile.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak. Hanya owner yang diizinkan.' });
		}

		const formData = await request.formData();
		
		// Proses update settings
		const result = await settingsController.updateRentalSettings(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};

