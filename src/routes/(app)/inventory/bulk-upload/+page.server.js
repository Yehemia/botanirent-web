/**
 * ============================================================
 * FILE: routes/(app)/inventory/bulk-upload/+page.server.js
 * TUJUAN: Logika server untuk Unggah Massal Data Inventaris (Bulk Upload).
 *
 * MENGAPA KODE INI DITULIS?
 *   Ketika toko pertama kali menggunakan aplikasi atau menerima stok baru dalam jumlah besar,
 *   memasukkan data satu per satu di UI sangat melelahkan.
 *   Halaman ini memfasilitasi import file (misalnya CSV/Excel) untuk dimasukkan langsung ke database.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { itemController } from '$lib/server/controllers/itemController.js';
import { categoryModel } from '$lib/server/models/categoryModel.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman bulk upload dimuat.
 * Menyediakan daftar kategori aktif untuk kebutuhan petunjuk format file yang diunggah.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session } = await locals.safeGetSession();

	// Guard untuk login
	if (!session) {
		throw redirect(303, '/login');
	}

	// Ambil semua data kategori dari database
	const categories = await categoryModel.getCategories(supabase);

	return {
		categories
	};
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menerima file upload dan mendelegasikannya ke controller.
 */
export const actions = {
	/**
	 * Default Action: dipanggil saat form disubmit via POST
	 */
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		// Guard untuk otorisasi
		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Ambil objek form data
		const formData = await request.formData();
		// Ambil file biner yang diunggah dari form field bernama 'file'
		const file = formData.get('file');

		// Panggil controller untuk melakukan parsing file dan menyimpan datanya secara massal
		const result = await itemController.bulkUpload(supabase, profile, file);

		// Jika terjadi kegagalan parser atau query database
		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		// Kembalikan tanda sukses beserta jumlah baris data yang berhasil dimasukkan
		return { success: true, count: result.count };
	}
};

