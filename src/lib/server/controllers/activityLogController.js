/**
 * ============================================================
 * FILE: activityLogController.js
 * TUJUAN: Logic bisnis untuk halaman Activity Log (riwayat aktivitas).
 *
 * Halaman ini hanya punya satu fitur: menampilkan daftar log
 * dengan filter (cabang, pencarian) dan pagination.
 *
 * KONSEP URL SEARCH PARAMS:
 *   URL: /activity-log?search=customer&branchId=xxx&page=2
 *   searchParams.get('search') → "customer"
 *   searchParams.get('page')   → "2" (string, perlu parseInt)
 * ============================================================
 */

import { activityLogModel } from '../models/activityLogModel.js';
import { branchModel } from '../models/branchModel.js';
import { cacheGet } from '../cache.js';

export const activityLogController = {
	/**
	 * Ambil data activity log dengan pagination, pencarian, dan filter cabang.
	 *
	 * CARA KERJA PAGINATION:
	 *   pageSize = 20 (tampilkan 20 log per halaman)
	 *   page 1: from=0,  to=19  → baris 0-19
	 *   page 2: from=20, to=39  → baris 20-39
	 *   page 3: from=40, to=59  → baris 40-59
	 *
	 * DATA YANG DIKEMBALIKAN:
	 *   - logs: array log pada halaman ini
	 *   - branches: untuk dropdown filter cabang
	 *   - totalCount: total semua log (untuk info "halaman X dari Y")
	 *   - page, pageSize: info pagination
	 *   - filters: nilai filter yang sedang aktif (untuk mempertahankan state form)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ role: string }} profile
	 * @param {URLSearchParams} searchParams - Query parameter dari URL
	 */
	async getActivityLogData(supabase, profile, searchParams) {
		// Ambil parameter dari URL
		const search = searchParams.get('search') || '';
		const branchId = searchParams.get('branchId') || '';
		const page = parseInt(searchParams.get('page') || '1', 10); // parseInt dengan radix 10 (desimal)
		const pageSize = 20; // Jumlah log per halaman

		// Hitung range baris untuk query database
		const from = (page - 1) * pageSize; // Baris pertama halaman ini (0-indexed)
		const to = from + pageSize - 1; // Baris terakhir halaman ini

		// Jalankan 2 query paralel
		const [logsRes, branches] = await Promise.all([
			// Ambil log sesuai filter dan range halaman
			activityLogModel.getActivityLogs(supabase, { search, branchId, from, to }),
			// Ambil semua cabang untuk dropdown filter (di-cache 15 detik)
			cacheGet('get_branches', () => branchModel.getBranches(supabase), 15000)
		]);

		return {
			logs: logsRes.logs,       // Array log pada halaman ini
			branches,                  // Semua cabang (untuk dropdown)
			totalCount: logsRes.count, // Total semua log (untuk kalkulasi total halaman)
			page,
			pageSize,
			filters: {
				search,   // Kata kunci pencarian yang sedang aktif
				branchId  // ID cabang yang dipilih
			}
		};
	}
};
