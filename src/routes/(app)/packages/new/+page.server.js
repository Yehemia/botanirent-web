import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Hanya ambil barang yang bertipe 'sewa' dan aktif
	const { data: items } = await supabase
		.from('items')
		.select('id, name, rental_price_per_day, category:categories!inner(type)')
		.eq('branch_id', profile.branch_id)
		.eq('categories.type', 'sewa')
		.eq('is_active', true)
		.order('name');

	return {
		availableItems: items || []
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
		const package_price = formData.get('package_price');
		const items_json = formData.get('items_json'); // Stringified JSON array
		const image = formData.get('image'); // File

		if (!name || !package_price || !items_json) {
			return fail(400, { error: 'Nama paket, harga, dan minimal 1 barang wajib diisi.' });
		}

		let parsedItems = [];
		try {
			parsedItems = JSON.parse(items_json.toString());
		} catch (e) {
			return fail(400, { error: 'Format data barang tidak valid.' });
		}

		if (parsedItems.length === 0) {
			return fail(400, { error: 'Paket harus berisi minimal 1 barang.' });
		}

		let image_url = null;

		// Handle image upload if exists
		if (image && typeof image !== 'string' && image.size > 0) {
			const fileExt = image.name.split('.').pop();
			const fileName = `packages/${profile.branch_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			
			const { error: uploadError } = await supabase.storage
				.from('item-images')
				.upload(fileName, image, { cacheControl: '3600' });

			if (!uploadError) {
				const { data: { publicUrl } } = supabase.storage
					.from('item-images')
					.getPublicUrl(fileName);
				image_url = publicUrl;
			}
		}

		// Insert Package
		const { data: newPackage, error: packageError } = await supabase
			.from('packages')
			.insert({
				branch_id: profile.branch_id,
				name: name.toString(),
				description: description ? description.toString() : null,
				package_price: parseFloat(package_price.toString()),
				image_url: image_url,
				is_active: true
			})
			.select()
			.single();

		if (packageError) {
			console.error("Insert package error:", packageError);
			return fail(500, { error: 'Gagal menyimpan paket.' });
		}

		// Insert Package Items
		const packageItemsData = parsedItems.map(/** @param {any} item @param {number} index */ (item, index) => ({
			package_id: newPackage.id,
			item_id: item.id,
			quantity: parseInt(item.quantity, 10),
			sort_order: index
		}));

		const { error: itemsError } = await supabase
			.from('package_items')
			.insert(packageItemsData);

		if (itemsError) {
			console.error("Insert package items error:", itemsError);
			// Rollback is complex without RPC, but we can delete the package as a manual rollback
			await supabase.from('packages').delete().eq('id', newPackage.id);
			return fail(500, { error: 'Gagal menyimpan isi paket.' });
		}

		// Log activity
		supabase.from('activity_logs').insert({
			user_id: profile.id,
			branch_id: profile.branch_id,
			action: 'package_created',
			entity_type: 'package',
			entity_id: newPackage.id,
			metadata: { name: newPackage.name, items_count: parsedItems.length }
		}).then();

		throw redirect(303, '/packages');
	}
};
