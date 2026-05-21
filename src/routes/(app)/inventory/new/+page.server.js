import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const { data: categories } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order');

	return {
		categories: categories || []
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		const { supabase } = locals;
		const { session, profile } = await locals.safeGetSession();

		if (!session || !profile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const category_id = formData.get('category_id');
		const rental_price_per_day = formData.get('rental_price_per_day');
		const sell_price = formData.get('sell_price');
		const stock_total = parseInt(formData.get('stock_total')?.toString() || '0', 10);
		const image = formData.get('image'); // File object

		if (!name || !category_id) {
			return fail(400, { error: 'Nama dan kategori wajib diisi.', values: Object.fromEntries(formData) });
		}

		// Ambil info kategori untuk cek tipe (sewa / retail)
		const { data: category } = await supabase.from('categories').select('type').eq('id', category_id).single();
		
		if (!category) {
			return fail(400, { error: 'Kategori tidak valid.', values: Object.fromEntries(formData) });
		}

		// Validasi harga berdasarkan tipe kategori
		if (category.type === 'sewa' && !rental_price_per_day) {
			return fail(400, { error: 'Harga sewa per hari wajib diisi untuk barang sewa.', values: Object.fromEntries(formData) });
		}
		if (category.type === 'retail' && !sell_price) {
			return fail(400, { error: 'Harga jual wajib diisi untuk barang retail.', values: Object.fromEntries(formData) });
		}

		// Auto-generate Barcode (BTN + 6 random alphanumeric)
		const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
		const barcode = `BTN-${randomStr}`;

		let image_url = null;

		// Handle image upload if exists
		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('item-images')
				.upload(fileName, image, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) {
				console.error("Upload error:", uploadError);
				return fail(500, { error: 'Gagal mengunggah gambar. Pastikan Anda sudah menjalankan script setup storage.', values: Object.fromEntries(formData) });
			}

			// Get public URL
			const { data: { publicUrl } } = supabase.storage
				.from('item-images')
				.getPublicUrl(fileName);
			
			image_url = publicUrl;
		}

		// Insert into database
		const { data: newItem, error: insertError } = await supabase
			.from('items')
			.insert({
				branch_id: profile.branch_id,
				category_id: category_id.toString(),
				name: name.toString(),
				description: description ? description.toString() : null,
				barcode,
				image_url,
				rental_price_per_day: rental_price_per_day ? parseFloat(rental_price_per_day.toString()) : null,
				sell_price: sell_price ? parseFloat(sell_price.toString()) : null,
				stock_total,
				stock_available: stock_total, // Stok awal
				is_active: true
			})
			.select()
			.single();

		if (insertError) {
			console.error("Insert error:", insertError);
			return fail(500, { error: 'Gagal menyimpan data barang.', values: Object.fromEntries(formData) });
		}

		// Log activity (fire and forget)
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: profile.branch_id,
			action: 'item_added',
			entity_type: 'item',
			entity_id: newItem.id,
			metadata: { name: newItem.name, barcode: newItem.barcode }
		}).then();

		throw redirect(303, '/inventory');
	}
};
