/**
 * ============================================================
 * FILE: bookingController.js
 * TUJUAN: Logic bisnis untuk halaman Booking (kalender ketersediaan barang).
 *
 * FITUR HALAMAN BOOKING:
 *   1. Tampilkan kalender ketersediaan setiap unit asset
 *   2. Tambah blokir MAINTENANCE atau WASHING (manual, oleh gudang)
 *   3. Hapus blokir maintenance yang tidak perlu lagi
 *
 * CATATAN: Booking dari transaksi pelanggan TIDAK dibuat di sini.
 *   Booking sewa dibuat otomatis oleh database function (checkout_transaction).
 *   Controller ini hanya mengurus booking MANUAL (maintenance/washing).
 *
 * LOGIKA STATUS ASSET (saat create maintenance):
 *   Jika tanggal maintenance mencakup HARI INI →
 *     status asset LANGSUNG diubah ke 'maintenance'/'washing'
 *   Jika maintenance di MASA DEPAN →
 *     status asset tetap 'ready', akan berubah nanti saat harinya tiba
 *     (proses otomatis atau manual saat itu)
 * ============================================================
 */

import { bookingModel } from '../models/bookingModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { assetModel } from '../models/assetModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet } from '../cache.js';

export const bookingController = {
	/**
	 * Siapkan semua data untuk halaman kalender booking.
	 *
	 * Data yang dimuat:
	 *   - categories → untuk filter kategori barang di kalender
	 *   - items      → daftar jenis barang (untuk filter di UI)
	 *   - assets     → semua unit fisik (titik di kalender)
	 *   - bookings   → semua blokir waktu yang aktif
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 * @param {string|null} urlSearchBranchId - Cabang yang dipilih owner dari URL
	 */
	async getBookingPageData(supabase, profile, urlSearchBranchId) {
		const isOwner = profile.role === 'owner';
		let selectedBranchId = urlSearchBranchId || profile.branch_id;

		let branches = [];
		if (isOwner) {
			try {
				// Owner: ambil daftar cabang aktif untuk dropdown (di-cache 30 detik)
				branches = await cacheGet(
					'active_branches',
					() => branchModel.getActiveBranches(supabase),
					30000
				);
				if (!selectedBranchId && branches.length > 0) {
					selectedBranchId = branches[0].id;
				}
			} catch (error) {
				console.error('Error fetching active branches in bookingController:', error);
			}
		} else {
			selectedBranchId = profile.branch_id;
		}

		// Guard: jika tidak ada cabang yang dipilih, kembalikan data kosong
		if (!selectedBranchId) {
			return {
				branches: [],
				categories: [],
				items: [],
				assets: [],
				bookings: [],
				selectedBranchId: null,
				role: profile.role
			};
		}

		// Jalankan 4 query paralel
		const [categories, items, assets, bookings] = await Promise.all([
			categoryModel.getCategoriesByType(supabase, 'sewa'), // Hanya kategori sewa (bukan jual)
			itemModel.getActiveSewaItems(supabase, selectedBranchId),
			assetModel.getAssets(supabase, { branchId: selectedBranchId }),
			bookingModel.getBranchBookings(supabase, selectedBranchId)
		]);

		return {
			branches,
			categories,
			items,
			assets,
			bookings,
			selectedBranchId,
			role: profile.role
		};
	},

	/**
	 * Buat blokir maintenance atau washing untuk satu unit asset.
	 *
	 * VALIDASI:
	 *   1. Field wajib harus ada (asset, tanggal mulai, tanggal selesai)
	 *   2. Tanggal selesai tidak boleh sebelum tanggal mulai
	 *
	 * EFEK SAMPING:
	 *   Jika tanggal maintenance mencakup hari ini → langsung update status asset
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async createMaintenance(supabase, profile, formData) {
		const rental_asset_id = formData.get('rental_asset_id')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;
		const start_date = formData.get('start_date')?.toString();
		const end_date = formData.get('end_date')?.toString();
		const notes = formData.get('notes')?.toString() || 'Maintenance';
		const status = formData.get('status')?.toString() || 'maintenance'; // 'maintenance' atau 'washing'

		// Validasi field wajib
		if (!rental_asset_id || !start_date || !end_date) {
			return {
				success: false,
				status: 400,
				error: 'Data tidak lengkap. Harap isi tanggal mulai, tanggal selesai, dan pilih unit.'
			};
		}

		// Validasi logika tanggal: tanggal selesai harus >= tanggal mulai
		if (new Date(start_date) > new Date(end_date)) {
			return {
				success: false,
				status: 400,
				error: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.'
			};
		}

		try {
			// Buat booking baru di database
			const booking = await bookingModel.createBooking(supabase, {
				rental_asset_id,
				branch_id,
				start_date,
				end_date,
				status: 'active' // Status booking: 'active' (bukan status asset)
			});

			// Catat activity log
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: branch_id,
				action: 'create_maintenance',
				entityType: 'booking',
				entityId: booking.id,
				metadata: { rental_asset_id, start_date, end_date, notes }
			});

			// Efek samping: Jika maintenance berlaku mulai hari ini → update status asset sekarang
			const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
			if (start_date <= todayStr && todayStr <= end_date) {
				// Hari ini ada dalam rentang maintenance → asset langsung tidak tersedia
				await assetModel.updateAssetStatus(supabase, rental_asset_id, status, notes);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating maintenance booking in controller:', error);
			return { success: false, status: 500, error: 'Gagal membuat pemblokiran di database.' };
		}
	},

	/**
	 * Hapus satu booking (maintenance/washing).
	 *
	 * EFEK SAMPING:
	 *   Jika booking yang dihapus adalah:
	 *   1. Booking MAINTENANCE (bukan dari transaksi sewa)
	 *   2. DAN maintenance sedang berjalan hari ini
	 *   → Status asset dikembalikan ke 'ready' (maintenance dianggap selesai)
	 *
	 * Cara deteksi apakah booking maintenance:
	 *   isMaintenance = !booking.transaction_item_id
	 *   (Booking sewa punya transaction_item_id, booking maintenance tidak)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string }} profile
	 * @param {FormData} formData
	 */
	async deleteBooking(supabase, profile, formData) {
		const id = formData.get('id')?.toString();
		if (!id) {
			return { success: false, status: 400, error: 'ID booking tidak ditemukan.' };
		}

		try {
			// Ambil detail booking sebelum dihapus (perlu untuk log dan cek efek samping)
			const booking = await bookingModel.getBookingDetails(supabase, id);
			if (!booking) {
				return { success: false, status: 404, error: 'Booking tidak ditemukan.' };
			}

			// Cek apakah ini booking maintenance (bukan booking sewa)
			// Booking maintenance: transaction_item_id = null
			const isMaintenance = !booking.transaction_item_id;

			// Hapus booking dari database
			await bookingModel.deleteBooking(supabase, id);

			// Catat log penghapusan
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: booking.branch_id,
				action: 'delete_booking',
				entityType: 'booking',
				entityId: id,
				metadata: { isMaintenance, rental_asset_id: booking.rental_asset_id }
			});

			// Efek samping: Jika booking maintenance yang aktif hari ini dihapus
			// → kembalikan status asset ke 'ready' (maintenance selesai lebih awal)
			const todayStr = new Date().toISOString().split('T')[0];
			if (isMaintenance && booking.start_date <= todayStr && todayStr <= booking.end_date) {
				await assetModel.updateAssetStatus(
					supabase,
					booking.rental_asset_id,
					'ready', // Kembalikan ke siap pakai
					'Maintenance selesai'
				);
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting booking in controller:', error);
			return { success: false, status: 500, error: 'Gagal menghapus booking.' };
		}
	}
};
