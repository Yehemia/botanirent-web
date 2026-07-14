import { bookingModel } from '../models/bookingModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { assetModel } from '../models/assetModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet } from '../cache.js';
import { supabaseAdmin } from '../supabase.js';

export const bookingController = {
	/**
	 * Siapkan semua data untuk halaman kalender booking.
	 *
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

		// Post-process bookings to inject virtual status blocks for active status (washing, maintenance, late rental)
		const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
		const bookingsByAsset = new Map();
		bookings.forEach((b) => {
			if (!bookingsByAsset.has(b.rental_asset_id)) {
				bookingsByAsset.set(b.rental_asset_id, []);
			}
			bookingsByAsset.get(b.rental_asset_id).push(b);
		});

		const processedBookings = bookings.map(b => ({ ...b }));

		for (const asset of assets) {
			const assetBookings = bookingsByAsset.get(asset.id) || [];

			if (asset.status === 'rented') {
				// Find if there is an active rental booking for this asset that is overdue (end_date < today)
				const activeRentalBooking = processedBookings.find(
					(/** @type {any} */ b) => b.rental_asset_id === asset.id && b.transaction_item_id && b.status === 'active' && b.end_date < todayStr
				);
				if (activeRentalBooking) {
					activeRentalBooking.end_date = todayStr;
					activeRentalBooking.notes = 'Sewa Terlambat Kembali';
				} else {
					// Check if there is already an active booking covering today
					const hasActiveBookingToday = assetBookings.some(
						(/** @type {any} */ b) => b.status === 'active' && b.start_date <= todayStr && b.end_date >= todayStr
					);
					if (!hasActiveBookingToday) {
						const start = asset.last_status_change 
							? new Date(asset.last_status_change).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
							: todayStr;
						const finalStart = start > todayStr ? todayStr : start;

						processedBookings.push({
							id: `virtual-rented-${asset.id}`,
							rental_asset_id: asset.id,
							start_date: finalStart,
							end_date: todayStr,
							status: 'active',
							notes: 'Sedang Disewa (Berjalan)',
							rental_asset: {
								id: asset.id,
								asset_code: asset.asset_code,
								item: {
									id: asset.item.id,
									name: asset.item.name
								}
							}
						});
					}
				}
			} else if (asset.status === 'washing' || asset.status === 'maintenance') {
				// Check if there is already a manual booking covering today
				const hasActiveBlockToday = assetBookings.some(
					(/** @type {any} */ b) => b.status === 'active' && b.start_date <= todayStr && b.end_date >= todayStr
				);

				if (!hasActiveBlockToday) {
					const start = asset.last_status_change 
						? new Date(asset.last_status_change).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
						: todayStr;
					const finalStart = start > todayStr ? todayStr : start;

					processedBookings.push({
						id: `virtual-${asset.status}-${asset.id}`,
						rental_asset_id: asset.id,
						start_date: finalStart,
						end_date: todayStr,
						status: 'active',
						notes: asset.status === 'washing' ? 'Pembersihan (Dicuci)' : 'Pemeliharaan (Maintenance)',
						rental_asset: {
							id: asset.id,
							asset_code: asset.asset_code,
							item: {
								id: asset.item.id,
								name: asset.item.name
							}
						}
					});
				}
			}
		}

		return {
			branches,
			categories,
			items,
			assets,
			bookings: processedBookings,
			selectedBranchId,
			role: profile.role
		};
	},

	/**
	 * Buat blokir maintenance atau washing untuk satu unit asset.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async createMaintenance(supabase, profile, formData) {
		if (profile.role === 'kasir') {
			return {
				success: false,
				status: 403,
				error: 'Akses ditolak: Kasir tidak diizinkan melakukan tindakan ini.'
			};
		}

		const rental_asset_id = formData.get('rental_asset_id')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;
		const start_date = formData.get('start_date')?.toString();
		const end_date = formData.get('end_date')?.toString();
		const notes = formData.get('notes')?.toString() || 'Maintenance';
		const status = formData.get('status')?.toString() || 'maintenance';

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
			const booking = await bookingModel.createBooking(supabaseAdmin, {
				rental_asset_id,
				branch_id,
				start_date,
				end_date,
				status: 'active'
			});

			await activityLogModel.logActivity(supabaseAdmin, {
				userId: profile.id,
				branchId: branch_id,
				action: 'create_maintenance',
				entityType: 'booking',
				entityId: booking.id,
				metadata: { rental_asset_id, start_date, end_date, notes }
			});

			const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
			if (start_date <= todayStr && todayStr <= end_date) {
				await assetModel.updateAssetStatus(supabaseAdmin, rental_asset_id, status, notes);
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
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string }} profile
	 * @param {FormData} formData
	 */
	async deleteBooking(supabase, profile, formData) {
		if (profile.role === 'kasir') {
			return {
				success: false,
				status: 403,
				error: 'Akses ditolak: Kasir tidak diizinkan melakukan tindakan ini.'
			};
		}

		const id = formData.get('id')?.toString();
		if (!id) {
			return { success: false, status: 400, error: 'ID booking tidak ditemukan.' };
		}

		try {
			const booking = await bookingModel.getBookingDetails(supabaseAdmin, id);
			if (!booking) {
				return { success: false, status: 404, error: 'Booking tidak ditemukan.' };
			}

			const isMaintenance = !booking.transaction_item_id;

			await bookingModel.deleteBooking(supabaseAdmin, id);

			await activityLogModel.logActivity(supabaseAdmin, {
				userId: profile.id,
				branchId: booking.branch_id,
				action: 'delete_booking',
				entityType: 'booking',
				entityId: id,
				metadata: { isMaintenance, rental_asset_id: booking.rental_asset_id }
			});

			const { data: assetData } = await supabaseAdmin
				.from('rental_assets')
				.select('status')
				.eq('id', booking.rental_asset_id)
				.single();

			if (assetData) {
				if (isMaintenance && (assetData.status === 'maintenance' || assetData.status === 'washing')) {
					await assetModel.updateAssetStatus(
						supabaseAdmin,
						booking.rental_asset_id,
						'ready',
						'Maintenance dibatalkan/dilepas'
					);
				} else if (!isMaintenance && assetData.status === 'rented') {
					await assetModel.updateAssetStatus(
						supabaseAdmin,
						booking.rental_asset_id,
						'ready',
						'Booking sewa dilepas'
					);
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting booking in controller:', error);
			return { success: false, status: 500, error: 'Gagal menghapus booking.' };
		}
	},

	/**
	 * Tandai booking maintenance sebagai selesai.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string }} profile
	 * @param {FormData} formData
	 */
	async completeMaintenance(supabase, profile, formData) {
		if (profile.role === 'kasir') {
			return {
				success: false,
				status: 403,
				error: 'Akses ditolak: Kasir tidak diizinkan melakukan tindakan ini.'
			};
		}

		const id = formData.get('id')?.toString();
		if (!id) {
			return { success: false, status: 400, error: 'ID booking tidak ditemukan.' };
		}

		try {
			const booking = await bookingModel.getBookingDetails(supabaseAdmin, id);
			if (!booking) {
				return { success: false, status: 404, error: 'Booking tidak ditemukan.' };
			}

			await bookingModel.updateBookingStatus(supabaseAdmin, id, 'completed');

			await activityLogModel.logActivity(supabaseAdmin, {
				userId: profile.id,
				branchId: booking.branch_id,
				action: 'complete_maintenance',
				entityType: 'booking',
				entityId: id,
				metadata: { rental_asset_id: booking.rental_asset_id }
			});

			await assetModel.updateAssetStatus(
				supabaseAdmin,
				booking.rental_asset_id,
				'ready',
				'Maintenance selesai'
			);

			return { success: true };
		} catch (error) {
			console.error('Error completing maintenance in controller:', error);
			return { success: false, status: 500, error: 'Gagal menyelesaikan maintenance.' };
		}
	}
};
