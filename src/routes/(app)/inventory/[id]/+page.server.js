/**
 * ============================================================
 * FILE: routes/(app)/inventory/[id]/+page.server.js
 * TUJUAN: Logika server untuk Halaman Detail & Edit Item Inventaris (Dynamic Route).
 *
 * MENGAPA KODE INI DITULIS?
 *   1. Dynamic Route [id]: Memungkinkan satu layout file menangani ribuan ID alat/barang
 *      secara dinamis (contoh: /inventory/10, /inventory/25).
 *   2. Proteksi Peran: Hanya 'owner' dan staf 'gudang' yang boleh memodifikasi master data inventaris.
 *   3. Form Action Default: SvelteKit mengeksekusi action 'default' jika form disubmit
 *      tanpa menyebutkan nama action spesifik.
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { itemController } from '$lib/server/controllers/itemController.js';

/**
 * LOAD FUNCTION
 * Mengambil data detail item dan daftar kategori untuk kebutuhan dropdown edit.
 *
 * Parameter:
 *   - params: Berisi parameter URL dinamis (params.id diambil dari nama folder [id]).
 */
export async function load({ params, locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard untuk autentikasi
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Guard Hak Akses: Hanya Owner dan Staff Gudang yang berhak melihat/mengedit detail item
	if (profile.role !== 'owner' && profile.role !== 'gudang') {
		throw redirect(303, '/inventory');
	}

	// Ambil data detail item melalui controller
	const result = await itemController.getItemDetails(supabase, profile, params.id);

	// Jika item tidak ditemukan atau ada error, controller menyarankan redirect ke halaman lain
	if (result.redirect) {
		throw redirect(303, result.redirect);
	}

	return {
		item: result.item,
		categories: result.categories
	};
}

/**
 * SVELTEKIT DEFAULT ACTION
 * Menangani submit form untuk memperbarui data item inventaris.
 */
export const actions = {
	/**
	 * Default Action: dipanggil secara default saat form melakukan POST ke URL detail ini
	 */
	default: async ({ params, request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		
		// Proses update data item
		const result = await itemController.updateItem(supabase, profile, params.id, formData);

		if (result.redirect) {
			throw redirect(303, result.redirect);
		}

		// Jika proses simpan gagal (misal: validasi input gagal)
		if (!result.success) {
			// Kembalikan error beserta data input sebelumnya (values) agar form tidak ter-reset kosong
			return fail(result.status || 500, { error: result.error, values: result.values });
		}

		return { success: true };
	}
};

