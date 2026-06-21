/**
 * ============================================================
 * FILE: customerController.js
 * TUJUAN: Lapisan LOGIC BISNIS untuk fitur manajemen pelanggan.
 *
 * PERBEDAAN CONTROLLER vs MODEL:
 *   Model   → "Ambilkan data X dari database" (tidak peduli bisnis)
 *   Controller → "Pastikan data valid, siapkan data yang tepat, baru minta model ambil"
 *
 * TANGGUNG JAWAB CONTROLLER INI:
 *   1. Membaca data yang diperlukan halaman customers (getCustomersPageData)
 *   2. Memproses form TAMBAH pelanggan (createCustomer)
 *   3. Memproses form EDIT pelanggan (updateCustomer)
 *   4. Memproses form HAPUS pelanggan (deleteCustomer)
 *
 * KONSEP SANITASI INPUT:
 *   Data dari user (form HTML) TIDAK BISA dipercaya 100%.
 *   Seseorang bisa memasukkan HTML/script berbahaya (<script>alert('hack')</script>).
 *   Sanitasi = bersihkan input sebelum disimpan ke database.
 *
 * ALUR DATA:
 *   User isi form → FormData dikirim → Controller validasi & sanitasi → Model simpan ke DB
 * ============================================================
 */

import { customerModel } from '../models/customerModel.js';
import { branchModel } from '../models/branchModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet } from '../cache.js';

/**
 * FUNGSI SANITASI TEKS — Hapus HTML tags berbahaya dari input user.
 *
 * CONTOH SERANGAN XSS (Cross-Site Scripting):
 *   User memasukkan: <script>document.cookie</script>
 *   Setelah sanitasi: (string kosong karena semua tag dihapus)
 *
 * REGEX PENJELASAN:
 *   /<\/?[^>]+(>|$)/g
 *   <        → karakter <
 *   \/?      → opsional /
 *   [^>]+    → satu atau lebih karakter bukan >
 *   (>|$)    → diakhiri dengan > atau akhir string
 *   g        → global (hapus semua, bukan hanya yang pertama)
 *
 * @param {any} value
 */
function sanitizeText(value) {
	if (!value) return '';
	return value
		.toString()
		.trim() // Hapus spasi di awal dan akhir
		.replace(/<\/?[^>]+(>|$)/g, ''); // Hapus semua HTML tags
}

