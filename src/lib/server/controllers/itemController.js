/**
 * ============================================================
 * FILE: itemController.js
 * TUJUAN: Logic bisnis untuk manajemen JENIS BARANG di inventory.
 *
 * FITUR:
 *   1. Lihat detail satu item (getItemDetails)
 *   2. Tambah item baru + generate unit fisik (createItem)
 *   3. Edit item + sinkronisasi stok (updateItem)
 *   4. Import massal dari file Excel (bulkUpload)
 *
 * KONSEP GENERATE KODE ASSET OTOMATIS:
 *   Setiap item sewa punya kode barcode (contoh: BTN-AB1234)
 *   Setiap unit fisik dapat kode: BTN-AB1234-A, BTN-AB1234-B, BTN-AB1234-C, ...
 *   Fungsi getLetterSuffix() menghasilkan suffix A, B, ..., Z, AA, AB, ...
 *
 * KONSEP SINKRONISASI STOK:
 *   stok bertambah → buat unit fisik baru (asset)
 *   stok berkurang → hapus unit fisik yang 'ready' (tidak sedang disewa)
 *   Tidak bisa mengurangi stok yang sedang disewa/maintenance!
 *
 * KONSEP IMPORT EXCEL:
 *   Library 'xlsx' membaca file Excel menjadi array baris.
 *   Setiap baris adalah satu item baru yang akan dimasukkan ke database.
 * ============================================================
 */

import { itemModel } from '../models/itemModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { assetModel } from '../models/assetModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import * as xlsx from 'xlsx'; // Library untuk baca/tulis file Excel

/**
 * FUNGSI HELPER: Generate suffix huruf secara berurutan.
 * index 0 → "A", index 1 → "B", ..., index 25 → "Z"
 * index 26 → "AA", index 27 → "AB", dst.
 *
 * Dipakai untuk membuat kode unit fisik yang unik.
 * Contoh: Tenda BTN-AB1234 punya unit A, B, C, ...
 *
 * CARA KERJA (contoh index=27 → "AB"):
 *   temp=27: 27 % 26 = 1 → 'B', suffix="B", temp = floor(27/26) - 1 = 0
 *   temp=0:  0  % 26 = 0 → 'A', suffix="AB", temp = floor(0/26) - 1 = -1
 *   temp < 0 → stop
 *
 * @param {number} index
 * @returns {string}
 */
const getLetterSuffix = (index) => {
	let suffix = '';
	let temp = index;
	while (temp >= 0) {
		// Karakter ke-n dalam alfabet (65 = kode ASCII 'A')
		suffix = String.fromCharCode((temp % 26) + 65) + suffix;
		temp = Math.floor(temp / 26) - 1;
	}
	return suffix;
};

