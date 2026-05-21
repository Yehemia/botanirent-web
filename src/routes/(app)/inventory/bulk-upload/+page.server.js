import { fail, redirect } from '@sveltejs/kit';
import * as xlsx from 'xlsx';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session } = await locals.safeGetSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
	
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
		const file = formData.get('file');

		if (!file || typeof file === 'string' || file.size === 0) {
			return fail(400, { error: 'Silakan pilih file Excel terlebih dahulu.' });
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			
			// Extract as array of arrays (header is row 0)
			const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

			if (rows.length <= 1) {
				return fail(400, { error: 'File Excel kosong atau hanya berisi header.' });
			}

			// We need categories to validate category_id
			const { data: categories } = await supabase.from('categories').select('id, type');
			const catMap = new Map(categories.map(c => [c.id, c.type]));

			const insertData = [];
			const errors = [];

			// Start reading from row index 1 (skipping header)
			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				
				// Skip completely empty rows
				if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
					continue;
				}

				// Expected columns: [Nama, Deskripsi, ID Kategori, Harga Sewa, Harga Jual, Stok]
				const [name, description, category_id, rental_price, sell_price, stock] = row;

				if (!name || !category_id) {
					errors.push(`Baris ${i + 1}: Nama dan ID Kategori wajib diisi.`);
					continue;
				}

				if (!catMap.has(category_id)) {
					errors.push(`Baris ${i + 1}: ID Kategori "${category_id}" tidak ditemukan di database.`);
					continue;
				}

				const catType = catMap.get(category_id);
				
				// Generate barcode
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
				return fail(400, { error: 'Terdapat error pada file Excel Anda:\n' + errors.join('\n') });
			}

			if (insertData.length === 0) {
				return fail(400, { error: 'Tidak ada data valid yang bisa dimasukkan.' });
			}

			// Bulk insert to Supabase
			const { error: insertError } = await supabase.from('items').insert(insertData);

			if (insertError) {
				console.error("Insert bulk error:", insertError);
				return fail(500, { error: 'Gagal memasukkan data ke database. Format mungkin tidak sesuai.' });
			}

			// Log activity
			supabase.from('activity_logs').insert({
				user_id: profile.id,
				branch_id: profile.branch_id,
				action: 'item_added',
				entity_type: 'bulk_upload',
				entity_id: profile.branch_id,
				metadata: { count: insertData.length }
			}).then();

			return { success: true, count: insertData.length };
			
		} catch (e) {
			console.error("Parse excel error:", e);
			return fail(500, { error: 'Gagal memproses file Excel. Pastikan file tidak corrupt dan menggunakan format .xlsx atau .csv.' });
		}
	}
};