export const customerController = {
	/**
	 * Siapkan semua data yang dibutuhkan halaman daftar pelanggan.
	 *
	 * LOGIKA PERAN (RBAC - Role Based Access Control):
	 *   Owner → Bisa pilih cabang mana yang dilihat (dropdown cabang tampil)
	 *           Default ke cabang pertama atau URL param 'branch'
	 *   Kasir/Gudang → Hanya bisa lihat pelanggan cabangnya sendiri
	 *                  (branch_id dari profil mereka)
	 *
	 * CACHING:
	 *   Data daftar cabang di-cache 30 detik karena jarang berubah.
	 *   Ini menghindari query database berulang saat owner navigasi antar halaman.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile - Data profil user yang login
	 * @param {string|null} urlSearchBranchId - Branch ID dari URL query param (hanya untuk owner)
	 */
	async getCustomersPageData(supabase, profile, urlSearchBranchId) {
		const isOwner = profile.role === 'owner';
		// Prioritas branch: dari URL param → dari profil user
		let selectedBranchId = urlSearchBranchId || profile.branch_id;

		let branches = [];
		if (isOwner) {
			try {
				// Owner: ambil daftar semua cabang aktif (di-cache 30 detik)
				branches = await cacheGet(
					'active_branches',
					() => branchModel.getActiveBranches(supabase),
					30000
				);
				// Jika owner belum pilih cabang dan ada cabang tersedia → pilih cabang pertama
				if (!selectedBranchId && branches.length > 0) {
					selectedBranchId = branches[0].id;
				}
			} catch (error) {
				console.error('Error fetching active branches in controller:', error);
			}
		} else {
			// Kasir/Gudang: paksa pakai branch_id milik mereka
			selectedBranchId = profile.branch_id;
		}

		// Jika tidak ada cabang yang bisa diakses → kembalikan data kosong
		if (!selectedBranchId) {
			return {
				customers: [],
				branches: [],
				selectedBranchId: null,
				role: profile.role
			};
		}

		// Ambil data pelanggan dari model
		const customers = await customerModel.getCustomers(supabase, selectedBranchId);

		return {
			customers,
			branches, // Kosong untuk non-owner (tidak perlu tampilkan dropdown)
			selectedBranchId,
			role: profile.role
		};
	},

	/**
	 * Proses form TAMBAH pelanggan baru.
	 *
	 * ALUR:
	 * 1. Ambil semua field dari FormData
	 * 2. Validasi field wajib (nama tidak boleh kosong)
	 * 3. Sanitasi semua input teks (hapus HTML)
	 * 4. Validasi format nomor HP (regex)
	 * 5. Validasi format email (regex)
	 * 6. Simpan ke database via model
	 * 7. Catat activity log
	 * 8. Return { success: true } atau { success: false, error: '...' }
	 *
	 * KONSEP RETURN OBJECT:
	 *   Semua action handler mengembalikan { success, status, error } atau { success }
	 *   Ini memudahkan halaman Svelte menampilkan pesan sukses/error ke user.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData - Data dari HTML form
	 */
	async createCustomer(supabase, profile, formData) {
		// 1. Ambil semua field dari FormData
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const guarantee_type = formData.get('guarantee_type')?.toString();
		const notes = formData.get('notes')?.toString();
		// branch_id dari form (owner), atau dari profil user (kasir)
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		// 2. Validasi input wajib
		if (!full_name || !full_name.trim()) {
			return { success: false, status: 400, error: 'Nama Lengkap wajib diisi.' };
		}

		// 3. Sanitasi data teks (hapus tag HTML berbahaya)
		const clean_full_name = sanitizeText(full_name);
		const clean_address = sanitizeText(address);
		const clean_notes = sanitizeText(notes);
		const clean_guarantee_type = sanitizeText(guarantee_type) || 'Tanpa Jaminan';

		// 4. Validasi & Sanitasi nomor telepon (opsional, jika diisi)
		let clean_phone = '';
		if (phone && phone.trim()) {
			const phoneTrim = phone.trim();
			// Regex: hanya boleh angka, +, -, spasi; panjang 5-20 karakter
			if (!/^[0-9+\-\s]{5,20}$/.test(phoneTrim)) {
				return {
					success: false,
					status: 400,
					error: 'Nomor Handphone tidak valid (hanya angka, spasi, +, - dan panjang 5-20 karakter).'
				};
			}
			// Bersihkan: hanya simpan karakter yang valid
			clean_phone = phoneTrim.replace(/[^0-9+\-\s]/g, '');
		}

		// 5. Validasi & Sanitasi email (opsional, jika diisi)
		let clean_email = '';
		if (email && email.trim()) {
			const emailTrim = email.trim().toLowerCase(); // Konversi ke lowercase
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Format email standar
			if (!emailRegex.test(emailTrim)) {
				return { success: false, status: 400, error: 'Format Email tidak valid.' };
			}
			clean_email = emailTrim;
		}

		// 6. Buat objek notes (disimpan sebagai JSON di database)
		const notesObj = {
			guarantee_type: clean_guarantee_type,
			deposit_amount: 0,
			notes: clean_notes
		};
		const notesJson = JSON.stringify(notesObj); // Konversi objek JS → string JSON

		try {
			// 7. Simpan pelanggan baru ke database
			const customer = await customerModel.createCustomer(supabase, {
				branch_id,
				full_name: clean_full_name,
				phone: clean_phone || null, // null jika kosong (lebih baik dari string kosong di DB)
				email: clean_email || null,
				address: clean_address || null,
				notes: notesJson
			});

			// 8. Catat activity log
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: branch_id,
				action: 'create_customer',
				entityType: 'customer',
				entityId: customer.id,
				metadata: { full_name, phone } // Data mentah (sebelum sanitasi) untuk keperluan log
			});

			return { success: true };
		} catch (error) {
			console.error('Error in createCustomer controller:', error);
			return { success: false, status: 500, error: 'Gagal membuat data penyewa.' };
		}
	},

	/**
	 * Proses form EDIT data pelanggan.
	 *
	 * FITUR KHUSUS: Preserve data KTP dan Deposit yang sudah ada.
	 *   Form edit tidak menampilkan field KTP (sudah dihapus dari tampilan).
	 *   Tapi data KTP lama mungkin tersimpan di kolom 'notes' (format JSON).
	 *   Kita harus AMBIL dulu data lama, lalu UPDATE hanya field yang berubah,
	 *   agar KTP lama tidak terhapus ketika update.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async updateCustomer(supabase, profile, formData) {
		const id = formData.get('id')?.toString(); // ID pelanggan yang diedit
		const full_name = formData.get('full_name')?.toString();
		const phone = formData.get('phone')?.toString();
		const email = formData.get('email')?.toString();
		const address = formData.get('address')?.toString();
		const guarantee_type = formData.get('guarantee_type')?.toString();
		const notes = formData.get('notes')?.toString();
		const branch_id = formData.get('branch_id')?.toString() || profile.branch_id;

		// 1. Validasi input wajib (id dan nama)
		if (!id || !full_name || !full_name.trim()) {
			return { success: false, status: 400, error: 'Data tidak lengkap atau Nama Lengkap kosong.' };
		}

		// 2. Sanitasi data teks
		const clean_full_name = sanitizeText(full_name);
		const clean_address = sanitizeText(address);
		const clean_notes = sanitizeText(notes);
		const clean_guarantee_type = sanitizeText(guarantee_type) || 'Tanpa Jaminan';

		// 3. Validasi & Sanitasi nomor telepon
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

		// 4. Validasi & Sanitasi email
		let clean_email = '';
		if (email && email.trim()) {
			const emailTrim = email.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailTrim)) {
				return { success: false, status: 400, error: 'Format Email tidak valid.' };
			}
			clean_email = emailTrim;
		}

		// 5. Ambil data notes LAMA untuk preserve ktp_number & deposit_amount
		//    Field ini tidak ada di form edit, jadi harus dipertahankan dari data lama
		let ktp_number = '';
		let deposit_amount = 0;
		try {
			const { data: existingCustomer } = await supabase
				.from('customers')
				.select('notes')
				.eq('id', id)
				.single();

			if (existingCustomer?.notes) {
				// Parse JSON dari kolom notes
				const json = JSON.parse(existingCustomer.notes);
				if (json && typeof json === 'object') {
					ktp_number = json.ktp_number || ''; // Pertahankan KTP lama jika ada
					deposit_amount = Number(json.deposit_amount) || 0;
				}
			}
		} catch (err) {
			console.error('Gagal mengambil data lama KTP/Deposit:', err);
		}

		// 6. Buat objek notes baru yang menggabungkan data lama dan baru
		const notesObj = {
			ktp_number, // Dari data lama (preserve)
			guarantee_type: clean_guarantee_type, // Dari form
			deposit_amount, // Dari data lama (preserve)
			notes: clean_notes // Dari form
		};
		const notesJson = JSON.stringify(notesObj);

		try {
			// 7. Update data pelanggan di database
			await customerModel.updateCustomer(supabase, id, {
				full_name: clean_full_name,
				phone: clean_phone || null,
				email: clean_email || null,
				address: clean_address || null,
				notes: notesJson
			});

			// 8. Catat activity log
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
	 * Proses form HAPUS pelanggan.
	 *
	 * ALUR:
	 * 1. Validasi ID ada
	 * 2. Ambil data pelanggan dulu (untuk activity log setelah hapus)
	 * 3. Hapus dari database
	 * 4. Catat activity log
	 *
	 * MENGAPA ambil data sebelum hapus?
	 *   Setelah dihapus, data sudah tidak ada di database.
	 *   Kita perlu nama pelanggan SEBELUM dihapus untuk mengisi metadata activity log.
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
			// Ambil data pelanggan dulu untuk keperluan log (nama, cabang)
			const customer = await customerModel.getCustomerDetails(supabase, id);

			// Hapus dari database
			await customerModel.deleteCustomer(supabase, id);

			// Catat log (hanya jika data pelanggan berhasil diambil sebelumnya)
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
