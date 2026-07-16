import { itemModel } from '../models/itemModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { assetModel } from '../models/assetModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import * as xlsx from 'xlsx';

/**
 * Generate suffix huruf secara berurutan.
 *
 * @param {number} index
 * @returns {string}
 */
const getLetterSuffix = (index) => {
	let suffix = '';
	let temp = index;
	while (temp >= 0) {
		suffix = String.fromCharCode((temp % 26) + 65) + suffix;
		temp = Math.floor(temp / 26) - 1;
	}
	return suffix;
};

export const itemController = {
	/**
	 * Ambil detail item untuk halaman edit.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string, branch_id: string|null }} profile
	 * @param {string} id
	 */
	async getItemDetails(supabase, profile, id) {
		const item = await itemModel.getItemDetails(supabase, id);

		if (!item) {
			return { success: false, redirect: '/inventory' };
		}

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
		const image = formData.get('image');

		if (!name || !category_id) {
			return {
				success: false,
				status: 400,
				error: 'Nama dan kategori wajib diisi.',
				values: Object.fromEntries(formData)
			};
		}

		const nameTrimmed = name.toString().trim();

		try {
			const { data: existingItem, error: checkError } = await supabase
				.from('items')
				.select('id')
				.eq('branch_id', profile.branch_id)
				.ilike('name', nameTrimmed)
				.maybeSingle();

			if (checkError) throw checkError;

			if (existingItem) {
				return {
					success: false,
					status: 400,
					error: `Barang dengan nama "${nameTrimmed}" sudah terdaftar di cabang ini.`,
					values: Object.fromEntries(formData)
				};
			}
		} catch (err) {
			console.error('Error checking duplicate item name in createItem:', err);
			return {
				success: false,
				status: 500,
				error: 'Gagal memvalidasi nama barang.',
				values: Object.fromEntries(formData)
			};
		}

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

		const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
		const barcode = `BTN-${randomStr}`;

		let image_url = null;

		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

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
						error: 'Gagal mengunggah gambar. Pastikan Anda sudah menjalankan script setup storage.',
						values: Object.fromEntries(formData)
					};
				}

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
				stock_available: stock_total,
				is_active: true
			});

			if (category.type === 'sewa' && stock_total > 0) {
				const newAssets = [];
				for (let i = 0; i < stock_total; i++) {
					newAssets.push({
						item_id: newItem.id,
						asset_code: `${barcode}-${getLetterSuffix(i)}`,
						status: 'ready'
					});
				}

				try {
					await assetModel.insertAssets(supabase, newAssets);
				} catch (assetsError) {
					console.error('Insert assets error:', assetsError);
				}
			}

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
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string, branch_id: string|null }} profile
	 * @param {string} id
	 * @param {FormData} formData
	 */
	async updateItem(supabase, profile, id, formData) {
		const oldItem = await itemModel.getItemDetails(supabase, id);

		if (!oldItem) {
			return { success: false, status: 404, error: 'Barang tidak ditemukan.' };
		}

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
		const is_active = is_active_str === 'true';
		const image = formData.get('image');

		if (!name || !category_id) {
			return {
				success: false,
				status: 400,
				error: 'Nama dan kategori wajib diisi.',
				values: Object.fromEntries(formData)
			};
		}

		const nameTrimmed = name.toString().trim();

		try {
			const { data: existingItem, error: checkError } = await supabase
				.from('items')
				.select('id')
				.eq('branch_id', oldItem.branch_id)
				.ilike('name', nameTrimmed)
				.neq('id', id)
				.maybeSingle();

			if (checkError) throw checkError;

			if (existingItem) {
				return {
					success: false,
					status: 400,
					error: `Barang dengan nama "${nameTrimmed}" sudah terdaftar di cabang ini.`,
					values: Object.fromEntries(formData)
				};
			}
		} catch (err) {
			console.error('Error checking duplicate item name in updateItem:', err);
			return {
				success: false,
				status: 500,
				error: 'Gagal memvalidasi nama barang.',
				values: Object.fromEntries(formData)
			};
		}

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

		let image_url = oldItem.image_url;

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

		const stockDiff = stock_total - oldItem.stock_total;
		const new_stock_available = oldItem.stock_available + stockDiff;

		try {
			if (stockDiff < 0) {
				if (category.type === 'sewa') {
					const readyAssets = await assetModel.getReadyAssetsForItem(supabase, id);
					const toDeleteCount = Math.abs(stockDiff);

					if (readyAssets.length < toDeleteCount) {
						return {
							success: false,
							status: 400,
							error: `Gagal mengurangi stok. Hanya ada ${readyAssets.length} unit yang siap ('ready') untuk dihapus, sedangkan Anda ingin mengurangi ${toDeleteCount} unit. Harap tunggu hingga unit lain selesai disewa atau selesai maintenance.`,
							values: Object.fromEntries(formData)
						};
					}

					const assetIdsToDelete = readyAssets.slice(0, toDeleteCount).map((a) => a.id);
					await assetModel.deleteAssetsByIds(supabase, assetIdsToDelete);
				} else {
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

			if (stockDiff > 0 && category.type === 'sewa') {
				const existingAssets = await assetModel.getExistingAssetsForItem(supabase, id);
				const existingCodes = new Set(existingAssets.map((a) => a.asset_code));

				const newAssets = [];
				let idx = 0;

				while (newAssets.length < stockDiff) {
					const code = `${oldItem.barcode}-${getLetterSuffix(idx)}`;
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
	 * Import massal item dari file Excel.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {any} file
	 */
	async bulkUpload(supabase, profile, file) {
		if (!file || typeof file === 'string' || file.size === 0) {
			return { success: false, status: 400, error: 'Silakan pilih file Excel terlebih dahulu.' };
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

			if (rows.length <= 1) {
				return {
					success: false,
					status: 400,
					error: 'File Excel kosong atau hanya berisi header.'
				};
			}

			const categories = await categoryModel.getCategories(supabase);
			const catMap = new Map(categories.map((c) => [c.id, c.type]));

			let existingNames = new Set();
			try {
				const { data: items, error: fetchError } = await supabase
					.from('items')
					.select('name')
					.eq('branch_id', profile.branch_id);
				if (fetchError) throw fetchError;
				existingNames = new Set((items || []).map((it) => it.name.trim().toLowerCase()));
			} catch (err) {
				console.error('Error fetching existing item names in bulkUpload:', err);
				return {
					success: false,
					status: 500,
					error: 'Gagal memvalidasi database untuk bulk upload.'
				};
			}

			const processedNames = new Set();
			const insertData = [];
			const errors = [];

			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];

				if (
					!row ||
					row.length === 0 ||
					row.every(
						/** @param {any} cell */ (cell) => cell === null || cell === undefined || cell === ''
					)
				) {
					continue;
				}

				const [name, description, category_id, rental_price, sell_price, stock] = row;

				if (!name || !category_id) {
					errors.push(`Baris ${i + 1}: Nama dan ID Kategori wajib diisi.`);
					continue;
				}

				const nameTrimmed = name.toString().trim();
				const nameLower = nameTrimmed.toLowerCase();

				if (existingNames.has(nameLower)) {
					errors.push(
						`Baris ${i + 1}: Barang dengan nama "${nameTrimmed}" sudah terdaftar di cabang ini.`
					);
					continue;
				}

				if (processedNames.has(nameLower)) {
					errors.push(`Baris ${i + 1}: Duplikat nama barang "${nameTrimmed}" di dalam file Excel.`);
					continue;
				}

				processedNames.add(nameLower);

				if (!catMap.has(category_id)) {
					errors.push(`Baris ${i + 1}: ID Kategori "${category_id}" tidak ditemukan di database.`);
					continue;
				}

				const catType = catMap.get(category_id);
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

			const insertedItems = await itemModel.bulkInsertItems(supabase, insertData);

			// Generate and insert rental assets for rental ('sewa') items
			const newAssets = [];
			for (const item of insertedItems) {
				const isSewa = catMap.get(item.category_id) === 'sewa';
				if (isSewa && item.stock_total > 0) {
					for (let i = 0; i < item.stock_total; i++) {
						newAssets.push({
							item_id: item.id,
							asset_code: `${item.barcode}-${getLetterSuffix(i)}`,
							status: 'ready'
						});
					}
				}
			}

			if (newAssets.length > 0) {
				try {
					await assetModel.insertAssets(supabase, newAssets);
				} catch (assetsError) {
					console.error('Insert assets error in bulk upload:', assetsError);
				}
			}

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: profile.branch_id,
				action: 'item_added',
				entityType: 'bulk_upload',
				entityId: profile.branch_id || 'all',
				metadata: { count: insertData.length }
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
	},

	/**
	 * Nonaktifkan item sewa/retail (is_active = false)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string, branch_id: string|null }} profile
	 * @param {string} id
	 */
	async deactivateItem(supabase, profile, id) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			const item = await itemModel.getItemDetails(supabase, id);
			if (!item) {
				return { success: false, status: 404, error: 'Barang tidak ditemukan.' };
			}

			if (profile.role !== 'owner' && item.branch_id !== profile.branch_id) {
				return {
					success: false,
					status: 403,
					error: 'Akses ditolak. Barang ini milik cabang lain.'
				};
			}

			await itemModel.updateItem(supabase, id, { is_active: false });

			// Reset all physical asset statuses to 'ready' so they aren't stuck in 'rented'
			await supabase
				.from('rental_assets')
				.update({ status: 'ready', last_status_change: new Date().toISOString() })
				.eq('item_id', id);

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: item.branch_id,
				action: 'item_updated',
				entityType: 'item',
				entityId: id,
				metadata: { name: item.name, barcode: item.barcode, is_active: false }
			});

			return { success: true };
		} catch (error) {
			console.error('Error deactivating item in controller:', error);
			return { success: false, status: 500, error: 'Gagal menonaktifkan barang.' };
		}
	},

	/**
	 * Aktifkan kembali item sewa/retail (is_active = true)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, role: string, branch_id: string|null }} profile
	 * @param {string} id
	 */
	async activateItem(supabase, profile, id) {
		if (!id) {
			return { success: false, status: 400, error: 'ID tidak valid' };
		}

		try {
			const item = await itemModel.getItemDetails(supabase, id);
			if (!item) {
				return { success: false, status: 404, error: 'Barang tidak ditemukan.' };
			}

			if (profile.role !== 'owner' && item.branch_id !== profile.branch_id) {
				return {
					success: false,
					status: 403,
					error: 'Akses ditolak. Barang ini milik cabang lain.'
				};
			}

			await itemModel.updateItem(supabase, id, { is_active: true });

			await activityLogModel.logActivity(supabase, {
				userId: profile.id,
				branchId: item.branch_id,
				action: 'item_updated',
				entityType: 'item',
				entityId: id,
				metadata: { name: item.name, barcode: item.barcode, is_active: true }
			});

			return { success: true };
		} catch (error) {
			console.error('Error activating item in controller:', error);
			return { success: false, status: 500, error: 'Gagal mengaktifkan kembali barang.' };
		}
	}
};
