import { customerModel } from '../models/customerModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const customerController = {
	/**
	 * Get customer list page data, with branch options for owner role
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 * @param {string|null} urlSearchBranchId
	 */
	async getCustomersPageData(supabase, profile, urlSearchBranchId) {
		const isOwner = profile.role === 'owner';
		let selectedBranchId = urlSearchBranchId || profile.branch_id;

		let branches = [];
		if (isOwner) {
			try {
				branches = await branchModel.getActiveBranches(supabase);
				if (!selectedBranchId && branches.length > 0) {
					selectedBranchId = branches[0].id;
				}
			} catch (error) {
				console.error('Error fetching active branches in controller:', error);
			}
		} else {
			selectedBranchId = profile.branch_id;
		}

		if (!selectedBranchId) {
			return {
				customers: [],
				branches: [],
				selectedBranchId: null,
				role: profile.role
			};
		}

		const customers = await customerModel.getCustomers(supabase, selectedBranchId);

		return {
			customers,
			branches,
			selectedBranchId,
			role: profile.role
		};
	},

	/**
	 * Action handler to create a customer
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async createCustomer(supabase, profile, formData) {
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const ktp_number = formData.get('ktp_number')?.toString() || '';
		const guarantee_type = formData.get('guarantee_type')?.toString() || '';
		const deposit_amount = parseFloat(formData.get('deposit_amount')?.toString() || '0');
		const notes = formData.get('notes')?.toString() || '';
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!full_name) {
			return { success: false, status: 400, error: 'Nama Lengkap wajib diisi.' };
		}

		const notesObj = {
			ktp_number,
			guarantee_type,
			deposit_amount,
			notes
		};
		const notesJson = JSON.stringify(notesObj);

		try {
			const customer = await customerModel.createCustomer(supabase, {
				branch_id,
				full_name,
				phone,
				email,
				address,
				notes: notesJson
			});

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: branch_id,
				action: 'create_customer',
				entityType: 'customer',
				entityId: customer.id,
				metadata: { full_name, phone }
			});

			return { success: true };
		} catch (error) {
			console.error('Error in createCustomer controller:', error);
			return { success: false, status: 500, error: 'Gagal membuat data penyewa.' };
		}
	},

	/**
	 * Action handler to update a customer
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async updateCustomer(supabase, profile, formData) {
		const id = formData.get('id')?.toString();
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const ktp_number = formData.get('ktp_number')?.toString() || '';
		const guarantee_type = formData.get('guarantee_type')?.toString() || '';
		const deposit_amount = parseFloat(formData.get('deposit_amount')?.toString() || '0');
		const notes = formData.get('notes')?.toString() || '';
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!id || !full_name) {
			return { success: false, status: 400, error: 'Data tidak lengkap.' };
		}

		const notesObj = {
			ktp_number,
			guarantee_type,
			deposit_amount,
			notes
		};
		const notesJson = JSON.stringify(notesObj);

		try {
			await customerModel.updateCustomer(supabase, id, {
				full_name,
				phone,
				email,
				address,
				notes: notesJson
			});

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: branch_id,
				action: 'update_customer',
				entityType: 'customer',
				entityId: id,
				metadata: { full_name, phone }
			});

			return { success: true };
		} catch (error) {
			console.error('Error in updateCustomer controller:', error);
			return { success: false, status: 500, error: 'Gagal mengubah data penyewa.' };
		}
	},

	/**
	 * Action handler to delete a customer
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string }} profile
	 * @param {FormData} formData
	 */
	async deleteCustomer(supabase, profile, formData) {
		const id = formData.get('id')?.toString();

		if (!id) {
			return { success: false, status: 400, error: 'ID tidak ditemukan.' };
		}

		try {
			const customer = await customerModel.getCustomerDetails(supabase, id);

			await customerModel.deleteCustomer(supabase, id);

			if (customer) {
				await activityLogModel.logActivity(supabase, {
					userId: profile.id,
					branchId: customer.branch_id,
					action: 'delete_customer',
					entityType: 'customer',
					entityId: id,
					metadata: { full_name: customer.full_name }
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error in deleteCustomer controller:', error);
			return {
				success: false,
				status: 500,
				error:
					'Gagal menghapus data penyewa. Pastikan pelanggan tidak memiliki riwayat transaksi aktif.'
			};
		}
	}
};
