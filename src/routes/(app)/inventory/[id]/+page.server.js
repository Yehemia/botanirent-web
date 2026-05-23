import { fail, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.role !== 'owner' && profile.role !== 'gudang') {
		throw redirect(303, '/inventory');
	}

	const { id } = params;

	// Load item details
	const { data: item, error: itemError } = await supabase
		.from('items')
		.select('*, categories(*)')
		.eq('id', id)
		.single();

	if (itemError || !item) {
		throw redirect(303, '/inventory');
	}

	// Verify branch access
	if (profile.role !== 'owner' && item.branch_id !== profile.branch_id) {
		throw redirect(303, '/inventory');
	}

	// Load categories
	const { data: categories } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order');

	return {
		item,
		categories: categories || []
	};
}

export const actions = {
	default: async ({ params, request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const { id } = params;

		// Fetch existing item to check old values
		const { data: oldItem, error: fetchError } = await supabase
			.from('items')
			.select('*, categories(*)')
			.eq('id', id)
			.single();

		if (fetchError || !oldItem) {
			return fail(404, { error: 'Barang tidak ditemukan.' });
		}

		// Verify branch access
		if (profile.role !== 'owner' && oldItem.branch_id !== profile.branch_id) {
			return fail(403, { error: 'Akses ditolak. Barang ini milik cabang lain.' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const category_id = formData.get('category_id');
		const rental_price_per_day = formData.get('rental_price_per_day');
		const sell_price = formData.get('sell_price');
		const stock_total = parseInt(formData.get('stock_total')?.toString() || '0', 10);
		const is_active_str = formData.get('is_active');
		const is_active = is_active_str === 'true';
		const image = formData.get('image'); // File object

		if (!name || !category_id) {
			return fail(400, { error: 'Nama dan kategori wajib diisi.', values: Object.fromEntries(formData) });
		}

		// Get selected category type
		const { data: category } = await supabase
			.from('categories')
			.select('type')
			.eq('id', category_id)
			.single();

		if (!category) {
			return fail(400, { error: 'Kategori tidak valid.', values: Object.fromEntries(formData) });
		}

		// Validate prices based on category type
		if (category.type === 'sewa' && !rental_price_per_day) {
			return fail(400, { error: 'Harga sewa per hari wajib diisi untuk barang sewa.', values: Object.fromEntries(formData) });
		}
		if (category.type === 'retail' && !sell_price) {
			return fail(400, { error: 'Harga jual wajib diisi untuk barang retail.', values: Object.fromEntries(formData) });
		}

		let image_url = oldItem.image_url;

		// Handle new image upload if exists
		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `${oldItem.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			
			const { error: uploadError } = await supabase.storage
				.from('item-images')
				.upload(fileName, image, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				console.error("Upload error:", uploadError);
				return fail(500, { error: 'Gagal mengunggah gambar baru.', values: Object.fromEntries(formData) });
			}

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('item-images')
				.getPublicUrl(fileName);
			
			image_url = publicUrl;
		}

		// Calculate stock difference
		const stockDiff = stock_total - oldItem.stock_total;
		const new_stock_available = oldItem.stock_available + stockDiff;

		// If stock is decreased, perform validation
		if (stockDiff < 0) {
			if (category.type === 'sewa') {
				// Query ready assets
				const { data: readyAssets, error: readyError } = await supabase
					.from('rental_assets')
					.select('id')
					.eq('item_id', id)
					.eq('status', 'ready')
					.order('created_at', { ascending: false });

				if (readyError) {
					console.error("Fetch ready assets error:", readyError);
					return fail(500, { error: 'Gagal memverifikasi unit fisik barang.', values: Object.fromEntries(formData) });
				}

				const toDeleteCount = Math.abs(stockDiff);
				if (readyAssets.length < toDeleteCount) {
					return fail(400, {
						error: `Gagal mengurangi stok. Hanya ada ${readyAssets.length} unit yang siap ('ready') untuk dihapus, sedangkan Anda ingin mengurangi ${toDeleteCount} unit. Harap tunggu hingga unit lain selesai disewa atau selesai maintenance.`,
						values: Object.fromEntries(formData)
					});
				}

				// Delete the excess ready assets
				const assetIdsToDelete = readyAssets.slice(0, toDeleteCount).map(a => a.id);
				const { error: deleteError } = await supabase
					.from('rental_assets')
					.delete()
					.in('id', assetIdsToDelete);

				if (deleteError) {
					console.error("Delete assets error:", deleteError);
					return fail(500, { error: 'Gagal menghapus unit fisik lama.', values: Object.fromEntries(formData) });
				}
			} else {
				// Retail item
				if (new_stock_available < 0) {
					return fail(400, {
						error: `Gagal mengurangi stok. Stok tersedia saat ini (${oldItem.stock_available}) kurang dari jumlah pengurangan stok (${Math.abs(stockDiff)}).`,
						values: Object.fromEntries(formData)
					});
				}
			}
		}

		// If stock is increased and it is a rental item, generate new assets
		if (stockDiff > 0 && category.type === 'sewa') {
			// Helper to generate alphabetical suffix
			/**
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

			// Query existing assets
			const { data: existingAssets } = await supabase
				.from('rental_assets')
				.select('asset_code')
				.eq('item_id', id);

			const existingCodes = new Set(existingAssets?.map(a => a.asset_code) || []);
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

			const { error: insertAssetsError } = await supabase
				.from('rental_assets')
				.insert(newAssets);

			if (insertAssetsError) {
				console.error("Insert assets error:", insertAssetsError);
				return fail(500, { error: 'Gagal membuat unit fisik baru.', values: Object.fromEntries(formData) });
			}
		}

		// Update items table
		const { error: updateError } = await supabase
			.from('items')
			.update({
				category_id: category_id.toString(),
				name: name.toString(),
				description: description ? description.toString() : null,
				image_url,
				rental_price_per_day: category.type === 'sewa' ? parseFloat(rental_price_per_day?.toString() || '0') : null,
				sell_price: category.type === 'retail' ? parseFloat(sell_price?.toString() || '0') : null,
				stock_total,
				stock_available: new_stock_available,
				is_active
			})
			.eq('id', id);

		if (updateError) {
			console.error("Update item error:", updateError);
			return fail(500, { error: 'Gagal memperbarui data barang.', values: Object.fromEntries(formData) });
		}

		// Log activity (fire and forget)
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: oldItem.branch_id,
			action: 'item_updated',
			entity_type: 'item',
			entity_id: id,
			metadata: { name, barcode: oldItem.barcode, stock_total, stock_available: new_stock_available }
		}).then();

		throw redirect(303, '/inventory');
	}
};
