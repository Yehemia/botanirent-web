/**
 * ============================================================
 * FILE: routes/(app)/inventory/new/+page.server.js
 * TUJUAN: Logika server untuk Halaman Tambah Item Inventaris Baru (Create Item).
 *
 * MENGAPA KODE INI DITULIS?
 *   Menyediakan endpoint server-side untuk merender form input item alat baru
 *   dan memproses penyimpanan datanya saat disubmit oleh user.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { itemController } from '$lib/server/controllers/itemController.js';
import { categoryModel } from '$lib/server/models/categoryModel.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman tambah item baru dirender.
 * Mengambil daftar kategori untuk ditampilkan pada input dropdown di form.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session } = await locals.safeGetSession();

	// Guard untuk status login
	if (!session) {
		throw redirect(303, '/login');
	}

	// Ambil semua daftar kategori aktif
	const categories = await categoryModel.getCategories(supabase);

	return {
		categories
	};
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani aksi submit form pembuatan item baru.
 */
export const actions = {
	/**
	 * Default Action: dipanggil saat form disubmit via POST
	 */
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		// Proteksi tingkat server
		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Ambil data form input user
		const formData = await request.formData();
		
		// Proses pembuatan item di database via controller
		const result = await itemController.createItem(supabase, profile, formData);

		// Jika controller menyarankan redirect (misal: redirect ke list inventaris setelah sukses)
		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		// Jika gagal karena kesalahan validasi/input
		if (!result.success) {
			// Kembalikan status fail beserta nilai input form (result.values) agar form tidak ter-reset kosong di frontend
			return fail(result.status || 500, { error: result.error, values: result.values });
		}

		return { success: true };
	}
};

