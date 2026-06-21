/**
 * ============================================================
 * FILE: routes/(app)/booking/+page.server.js
 * TUJUAN: Logika server untuk halaman Penjadwalan & Reservasi Alat Outdoor (Booking & Maintenance).
 *
 * MENGAPA KODE INI DITULIS?
 *   Untuk mengelola dua jenis jadwal pemesanan aset:
 *     1. Penyewaan aktif oleh customer (Booking sewa)
 *     2. Penarikan alat rusak untuk perawatan (Booking maintenance)
 *   File ini menyediakan data jadwal dan aksi CRUD (create maintenance & delete booking).
 * ============================================================
 */

import { fail, redirect } from '@sveltejs/kit';
import { bookingController } from '$lib/server/controllers/bookingController.js';

/**
 * LOAD FUNCTION
 * Dijalankan di server untuk memuat seluruh jadwal booking dan maintenance.
 * Membaca filter cabang (`branch_id`) dari URL jika ada.
 */
export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Autentikasi guard
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Membaca branch_id dari query params (?branch_id=xxx)
	// Berguna agar owner dapat memfilter jadwal berdasarkan cabang yang dipilih
	const selectedBranchId = url.searchParams.get('branch_id');
	
	// Delegasikan pengambilan data booking ke controller
	return bookingController.getBookingPageData(supabase, profile, selectedBranchId);
}

/**
 * SVELTEKIT FORM ACTIONS
 * Menangani form submit untuk:
 *   1. createMaintenance - Membuat jadwal perawatan alat rusak
 *   2. deleteBooking - Menghapus booking / membatalkan reservasi
 */
export const actions = {
	/**
	 * Aksi 'createMaintenance' dipanggil ketika alat rusak dikirim ke maintenance
	 */
	createMaintenance: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		
		// Proses booking jenis maintenance
		const result = await bookingController.createMaintenance(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	},

	/**
	 * Aksi 'deleteBooking' dipanggil untuk menghapus atau membatalkan reservasi
	 */
	deleteBooking: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		
		// Proses penghapusan booking
		const result = await bookingController.deleteBooking(supabase, profile, formData);

		if (!result.success) {
			return fail(result.status || 500, { error: result.error });
		}

		return { success: true };
	}
};

