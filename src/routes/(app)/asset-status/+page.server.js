/**
 * ============================================================
 * FILE: routes/(app)/asset-status/+page.server.js
 * TUJUAN: Logika server untuk pengelolaan status fisik unit alat outdoor (Asset).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk memantau kondisi fisik alat outdoor atau item sewaan (misal: "Ready", "Rented", "Broken", "Maintenance").
 *   File ini mendemonstrasikan kombinasi antara:
 *     1. Load Function (mengambil data aset)
 *     2. Form Actions (memperbarui status aset langsung dari UI form)
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { assetStatusController } from '$lib/server/controllers/assetStatusController.js';

/**
 * LOAD FUNCTION
 * Mengambil daftar aset untuk ditampilkan di halaman status aset.
 */
export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Autentikasi guard
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Ambil data aset menggunakan controller
	return assetStatusController.getAssets(supabase, profile);
}

/**
 * SVELTEKIT FORM ACTIONS
 * Endpoint server-side bawaan SvelteKit yang dipanggil langsung ketika form HTML disubmit (POST).
 * Mencegah kebutuhan menulis fetch API manual di frontend.
 */
export const actions = {
	/**
	 * Aksi 'updateStatus' dipanggil menggunakan <form method="POST" action="?/updateStatus">
	 */
	updateStatus: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		// Jika user belum login, kembalikan status fail 401
		// fail() adalah helper SvelteKit agar data error bisa diakses langsung di prop `form` di frontend
		if (!session || !profile) return fail(401, { error: 'Unauthorized' });

		// Ambil data form (formData) yang dikirim oleh browser
		const formData = await request.formData();
		
		// Proses pembaruan status aset melalui controller
		const result = await assetStatusController.updateStatus(supabase, profile, formData);

		// Jika controller mendeteksi error / kegagalan
		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		// Jika sukses, kembalikan objek penanda sukses ke komponen Svelte
		return { success: true };
	}
};

