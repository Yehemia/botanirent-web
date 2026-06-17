import { bookingModel } from '../models/bookingModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { assetModel } from '../models/assetModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet } from '../cache.js';

export const bookingController = {
	/**
	 * Get calendar booking data, including assets, bookings, and items
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 * @param {string|null} urlSearchBranchId
	 */
	async getBookingPageData(supabase, profile, urlSearchBranchId) {
		const isOwner = profile.role === 'owner';
		let selectedBranchId = urlSearchBranchId || profile.branch_id;

		let branches = [];
		if (isOwner) {
			try {
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

		const [categories, items, assets, bookings] = await Promise.all([
			categoryModel.getCategoriesByType(supabase, 'sewa'),
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
	 * Create a maintenance/washing block for an asset
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
		const status = formData.get('status')?.toString() || 'maintenance'; // 'maintenance' or 'washing'

		if (!rental_asset_id || !start_date || !end_date) {
			return {
				success: false,
				status: 400,
				error: 'Data tidak lengkap. Harap isi tanggal mulai, tanggal selesai, dan pilih unit.'
			};
		}

		if (new Date(start_date) > new Date(end_date)) {
			return {
				success: false,
				status: 400,
				error: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.'
			};
		}

		try {
			const booking = await bookingModel.createBooking(supabase, {
				rental_asset_id,
				branch_id,
				start_date,
				end_date,
				status: 'active'
			});

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: branch_id,
				action: 'create_maintenance',
				entityType: 'booking',
				entityId: booking.id,
				metadata: { rental_asset_id, start_date, end_date, notes }
			});

			// If block starts/includes today, update status of physical asset
			const todayStr = new Date().toISOString().split('T')[0];
			if (start_date <= todayStr && todayStr <= end_date) {
				await assetModel.updateAssetStatus(supabase, rental_asset_id, status, notes);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating maintenance booking in controller:', error);
			return { success: false, status: 500, error: 'Gagal membuat pemblokiran di database.' };
		}
	},

	/**
	 * Delete a booking (and release asset if it was maintenance)
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
			const booking = await bookingModel.getBookingDetails(supabase, id);
			if (!booking) {
				return { success: false, status: 404, error: 'Booking tidak ditemukan.' };
			}

			const isMaintenance = !booking.transaction_item_id;

			await bookingModel.deleteBooking(supabase, id);

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: booking.branch_id,
				action: 'delete_booking',
				entityType: 'booking',
				entityId: id,
				metadata: { isMaintenance, rental_asset_id: booking.rental_asset_id }
			});

			// If it's a maintenance booking and active today, reset asset status to 'ready'
			const todayStr = new Date().toISOString().split('T')[0];
			if (isMaintenance && booking.start_date <= todayStr && todayStr <= booking.end_date) {
				await assetModel.updateAssetStatus(
					supabase,
					booking.rental_asset_id,
					'ready',
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
