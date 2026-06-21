/**
 * ============================================================
 * FILE: routes/(app)/branches/+page.server.js
 * TUJUAN: Logika server untuk pengelolaan data Cabang Toko (Branch Management).
 *
 * MENGAPA KODE INI DITULIS?
 *   Aplikasi Botanirent mendukung sistem multi-cabang.
 *   Karena ini adalah pengaturan tingkat sistem/bisnis yang sangat sensitif,
 *   halaman ini diproteksi ketat agar HANYA OWNER yang bisa mengakses (CRUD cabang).
 * ============================================================
 */

import { error, fail } from '@sveltejs/kit';
import { branchController } from '$lib/server/controllers/branchController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server sebelum halaman cabang dirender.
 * Memeriksa role user dan mengambil daftar seluruh cabang.
 */
export const load = async ({ locals: { supabase, safeGetSession } }) => {
	// Ambil profil user saat ini
	const { profile } = await safeGetSession();

	// Guard: Hanya owner yang boleh melihat daftar cabang ini
	// Jika bukan owner, panggil helper error() dari SvelteKit untuk merender halaman +error.svelte
	if (profile?.role !== 'owner') {
		throw error(403, 'Akses ditolak. Hanya Owner yang dapat mengakses halaman ini.');
	}

	try {
		// Ambil data cabang dari database via controller
		return await branchController.getBranches(supabase);
	} catch (err) {
		console.error('Error fetching branches in load:', err);
		throw error(500, 'Gagal memuat data cabang');
	}
};

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani penambahan, pembaruan, dan penghapusan cabang.
 */
export const actions = {
	/**
	 * Aksi 'save': Menyimpan data cabang baru atau memperbarui yang sudah ada (UPSERT)
	 */
	save: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		// Proteksi aksi di tingkat server (tidak mempercayai input client)
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		// Baca data form yang dikirim
		const formData = await request.formData();
		// Jika ada 'id', berarti ini proses UPDATE. Jika kosong/null, berarti INSERT baru.
		const id = formData.get('id')?.toString() || null;

		// Delegasikan ke controller untuk menyimpan
		const result = await branchController.saveBranch(supabase, id, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	/**
	 * Aksi 'delete': Menonaktifkan cabang berdasarkan ID (Soft Deactivation)
	 */
	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		// Proteksi aksi di tingkat server
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;
		const notes = formData.get('deactivation_notes')?.toString() || null;

		// Delegasikan ke controller untuk proses penonaktifan
		const result = await branchController.deactivateBranch(supabase, id, notes);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	/**
	 * Aksi 'activate': Mengaktifkan kembali cabang berdasarkan ID
	 */
	activate: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { profile } = await safeGetSession();

		// Proteksi aksi di tingkat server
		if (profile?.role !== 'owner') {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() || null;

		// Delegasikan ke controller untuk proses pengaktifan kembali
		const result = await branchController.activateBranch(supabase, id);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};