export const itemController = {
	/**
	 * Ambil detail item untuk halaman edit.
	 *
	 * KEAMANAN AKSES:
	 *   Owner → bisa lihat/edit item dari semua cabang
	 *   Kasir/Gudang → hanya bisa akses item dari cabangnya sendiri
	 *   Jika item milik cabang lain → redirect ke /inventory
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 * @param {string} id - ID item
	 */
	async getItemDetails(supabase, profile, id) {
		const item = await itemModel.getItemDetails(supabase, id);

		if (!item) {
			return { success: false, redirect: '/inventory' };
		}

		// Cek akses: non-owner hanya boleh akses item dari cabangnya sendiri
		if (profile.role !== 'owner' && item.branch_id !== profile.branch_id) {
			return { success: false, redirect: '/inventory' };
		}

		const categories = await categoryModel.getCategories(supabase);

		return {
			success: true,
			item,
			categories
		};
	},

	/**
	 * Tambah item baru ke inventaris.
	 *
	 * ALUR:
	 * 1. Validasi input wajib (nama, kategori)
	 * 2. Ambil detail kategori (untuk tahu tipe: sewa/retail)
	 * 3. Validasi harga sesuai tipe (sewa → butuh harga sewa; retail → butuh harga jual)
	 * 4. Generate barcode otomatis (BTN-XXXXXX)
	 * 5. Upload gambar ke Supabase Storage jika ada
	 * 6. Insert item ke database
	 * 7. Jika tipe sewa → generate unit fisik (asset) sesuai jumlah stok
	 * 8. Catat activity log
	 *
	 * GENERATE BARCODE:
	 *   Math.random().toString(36).substring(2, 8).toUpperCase()
	 *   → string acak base36 (0-9 + a-z), ambil 6 karakter, konversi ke uppercase
	 *   Contoh: "BTN-AB1CD2"
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null, id: string }} profile
	 * @param {FormData} formData
	 */
	async createItem(supabase, profile, formData) {
		const name = formData.get('name');
		const description = formData.get('description');
		const category_id = formData.get('category_id');
		const rental_price_per_day = formData.get('rental_price_per_day');
		const sell_price = formData.get('sell_price');
		const stock_total = parseInt(formData.get('stock_total')?.toString() || '0', 10);
		const image = formData.get('image'); // File upload opsional

		// 1. Validasi field wajib
		if (!name || !category_id) {
			return {
				success: false,
				status: 400,
				error: 'Nama dan kategori wajib diisi.',
				values: Object.fromEntries(formData)
			};
		}

		// 2. Ambil tipe kategori (sewa atau retail)
		let category;
		try {
			const { data } = await supabase
				.from('categories')
				.select('type')
				.eq('id', category_id)
				.single();
			category = data;
		} catch (err) {
			console.error('Error loading category in controller:', err);
		}

		if (!category) {
			return {
				success: false,
				status: 400,
				error: 'Kategori tidak valid.',
				values: Object.fromEntries(formData)
			};
		}

		// 3. Validasi harga sesuai tipe kategori
		if (category.type === 'sewa' && !rental_price_per_day) {
			return {
				success: false,
				status: 400,
				error: 'Harga sewa per hari wajib diisi untuk barang sewa.',
				values: Object.fromEntries(formData)
			};
		}
		if (category.type === 'retail' && !sell_price) {
			return {
				success: false,
				status: 400,
				error: 'Harga jual wajib diisi untuk barang retail.',
				values: Object.fromEntries(formData)
			};
		}

		// 4. Generate barcode otomatis: "BTN-AB1CD2"
		const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
		const barcode = `BTN-${randomStr}`;

		// 5. Upload gambar ke Supabase Storage jika ada
		let image_url = null;

		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			// Nama file unik: "{branch_id}/{timestamp}-{random}.{ext}"
			const fileName = `${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

			try {
				const { error: uploadError } = await supabase.storage
					.from('item-images')
					.upload(fileName, image, {
						cacheControl: '3600', // Cache browser 1 jam
						upsert: false // Jangan override jika nama sama (gunakan nama unik)
					});

				if (uploadError) {
					console.error('Upload error:', uploadError);
					return {
						success: false,
						status: 500,
						error: 'Gagal mengunggah gambar. Pastikan Anda sudah menjalankan script setup storage.',
						values: Object.fromEntries(formData)
					};
				}

				// Dapatkan URL publik dari file yang sudah di-upload
				const {
					data: { publicUrl }
				} = supabase.storage.from('item-images').getPublicUrl(fileName);

				image_url = publicUrl;
			} catch (err) {
				console.error('Storage upload error:', err);
				return {
					success: false,
					status: 500,
					error: 'Gagal mengunggah gambar.',
					values: Object.fromEntries(formData)
				};
			}
		}

		try {
			// 6. Insert item baru ke database
			const newItem = await itemModel.insertItem(supabase, {
				branch_id: profile.branch_id,
				category_id: category_id.toString(),
				name: name.toString(),
				description: description ? description.toString() : null,
				barcode,
				image_url,
				rental_price_per_day: rental_price_per_day
					? parseFloat(rental_price_per_day.toString())
					: null,
				sell_price: sell_price ? parseFloat(sell_price.toString()) : null,
				stock_total,
				stock_available: stock_total, // Stok awal = stok total (belum ada yang disewa)
				is_active: true
			});

			// 7. Jika item tipe sewa, generate unit fisik (assets) otomatis
			if (category.type === 'sewa' && stock_total > 0) {
				const newAssets = [];
				for (let i = 0; i < stock_total; i++) {
					newAssets.push({
						item_id: newItem.id,
						// Kode unit: "BTN-AB1CD2-A", "BTN-AB1CD2-B", dst
						asset_code: `${barcode}-${getLetterSuffix(i)}`,
						status: 'ready' // Semua unit baru langsung 'ready' (siap disewa)
					});
				}

				try {
					await assetModel.insertAssets(supabase, newAssets);
				} catch (assetsError) {
					// Jika generate assets gagal, item sudah tersimpan tapi tanpa unit fisik
					// Catat error tapi tidak batalkan — admin bisa tambah unit manual nanti
					console.error('Insert assets error:', assetsError);
				}
			}

			// 8. Catat activity log
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: profile.branch_id,
				action: 'item_added',
				entityType: 'item',
				entityId: newItem.id,
				metadata: { name: newItem.name, barcode: newItem.barcode }
			});

			return { success: true, redirect: '/inventory' };
		} catch (error) {
			console.error('Error creating item in controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal menyimpan data barang.',
				values: Object.fromEntries(formData)
			};
		}
	},

	/**
	 * Update item yang sudah ada + sinkronisasi stok fisik.
	 *
	 * BAGIAN PALING KOMPLEKS: SINKRONISASI STOK
	 *
	 * Kasus 1: stockDiff < 0 (stok BERKURANG)
	 *   Item sewa → Harus ada cukup unit 'ready' untuk dihapus.
	 *               Unit yang sedang disewa/maintenance TIDAK BISA dihapus.
	 *   Item retail → Validasi stock_available tidak boleh jadi negatif.
	 *
	 * Kasus 2: stockDiff > 0 (stok BERTAMBAH)
	 *   Item sewa → Generate unit fisik baru dengan kode yang belum ada.
	 *               Loop terus sampai dapat kode unik (skip kode yang sudah terpakai).
	 *   Item retail → Tidak perlu buat asset fisik.
	 *
	 * KONSEP stock_available vs stock_total:
	 *   stock_total     = jumlah unit yang dimiliki (termasuk yang disewa/maintenance)
	 *   stock_available = jumlah unit yang TERSEDIA SEKARANG (belum disewa)
	 *   stockDiff = stock_total_baru - stock_total_lama
	 *   stock_available_baru = stock_available_lama + stockDiff
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string, branch_id: string|null }} profile
	 * @param {string} id - ID item yang diedit
	 * @param {FormData} formData
	 */
	async updateItem(supabase, profile, id, formData) {
		// Ambil data item lama (untuk perbandingan stok dan keamanan cabang)
		const oldItem = await itemModel.getItemDetails(supabase, id);

		if (!oldItem) {
			return { success: false, status: 404, error: 'Barang tidak ditemukan.' };
		}

		// Cek akses cabang
		if (profile.role !== 'owner' && oldItem.branch_id !== profile.branch_id) {
			return { success: false, status: 403, error: 'Akses ditolak. Barang ini milik cabang lain.' };
		}

		const name = formData.get('name');
		const description = formData.get('description');
		const category_id = formData.get('category_id');
		const rental_price_per_day = formData.get('rental_price_per_day');
		const sell_price = formData.get('sell_price');
		const stock_total = parseInt(formData.get('stock_total')?.toString() || '0', 10);
		const is_active_str = formData.get('is_active');
		const is_active = is_active_str === 'true'; // Konversi string ke boolean
		const image = formData.get('image');

		if (!name || !category_id) {
			return {
				success: false,
				status: 400,
				error: 'Nama dan kategori wajib diisi.',
				values: Object.fromEntries(formData)
			};
		}

		// Ambil tipe kategori
		let category;
		try {
			const { data } = await supabase
				.from('categories')
				.select('type')
				.eq('id', category_id)
				.single();
			category = data;
		} catch (err) {
			console.error('Error loading category in controller:', err);
		}

		if (!category) {
			return {
				success: false,
				status: 400,
				error: 'Kategori tidak valid.',
				values: Object.fromEntries(formData)
			};
		}

		// Validasi harga sesuai tipe
		if (category.type === 'sewa' && !rental_price_per_day) {
			return {
				success: false,
				status: 400,
				error: 'Harga sewa per hari wajib diisi untuk barang sewa.',
				values: Object.fromEntries(formData)
			};
		}
		if (category.type === 'retail' && !sell_price) {
			return {
				success: false,
				status: 400,
				error: 'Harga jual wajib diisi untuk barang retail.',
				values: Object.fromEntries(formData)
			};
		}

		// Pertahankan URL gambar lama jika tidak ada gambar baru
		let image_url = oldItem.image_url;

		// Upload gambar baru jika ada
		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `${oldItem.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

			try {
				const { error: uploadError } = await supabase.storage
					.from('item-images')
					.upload(fileName, image, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) {
					console.error('Upload error:', uploadError);
					return {
						success: false,
						status: 500,
						error: 'Gagal mengunggah gambar baru.',
						values: Object.fromEntries(formData)
					};
				}

				const {
					data: { publicUrl }
				} = supabase.storage.from('item-images').getPublicUrl(fileName);

				image_url = publicUrl; // Ganti dengan URL gambar baru
			} catch (err) {
				console.error('Storage upload error:', err);
				return {
					success: false,
					status: 500,
					error: 'Gagal mengunggah gambar.',
					values: Object.fromEntries(formData)
				};
			}
		}

		// Hitung perubahan stok
		const stockDiff = stock_total - oldItem.stock_total; // Positif = nambah, negatif = berkurang
		const new_stock_available = oldItem.stock_available + stockDiff;

		try {
			// --- KASUS 1: STOK BERKURANG ---
			if (stockDiff < 0) {
				if (category.type === 'sewa') {
					// Item sewa: hapus unit fisik yang 'ready' (tidak sedang digunakan)
					const readyAssets = await assetModel.getReadyAssetsForItem(supabase, id);
					const toDeleteCount = Math.abs(stockDiff); // Berapa unit yang harus dihapus

					// Validasi: cukupkah unit 'ready' untuk dihapus?
					if (readyAssets.length < toDeleteCount) {
						return {
							success: false,
							status: 400,
							error: `Gagal mengurangi stok. Hanya ada ${readyAssets.length} unit yang siap ('ready') untuk dihapus, sedangkan Anda ingin mengurangi ${toDeleteCount} unit. Harap tunggu hingga unit lain selesai disewa atau selesai maintenance.`,
							values: Object.fromEntries(formData)
						};
					}

					// Hapus unit yang berlebih (ambil dari yang pertama)
					const assetIdsToDelete = readyAssets.slice(0, toDeleteCount).map((a) => a.id);
					await assetModel.deleteAssetsByIds(supabase, assetIdsToDelete);
				} else {
					// Item retail: cek stock_available tidak negatif
					if (new_stock_available < 0) {
						return {
							success: false,
							status: 400,
							error: `Gagal mengurangi stok. Stok tersedia saat ini (${oldItem.stock_available}) kurang dari jumlah pengurangan stok (${Math.abs(stockDiff)}).`,
							values: Object.fromEntries(formData)
						};
					}
				}
			}

			// --- KASUS 2: STOK BERTAMBAH (item sewa) ---
			if (stockDiff > 0 && category.type === 'sewa') {
				// Ambil semua kode asset yang sudah ada (untuk menghindari duplikat)
				const existingAssets = await assetModel.getExistingAssetsForItem(supabase, id);
				const existingCodes = new Set(existingAssets.map((a) => a.asset_code));

				const newAssets = [];
				let idx = 0;

				// Generate kode baru sampai dapat jumlah yang dibutuhkan
				while (newAssets.length < stockDiff) {
					const code = `${oldItem.barcode}-${getLetterSuffix(idx)}`;
					// Skip kode yang sudah ada (mungkin ada gap karena unit yang pernah dihapus)
					if (!existingCodes.has(code)) {
						newAssets.push({
							item_id: id,
							asset_code: code,
							status: 'ready'
						});
					}
					idx++;
				}

				await assetModel.insertAssets(supabase, newAssets);
			}

			// Update data item di database
			await itemModel.updateItem(supabase, id, {
				category_id: category_id.toString(),
				name: name.toString(),
				description: description ? description.toString() : null,
				image_url,
				rental_price_per_day:
					category.type === 'sewa' ? parseFloat(rental_price_per_day?.toString() || '0') : null,
				sell_price: category.type === 'retail' ? parseFloat(sell_price?.toString() || '0') : null,
				stock_total,
				stock_available: new_stock_available,
				is_active
			});

			// Catat activity log
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: oldItem.branch_id,
				action: 'item_updated',
				entityType: 'item',
				entityId: id,
				metadata: {
					name,
					barcode: oldItem.barcode,
					stock_total,
					stock_available: new_stock_available
				}
			});

			return { success: true, redirect: '/inventory' };
		} catch (error) {
			console.error('Error in updateItem controller:', error);
			return {
				success: false,
				status: 500,
				error: 'Gagal memperbarui data barang.',
				values: Object.fromEntries(formData)
			};
		}
	},

	/**
	 * Import massal item dari file Excel (.xlsx atau .csv).
	 *
	 * FORMAT EXCEL YANG DIHARAPKAN:
	 *   Baris 1 = Header (diabaikan)
	 *   Baris 2+ = Data item:
	 *   [nama, deskripsi, category_id, harga_sewa, harga_jual, stok]
	 *
	 * ALUR:
	 * 1. Validasi file ada dan tidak kosong
	 * 2. Parse Excel dengan library 'xlsx'
	 * 3. Validasi setiap baris (nama, category_id wajib; category_id harus ada di DB)
	 * 4. Kumpulkan error jika ada (tidak langsung gagal — tampilkan semua error sekaligus)
	 * 5. Jika ada error → return error list tanpa insert apapun
	 * 6. Jika semua valid → bulk insert ke database
	 *
	 * KONSEP BULK INSERT:
	 *   Lebih efisien daripada insert satu-satu dalam loop.
	 *   Satu query untuk semua baris sekaligus.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {any} file - File object dari FormData
	 */
	async bulkUpload(supabase, profile, file) {
		if (!file || typeof file === 'string' || file.size === 0) {
			return { success: false, status: 400, error: 'Silakan pilih file Excel terlebih dahulu.' };
		}

		try {
			// 2. Parse file Excel
			const arrayBuffer = await file.arrayBuffer(); // Baca file sebagai binary
			const workbook = xlsx.read(arrayBuffer, { type: 'buffer' }); // Parse Excel
			const sheetName = workbook.SheetNames[0]; // Ambil sheet pertama
			const worksheet = workbook.Sheets[sheetName];

			// Konversi sheet ke array 2D: [[baris1col1, baris1col2, ...], [baris2col1, ...], ...]
			const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

			if (rows.length <= 1) {
				return {
					success: false,
					status: 400,
					error: 'File Excel kosong atau hanya berisi header.'
				};
			}

			// Ambil semua kategori untuk validasi
			const categories = await categoryModel.getCategories(supabase);
			// Map untuk lookup cepat: category_id → tipe ('sewa' atau 'retail')
			const catMap = new Map(categories.map((c) => [c.id, c.type]));

			const insertData = []; // Data yang valid untuk diinsert
			const errors = []; // Kumpulan error dari baris yang tidak valid

			// 3. Validasi setiap baris (mulai dari baris 2, index 1 → skip header)
			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];

				// Skip baris kosong
				if (
					!row ||
					row.length === 0 ||
					row.every(
						/** @param {any} cell */ (cell) => cell === null || cell === undefined || cell === ''
					)
				) {
					continue;
				}

				// Destructuring: ambil kolom sesuai urutan
				const [name, description, category_id, rental_price, sell_price, stock] = row;

				if (!name || !category_id) {
					errors.push(`Baris ${i + 1}: Nama dan ID Kategori wajib diisi.`);
					continue;
				}

				// Validasi: category_id harus ada di database
				if (!catMap.has(category_id)) {
					errors.push(`Baris ${i + 1}: ID Kategori "${category_id}" tidak ditemukan di database.`);
					continue;
				}

				const catType = catMap.get(category_id);
				// Generate barcode unik untuk setiap item
				const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
				const barcode = `BTN-${randomStr}`;

				insertData.push({
					branch_id: profile.branch_id,
					category_id: category_id,
					name: name.toString(),
					description: description ? description.toString() : null,
					barcode: barcode,
					rental_price_per_day: catType === 'sewa' ? parseFloat(rental_price) || 0 : null,
					sell_price: catType === 'retail' ? parseFloat(sell_price) || 0 : null,
					stock_total: parseInt(stock) || 0,
					stock_available: parseInt(stock) || 0,
					is_active: true
				});
			}

			// 4. Jika ada baris yang error, kembalikan semua error
			if (errors.length > 0) {
				return {
					success: false,
					status: 400,
					error: 'Terdapat error pada file Excel Anda:\n' + errors.join('\n')
				};
			}

			if (insertData.length === 0) {
				return { success: false, status: 400, error: 'Tidak ada data valid yang bisa dimasukkan.' };
			}

			// 5. Bulk insert semua data valid sekaligus
			await itemModel.bulkInsertItems(supabase, insertData);

			// Catat activity log (satu log untuk seluruh import)
			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: profile.branch_id,
				action: 'item_added',
				entityType: 'bulk_upload',
				entityId: profile.branch_id || 'all',
				metadata: { count: insertData.length } // Berapa item yang berhasil diimport
			});

			return { success: true, count: insertData.length };
		} catch (error) {
			console.error('Parse excel error in controller:', error);
			return {
				success: false,
				status: 500,
				error:
					'Gagal memproses file Excel. Pastikan file tidak corrupt dan menggunakan format .xlsx atau .csv.'
			};
		}
	}
};
