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

