/**
 * ============================================================
 * FILE: routes/api/change-branch/+server.js
 * TUJUAN: API Endpoint (POST) untuk memindahkan Cabang Aktif bagi Owner.
 *
 * MENGAPA KODE INI DITULIS?
 *   Owner memiliki hak istimewa untuk mengawasi seluruh cabang.
 *   Ketika Owner memilih cabang tertentu di Topbar dropdown, browser mengirimkan
 *   request HTTP POST ke API ini untuk memperbarui `branch_id` di profil Owner saat ini.
 *   Ini mengubah scope data yang ia lihat di seluruh aplikasi secara instan.
 * ============================================================
 */

import { json, error } from '@sveltejs/kit';

/**
 * HANDLER POST REQUEST
 * Dipanggil secara asynchronous ketika frontend melakukan fetch(POST, '/api/change-branch').
 */
export const POST = async ({ request, locals }) => {
	// Ambil profil user saat ini
	const { profile } = await locals.safeGetSession();
	if (!profile) {
		throw error(401, 'Unauthorized');
	}

	// Proteksi API: Hanya role 'owner' yang diperbolehkan memindahkan cabang aktif
	if (profile.role !== 'owner') {
		throw error(403, 'Forbidden: Only owners can switch branches');
	}

	// Parsing request body sebagai JSON untuk mendapatkan ID cabang target
	const { branchId } = await request.json();
	
	// Jika branchId kosong / falsy (misal user memilih opsi "Semua Cabang"),
	// simpan nilai null di database. Null merepresentasikan scope global (semua cabang).
	const targetBranchId = branchId || null;

	// Perbarui kolom branch_id pada tabel profiles untuk user saat ini di database
	const { error: updateError } = await locals.supabase
		.from('profiles')
		.update({ branch_id: targetBranchId })
		.eq('id', profile.id);

	// Jika terjadi error pada query database
	if (updateError) {
		console.error('Error updating active branch:', updateError);
		throw error(500, updateError.message);
	}

	// Kembalikan response JSON penanda sukses
	return json({ success: true });
};

