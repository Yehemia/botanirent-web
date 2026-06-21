/**
 * ============================================================
 * FILE: packageController.js
 * TUJUAN: Logic bisnis untuk halaman Packages (manajemen paket sewa).
 *
 * FITUR:
 *   1. Lihat daftar paket (getPackages)
 *   2. Siapkan data form tambah paket (getNewPackageData)
 *   3. Buat paket baru + upload gambar (createPackage)
 *
 * POLA ROLLBACK MANUAL:
 *   Karena JavaScript tidak punya built-in "database transaction",
 *   kita perlu tangani kegagalan secara manual:
 *
 *   [OK] insertPackage → dapat ID paket baru
 *   [GAGAL] insertPackageItems → ERROR!
 *   → Kita DELETE paket yang baru dibuat (rollback manual)
 *   → Sehingga tidak ada paket "setengah jadi" di database
 *
 * KONSEP UPLOAD GAMBAR KE SUPABASE STORAGE:
 *   1. Buat nama file unik: 'packages/{branch}/{timestamp}-{random}.{ext}'
 *   2. Upload file ke bucket 'item-images'
 *   3. Dapatkan URL publik gambar → simpan URL ini ke database
 * ============================================================
 */

import { packageModel } from '../models/packageModel.js';
import { itemModel } from '../models/itemModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const packageController = {
	/**
	 * Ambil semua paket untuk ditampilkan di halaman.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getPackages(supabase, profile) {
		const packages = await packageModel.getPackages(supabase, profile.branch_id);
		return {
			packages
		};
	},

	/**
	 * Siapkan data untuk form tambah paket baru.
	 * Butuh daftar item sewa yang aktif untuk memilih isi paket.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string }} profile
	 */
	async getNewPackageData(supabase, profile) {
		const availableItems = await itemModel.getActiveSewaItems(supabase, profile.branch_id);
		return {
			availableItems // Item sewa aktif yang bisa dimasukkan ke paket
		};
	},

	/**
	 * Buat paket baru dengan item-itemnya dan gambar (opsional).
	 *
	 * ALUR DETAIL:
	 * 1. Validasi input (nama, harga, item wajib ada)
	 * 2. Parse items_json (dikirim sebagai JSON string dari form)
	 * 3. Upload gambar ke Supabase Storage jika ada
	 * 4. Insert header paket → dapat ID baru
	 * 5. Insert detail item-item paket
	 *    - Jika gagal → DELETE paket yang baru dibuat (rollback manual)
	 * 6. Catat activity log
	 * 7. Redirect ke halaman daftar paket
	 *
	 * MENGAPA items dikirim sebagai JSON string?
	 *   FormData HTML tidak bisa mengirim array objek langsung.
	 *   Solusinya: convert array ke JSON string di frontend, parse kembali di server.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string }} profile
	 * @param {FormData} formData
	 */
	async createPackage(supabase, profile, formData) {
		const name = formData.get('name');
		const description = formData.get('description');
		const package_price = formData.get('package_price');
		const items_json = formData.get('items_json'); // JSON string dari frontend
		const image = formData.get('image'); // File gambar (opsional)

		// 1. Validasi field wajib
		if (!name || !package_price || !items_json) {
			return {
				success: false,
				status: 400,
				error: 'Nama paket, harga, dan minimal 1 barang wajib diisi.',
				values: Object.fromEntries(formData) // Kembalikan nilai form agar tidak hilang
			};
		}

		// 2. Parse items_json → array objek item
		let parsedItems = [];
		try {
			parsedItems = JSON.parse(items_json.toString());
		} catch (e) {
			return {
				success: false,
				status: 400,
				error: 'Format data barang tidak valid.',
				values: Object.fromEntries(formData)
			};
		}

		if (parsedItems.length === 0) {
			return {
				success: false,
				status: 400,
				error: 'Paket harus berisi minimal 1 barang.',
				values: Object.fromEntries(formData)
			};
		}

		// 3. Upload gambar ke Supabase Storage (jika ada file yang dikirim)
		let image_url = null;

		// Cek apakah image adalah file (bukan string kosong)
		if (image && typeof image !== 'string' && image.size > 0) {
			// Generate nama file unik untuk menghindari konflik
			const fileExt = image.name.split('.').pop(); // Ekstensi file (jpg, png, dll)
			const fileName = `packages/${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			// Contoh: packages/uuid-cabang/1749518400000-abc123.jpg

			// Upload ke bucket 'item-images' di Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from('item-images') // Nama bucket
				.upload(fileName, image, { cacheControl: '3600' }); // Cache browser 1 jam

			if (!uploadError) {
				// Dapatkan URL publik gambar (bisa diakses siapa saja)
				const {
					data: { publicUrl }
				} = supabase.storage.from('item-images').getPublicUrl(fileName);
				image_url = publicUrl; // Simpan URL untuk dimasukkan ke database
			} else {
				console.error('Storage upload error during package creation:', uploadError);
				return {
					success: false,
					status: 500,
					error: 'Gagal mengunggah gambar paket.',
					values: Object.fromEntries(formData)
				};
			}
		}

		// 4. Insert header paket ke database
		let newPackage;
		try {
			newPackage = await packageModel.insertPackage(supabase, {
				branch_id: profile.branch_id,
				name: name.toString(),
				description: description ? description.toString() : null,
				package_price: parseFloat(package_price.toString()), // Konversi ke angka
				image_url: image_url, // null jika tidak ada gambar
				is_active: true // Paket baru langsung aktif
			});
		} catch (err) {
			console.error('Failed to insert package in controller:', err);
			return {
				success: false,
				status: 500,
				error: 'Gagal menyimpan paket.',
				values: Object.fromEntries(formData)
			};
		}

		// 5. Insert detail item-item paket
		try {
			// Map array parsedItems ke format yang dibutuhkan database
			const packageItemsData = parsedItems.map(
				/** @param {any} item @param {number} index */ (item, index) => ({
					package_id: newPackage.id, // Hubungkan ke paket yang baru dibuat
					item_id: item.id,
					quantity: parseInt(item.quantity, 10),
					sort_order: index // Urutan tampil item di paket
				})
			);

			await packageModel.insertPackageItems(supabase, packageItemsData);
		} catch (err) {
			console.error('Failed to insert package items in controller, initiating rollback:', err);

			// ROLLBACK MANUAL: Hapus paket yang baru dibuat karena item-nya gagal disimpan
			try {
				await packageModel.deletePackage(supabase, newPackage.id);
			} catch (rollbackErr) {
				// Jika rollback juga gagal, catat untuk debugging
				console.error('Rollback failed for package ID:', newPackage.id, rollbackErr);
			}

			return {
				success: false,
				status: 500,
				error: 'Gagal menyimpan isi paket.',
				values: Object.fromEntries(formData)
			};
		}

		// 6. Catat activity log
		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: 'package_created',
			entityType: 'package',
			entityId: newPackage.id,
			metadata: { name: newPackage.name, items_count: parsedItems.length }
		});

		// 7. Redirect ke halaman daftar paket
		return {
			success: true,
			redirect: '/packages'
		};
	}
};
