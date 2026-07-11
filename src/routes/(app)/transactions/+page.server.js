/**
 * ============================================================
 * FILE: routes/(app)/transactions/+page.server.js
 * TUJUAN: Logika server untuk Halaman Riwayat Transaksi (Transaction History).
 *
 * MENGAPA KODE INI DITULIS?
 *   Menyajikan daftar seluruh riwayat transaksi rental/jual yang pernah dilakukan di toko.
 *   Mendukung pencarian nama customer/kode transaksi (?q=xxx)
 *   serta pagination (?page=x) agar halaman tidak berat saat memuat ribuan baris transaksi.
 * ============================================================
 */

import { redirect } from '@sveltejs/kit';
import { transactionController } from '$lib/server/controllers/transactionController.js';
import { branchModel } from '$lib/server/models/branchModel.js';

/**
 * LOAD FUNCTION
 * Dijalankan sebelum halaman daftar transaksi dirender.
 */
export async function load({ locals, url }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	// Guard login
	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	// Membaca keyword pencarian dari URL (?q=nama_atau_kode)
	const search = url.searchParams.get('q') || '';
	
	// Membaca filter dari URL
	const branchId = url.searchParams.get('branchId') || '';
	const type = url.searchParams.get('type') || '';
	const status = url.searchParams.get('status') || '';

	// Validasi & parsing nomor halaman dari parameter URL (?page=2)
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
	
	// Batasi jumlah transaksi yang ditampilkan per halaman
	const limit = 10;
	
	const filters = { branchId, type, status };

	// Ambil data transaksi terfilter & terpaginasi dari controller
	const data = await transactionController.getTransactionsList(supabase, profile, search, page, limit, filters);
	
	// Ambil daftar cabang aktif jika user adalah owner
	let activeBranches = [];
	if (profile.role === 'owner') {
		try {
			activeBranches = await branchModel.getActiveBranches(supabase);
		} catch (error) {
			console.error('Failed to load active branches in transactions list:', error);
		}
	}

	return {
		transactions: data.transactions,
		totalCount: data.totalCount,
		search: data.search,
		page: data.page,
		limit: data.limit,
		filters: data.filters,
		activeBranches
	};
}

