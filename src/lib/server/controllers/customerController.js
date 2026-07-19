import { customerModel } from '../models/customerModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet, invalidateDashboardCache } from '../cache.js';

/**
 * Hapus HTML tags berbahaya dari input user.
 *
 * @param {any} value
 */
function sanitizeText(value) {
	if (!value) return '';
	return value
		.toString()
		.trim()
		.replace(/<\/?[^>]+(>|$)/g, '');
}

export const customerController = {
	/**
	 * Siapkan semua data yang dibutuhkan halaman daftar pelanggan.
	 *
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
				branches = await cacheGet(
					'active_branches',
					() => branchModel.getActiveBranches(supabase),
					30000
				);
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

		const customers = await cacheGet(
			`customers_list_${selectedBranchId}`,
			() => customerModel.getCustomers(supabase, selectedBranchId),
			15000
		);

		return {
			customers,
			branches,
			selectedBranchId,
			role: profile.role
		};
	},

	/**
	 * Proses form TAMBAH pelanggan baru.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async createCustomer(supabase, profile, formData) {
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const guarantee_type = formData.get('guarantee_type')?.toString();
		const notes = formData.get('notes')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!full_name || !full_name.trim()) {
			return { success: false, status: 400, error: 'Nama Lengkap wajib diisi.' };
		}

		const clean_full_name = sanitizeText(full_name);
		const clean_address = sanitizeText(address);
		const clean_notes = sanitizeText(notes);
		const clean_guarantee_type = sanitizeText(guarantee_type) || 'Tanpa Jaminan';

		let clean_phone = '';
		if (phone && phone.trim()) {
			const phoneTrim = phone.trim();
			if (!/^[0-9+\-\s]{5,20}$/.test(phoneTrim)) {
				return {
					success: false,
					status: 400,
					error: 'Nomor Handphone tidak valid (hanya angka, spasi, +, - dan panjang 5-20 karakter).'
				};
			}
			clean_phone = phoneTrim.replace(/[^0-9+\-\s]/g, '');
		}

		let clean_email = '';
		if (email && email.trim()) {
			const emailTrim = email.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailTrim)) {
				return { success: false, status: 400, error: 'Format Email tidak valid.' };
			}
			clean_email = emailTrim;
		}

		if (clean_phone) {
			const { data: existingPhone } = await supabase
				.from('customers')
				.select('id, full_name')
				.eq('phone', clean_phone)
				.maybeSingle();
			if (existingPhone) {
				return {
					success: false,
					status: 400,
					error: `Nomor Handphone "${clean_phone}" sudah terdaftar pada pelanggan "${existingPhone.full_name}".`
				};
			}
		}

		if (clean_email) {
			const { data: existingEmail } = await supabase
				.from('customers')
				.select('id, full_name')
				.eq('email', clean_email)
				.maybeSingle();
			if (existingEmail) {
				return {
					success: false,
					status: 400,
					error: `Email "${clean_email}" sudah terdaftar pada pelanggan "${existingEmail.full_name}".`
				};
			}
		}

		const notesObj = {
			guarantee_type: clean_guarantee_type,
			deposit_amount: 0,
			notes: clean_notes
		};
		const notesJson = JSON.stringify(notesObj);

		try {
			const customer = await customerModel.createCustomer(supabase, {
				branch_id,
				full_name: clean_full_name,
				phone: clean_phone || null,
				email: clean_email || null,
				address: clean_address || null,
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

			invalidateDashboardCache(branch_id);

			return { success: true };
		} catch (error) {
			console.error('Error in createCustomer controller:', error);
			return { success: false, status: 500, error: 'Gagal membuat data penyewa.' };
		}
	},

	/**
	 * Proses form EDIT data pelanggan.
	 *
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
		const guarantee_type = formData.get('guarantee_type')?.toString();
		const notes = formData.get('notes')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		if (!id || !full_name || !full_name.trim()) {
			return { success: false, status: 400, error: 'Data tidak lengkap atau Nama Lengkap kosong.' };
		}

		const clean_full_name = sanitizeText(full_name);
		const clean_address = sanitizeText(address);
		const clean_notes = sanitizeText(notes);
		const clean_guarantee_type = sanitizeText(guarantee_type) || 'Tanpa Jaminan';

		let clean_phone = '';
		if (phone && phone.trim()) {
			const phoneTrim = phone.trim();
			if (!/^[0-9+\-\s]{5,20}$/.test(phoneTrim)) {
				return {
					success: false,
					status: 400,
					error: 'Nomor Handphone tidak valid (hanya angka, spasi, +, - dan panjang 5-20 karakter).'
				};
			}
			clean_phone = phoneTrim.replace(/[^0-9+\-\s]/g, '');
		}

		let clean_email = '';
		if (email && email.trim()) {
			const emailTrim = email.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailTrim)) {
				return { success: false, status: 400, error: 'Format Email tidak valid.' };
			}
			clean_email = emailTrim;
		}

		if (clean_phone) {
			const { data: existingPhone } = await supabase
				.from('customers')
				.select('id, full_name')
				.eq('phone', clean_phone)
				.neq('id', id)
				.maybeSingle();
			if (existingPhone) {
				return {
					success: false,
					status: 400,
					error: `Nomor Handphone "${clean_phone}" sudah terdaftar pada pelanggan "${existingPhone.full_name}".`
				};
			}
		}

		if (clean_email) {
			const { data: existingEmail } = await supabase
				.from('customers')
				.select('id, full_name')
				.eq('email', clean_email)
				.neq('id', id)
				.maybeSingle();
			if (existingEmail) {
				return {
					success: false,
					status: 400,
					error: `Email "${clean_email}" sudah terdaftar pada pelanggan "${existingEmail.full_name}".`
				};
			}
		}

		let ktp_number = '';
		let deposit_amount = 0;
		try {
			const { data: existingCustomer } = await supabase
				.from('customers')
				.select('notes')
				.eq('id', id)
				.single();

			if (existingCustomer?.notes) {
				const json = JSON.parse(existingCustomer.notes);
				if (json && typeof json === 'object') {
					ktp_number = json.ktp_number || '';
					deposit_amount = Number(json.deposit_amount) || 0;
				}
			}
		} catch (err) {
			console.error('Gagal mengambil data lama KTP/Deposit:', err);
		}

		const notesObj = {
			ktp_number,
			guarantee_type: clean_guarantee_type,
			deposit_amount,
			notes: clean_notes
		};
		const notesJson = JSON.stringify(notesObj);

		try {
			await customerModel.updateCustomer(supabase, id, {
				full_name: clean_full_name,
				phone: clean_phone || null,
				email: clean_email || null,
				address: clean_address || null,
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

			invalidateDashboardCache(branch_id);

			return { success: true };
		} catch (error) {
			console.error('Error in updateCustomer controller:', error);
			return { success: false, status: 500, error: 'Gagal mengubah data penyewa.' };
		}
	},

	/**
	 * Proses form HAPUS pelanggan.
	 *
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

			if (customer) {
				invalidateDashboardCache(customer.branch_id);
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
