/**
 * ============================================================
 * FILE: routes/(app)/inventory/+page.server.js
 * TUJUAN: Logika server untuk memuat Daftar Inventaris Alat & Barang.
 *
 * MENGAPA KODE INI DITULIS?
 *   Menyajikan katalog seluruh alat outdoor dan barang pendukung yang dikelola oleh toko/cabang.
 *   Data ini dibutuhkan oleh halaman daftar inventaris utama.
 * ============================================================
 */

import { inventoryController } from '$lib/server/controllers/inventoryController.js';
import { itemController } from '$lib/server/controllers/itemController.js';
import { fail } from '@sveltejs/kit';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum daftar inventaris dirender.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Jika session/profil tidak ditemukan, kembalikan objek default kosong
	// Catatan: Layout parent (app/+layout.server.js) sebenarnya sudah memproteksi route ini,
	// namun pengecekan ini adalah bentuk pertahanan berlapis (defense in depth).
	if (!session || !profile) {
		return { items: [], categories: [] };
	}

	// Panggil controller untuk mengambil list barang inventaris dan kategorinya secara paralel
	return inventoryController.getInventoryData(supabase, profile);
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani penonaktifan dan reaktivasi barang inventaris.
 */
export const actions = {
	/**
	 * Aksi 'deactivate': Menonaktifkan barang berdasarkan ID (is_active = false)
	 */
	deactivate: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Gudang dan Owner boleh menonaktifkan barang
		if (profile.role !== 'owner' && profile.role !== 'gudang') {
			return fail(403, { error: 'Akses ditolak. Anda tidak memiliki izin untuk menonaktifkan barang.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		if (!id) {
			return fail(400, { error: 'ID barang tidak valid.' });
		}

		const result = await itemController.deactivateItem(supabase, profile, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	/**
	 * Aksi 'activate': Mengaktifkan kembali barang berdasarkan ID (is_active = true)
	 */
	activate: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Gudang dan Owner boleh mengaktifkan barang
		if (profile.role !== 'owner' && profile.role !== 'gudang') {
			return fail(403, { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengaktifkan barang.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		if (!id) {
			return fail(400, { error: 'ID barang tidak valid.' });
		}

		const result = await itemController.activateItem(supabase, profile, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};


