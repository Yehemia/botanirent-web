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
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string }} profile
	 */
	async getNewPackageData(supabase, profile) {
		const availableItems = await itemModel.getActiveSewaItems(supabase, profile.branch_id);
		return {
			availableItems
		};
	},

	/**
	 * Buat paket baru dengan item-itemnya dan gambar (opsional).
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string }} profile
	 * @param {FormData} formData
	 */
	async createPackage(supabase, profile, formData) {
		const name = formData.get('name');
		const description = formData.get('description');
		const package_price = formData.get('package_price');
		const items_json = formData.get('items_json');
		const image = formData.get('image');

		if (!name || !package_price || !items_json) {
			return {
				success: false,
				status: 400,
				error: 'Nama paket, harga, dan minimal 1 barang wajib diisi.',
				values: Object.fromEntries(formData)
			};
		}

		let parsedItems;
		try {
			parsedItems = JSON.parse(items_json.toString());
		} catch {
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

		let image_url = null;

		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `packages/${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('item-images')
				.upload(fileName, image, { cacheControl: '3600' });

			if (!uploadError) {
				const {
					data: { publicUrl }
				} = supabase.storage.from('item-images').getPublicUrl(fileName);
				image_url = publicUrl;
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

		let newPackage;
		try {
			newPackage = await packageModel.insertPackage(supabase, {
				branch_id: profile.branch_id,
				name: name.toString(),
				description: description ? description.toString() : null,
				package_price: parseFloat(package_price.toString()),
				image_url: image_url,
				is_active: true
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

		try {
			const packageItemsData = parsedItems.map(
				/** @param {any} item @param {number} index */ (item, index) => ({
					package_id: newPackage.id,
					item_id: item.id,
					quantity: parseInt(item.quantity, 10),
					sort_order: index
				})
			);

			await packageModel.insertPackageItems(supabase, packageItemsData);
		} catch (err) {
			console.error('Failed to insert package items in controller, initiating rollback:', err);

			try {
				await packageModel.deletePackage(supabase, newPackage.id);
			} catch (rollbackErr) {
				console.error('Rollback failed for package ID:', newPackage.id, rollbackErr);
			}

			return {
				success: false,
				status: 500,
				error: 'Gagal menyimpan isi paket.',
				values: Object.fromEntries(formData)
			};
		}

		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: 'package_created',
			entityType: 'package',
			entityId: newPackage.id,
			metadata: { name: newPackage.name, items_count: parsedItems.length }
		});

		return {
			success: true,
			redirect: '/packages'
		};
	}
};
