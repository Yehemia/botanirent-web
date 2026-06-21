/**
 * ============================================================
 * FILE: routes/(app)/penalties/+page.server.js
 * TUJUAN: Logika server untuk Aturan & Konfigurasi Denda (Penalty Rules).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk mengatur tarif denda jika penyewa terlambat mengembalikan alat
 *   atau merusak properti. Halaman ini memuat aturan yang berlaku dan
 *   mengizinkan admin memperbarui tarif tersebut.
 * ============================================================
 */

import { redirect, fail } from '@sveltejs/kit';
import { penaltiesController } from '$lib/server/controllers/penaltiesController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman konfigurasi denda dirender.
 * Mengambil list peraturan denda (misal: denda harian telat sewa, denda alat rusak/hilang).
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil aturan denda dari controller
	const result = await penaltiesController.getPenaltyRules(supabase, profile);

	// Jika controller menginstruksikan redirect
	if (result.redirect) {
		throw redirect(303, result.redirect);
	}

	return {
		penaltyRules: result.penaltyRules || []
	};
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani aksi update aturan denda.
 */
export const actions = {
	/**
	 * Aksi 'updateRule': Memperbarui besaran tarif denda
	 */
	updateRule: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		
		// Proses update aturan denda
		const result = await penaltiesController.updatePenaltyRule(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error, values: result.values });
		}

		return { success: true };
	}
};

