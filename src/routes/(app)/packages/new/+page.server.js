/**
 * ============================================================
 * FILE: routes/(app)/packages/new/+page.server.js
 * TUJUAN: Logika server untuk Pembuatan Paket Bundling Baru (Create Package).
 *
 * MENGAPA KODE INI DITULIS?
 *   Menyediakan form pembuatan paket bundling dan menangani penyimpanan
 *   definisi paket baru beserta relasi item-item yang termasuk di dalamnya.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { packageController } from '$lib/server/controllers/packageController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman pembuatan paket baru dirender.
 * Mengambil daftar item inventaris (alat outdoor) aktif agar admin bisa memilih item mana saja yang dimasukkan ke dalam paket.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard untuk login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil data item pendukung untuk dipilih di form
	const data = await packageController.getNewPackageData(supabase, profile);
	return data;
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani pembuatan paket baru.
 */
export const actions = {
	/**
	 * Default Action: dipanggil saat form disubmit via POST
	 */
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		// Guard keamanan server
		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		
		// Proses pembuatan paket baru
		const result = await packageController.createPackage(supabase, profile, formData);

		// Jika proses simpan gagal
		if (!result.success) {
			// Periksa apakah controller menyarankan redirect paksa
			if (result.redirect) {
				throw redirect(303, result.redirect);
			}
			// Jika gagal validasi, kembalikan status fail agar form tidak ter-reset
			return fail(result.status || 500, { error: result.error, ...result.values });
		}

		// Jika sukses dan controller meminta redirect ke list paket
		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		return { success: true };
	}
};

