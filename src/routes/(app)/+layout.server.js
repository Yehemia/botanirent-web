/**
 * ============================================================
 * FILE: (app)/+layout.server.js
 * TUJUAN: Memuat DATA dari database untuk layout aplikasi utama.
 *         Data yang di-load di sini tersedia di SEMUA halaman anak.
 *
 * INI ADALAH "DATA LOADER" — file yang berpasangan dengan +layout.svelte:
 *   - +layout.server.js → memuat data (berjalan di SERVER)
 *   - +layout.svelte    → menampilkan UI (berjalan di BROWSER)
 *
 * KONSEP LOAD FUNCTION:
 *   SvelteKit secara otomatis menjalankan function 'load' di file ini
 *   SEBELUM halaman di-render. Data yang di-return akan tersedia
 *   di komponen Svelte sebagai 'data' prop.
 *
 *   ANALOGI: Seperti dapur restoran yang menyiapkan makanan
 *   SEBELUM pelayan (layout.svelte) menyajikan ke pelanggan (browser)
 *
 * FOLDER (app):
 *   Tanda kurung () = "route group" — nama folder TIDAK muncul di URL.
 *   Jadi /dashboard bukan /(app)/dashboard.
 *   Gunanya: mengelompokkan halaman yang punya layout SAMA
 *   (halaman app = pakai sidebar+topbar, halaman auth = tanpa sidebar)
 *
 * DATA YANG DI-LOAD:
 *   1. session, user, profile → data autentikasi
 *   2. branch name → nama cabang user saat ini
 *   3. branches list → daftar semua cabang (hanya untuk owner)
 *   4. unpaidDendaCount → jumlah customer dengan denda belum bayar (badge notif)
 * ============================================================
 */

// redirect() = function dari SvelteKit untuk mengarahkan user ke halaman lain
// Dipakai jika user belum login → redirect ke /login
import { redirect } from '@sveltejs/kit';

// cacheGet = ambil data dari cache, atau fetch dari DB jika belum ada/expired
// (lihat penjelasan di cache.js)
import { cacheGet } from '$lib/server/cache.js';

/**
 * LOAD FUNCTION — function khusus SvelteKit
 * Dijalankan DI SERVER sebelum halaman di-render.
 *
 * Parameter:
 *   locals = objek yang disiapkan hooks.server.js
 *            Berisi: supabase (koneksi DB), safeGetSession (cek auth)
 */
export const load = async ({ locals }) => {
	// ─────────────────────────────────────────────────
	// LANGKAH 1: Cek apakah user sudah login
	// ─────────────────────────────────────────────────
	// Panggil safeGetSession() yang disiapkan di hooks.server.js
	const { session, user, profile } = await locals.safeGetSession();

	// PROTEKSI HALAMAN!
	// Jika user BELUM LOGIN (!session), atau
	// profil belum ada (!profile), atau
	// profil TIDAK AKTIF (!profile.is_active) → redirect ke /login
	//
	// 303 = HTTP status code "See Other" (redirect setelah operasi)
	// throw redirect = cara SvelteKit melakukan redirect dari server
	//
	// is_active: profil bisa di-nonaktifkan oleh owner,
	// sehingga kasir yang sudah keluar tidak bisa akses lagi
	if (!session || !profile || !profile.is_active) {
		throw redirect(303, '/login');
	}

	// ─────────────────────────────────────────────────
	// LANGKAH 2: Ambil nama cabang (branch) user saat ini
	// ─────────────────────────────────────────────────
	// profile?.branch_id → jika user punya branch_id, ambil nama cabangnya
	//                      jika tidak punya (owner tanpa cabang tertentu), skip
	//
	// Menggunakan cacheGet() → data di-cache 30 detik
	// Nama cabang JARANG berubah, jadi cache 30 detik sudah cukup
	const branchPromise = profile?.branch_id
		? cacheGet(
				`branch_name_${profile.branch_id}`,
				async () => {
					// Query: SELECT name FROM branches WHERE id = profile.branch_id LIMIT 1
					const { data } = await locals.supabase
						.from('branches')
						.select('name')
						.eq('id', profile.branch_id)
						.single();
					return { data };
				},
				30000 // Cache selama 30 detik (30000 ms)
			)
		: Promise.resolve({ data: null });
	// Promise.resolve() = langsung selesai dengan nilai null (tanpa query DB)
	// Dipakai agar Promise.all() di bawah bisa berjalan tanpa error

	// ─────────────────────────────────────────────────
	// LANGKAH 3: Ambil daftar SEMUA cabang (hanya untuk OWNER)
	// ─────────────────────────────────────────────────
	// Daftar cabang hanya dimuat untuk OWNER
	// Karena hanya owner yang bisa SWITCH antar cabang di TopBar
	// Kasir hanya bisa melihat 1 cabang yang di-assign ke mereka
	const branchesPromise = profile?.role === 'owner'
		? cacheGet(
				'layout_branches',
				async () => {
					// Query: SELECT id, name FROM branches ORDER BY name
					const { data } = await locals.supabase
						.from('branches')
						.select('id, name')
						.order('name');
					return { data };
				},
				20000 // Cache selama 20 detik
			)
		: Promise.resolve({ data: null });

	// ─────────────────────────────────────────────────
	// LANGKAH 4: Jalankan KEDUA query secara PARALEL (bersamaan)
	// ─────────────────────────────────────────────────
	// Promise.all() menjalankan beberapa Promise BERSAMAAN, bukan satu-satu!
	//
	// ANALOGI:
	//   Sequential (satu-satu): Pesan nasi → tunggu selesai → pesan lauk → tunggu selesai
	//   Parallel (bersamaan):   Pesan nasi DAN lauk SEKALIGUS → tunggu SEKALI saja
	//
	// Tanpa Promise.all: total waktu = waktu query 1 + waktu query 2 (lambat!)
	// Dengan Promise.all: total waktu = waktu query TERLAMA saja (cepat!)
	const [branchRes, branchesRes] = await Promise.all([branchPromise, branchesPromise]);

	// ─────────────────────────────────────────────────
	// LANGKAH 5: Hitung jumlah customer dengan denda belum bayar
	// ─────────────────────────────────────────────────
	// Angka ini ditampilkan sebagai BADGE NOTIFIKASI di Sidebar
	// (lingkaran merah kecil berisi angka di menu "Denda")
	let unpaidDendaCount = 0;
	try {
		// Query dengan relasi BERSARANG (nested relation):
		// penalties → transaction_items → transactions → customer_id
		//
		// Ini memanfaatkan fitur Supabase "nested select"
		// yang otomatis melakukan JOIN antar tabel berdasarkan foreign keys
		let query = locals.supabase
			.from('penalties')
			.select('id, transaction_items(transactions(customer_id))')
			.eq('payment_status', 'unpaid'); // Hanya denda yang BELUM DIBAYAR

		// Filter per cabang (kecuali owner yang tidak punya branch_id)
		if (profile.branch_id) {
			query = query.eq('branch_id', profile.branch_id);
		}

		const { data: penData, error: penErr } = await query;
		if (!penErr && penData) {
			// Set = koleksi yang HANYA MENYIMPAN NILAI UNIK
			// Jika 1 customer punya 3 denda, tetap dihitung 1 customer
			const customerIds = new Set();
			penData.forEach((p) => {
				// Navigasi relasi bersarang untuk mendapatkan customer_id
				// Supabase bisa mengembalikan data sebagai array atau objek tunggal,
				// jadi kita perlu handle kedua kemungkinan
				const itemsVal = /** @type {any} */ (p.transaction_items);
				const firstItem = Array.isArray(itemsVal) ? itemsVal[0] : itemsVal;
				const txVal = firstItem?.transactions;
				const transaction = Array.isArray(txVal) ? txVal[0] : txVal;
				const customerId = transaction?.customer_id;
				if (customerId) {
					customerIds.add(customerId); // Set otomatis mencegah duplikat
				}
			});
			// Hasilnya = jumlah customer UNIK yang punya denda belum bayar
			unpaidDendaCount = customerIds.size;
		}
	} catch (err) {
		console.error('Error fetching unpaid denda customer count in layout:', err);
	}

	// ─────────────────────────────────────────────────
	// LANGKAH 6: Return SEMUA data ke +layout.svelte
	// ─────────────────────────────────────────────────
	// Data ini tersedia di layout.svelte sebagai 'data' prop:
	//   let { data } = $props();
	//   data.profile, data.branch, data.branches, data.unpaidDendaCount
	//
	// Data ini juga tersedia di SEMUA halaman anak (children)
	// karena layout data "mengalir ke bawah" di SvelteKit
	return {
		session,
		user,
		profile,
		branch: branchRes.data,
		branches: branchesRes.data || [], // Default ke array kosong jika null
		unpaidDendaCount
	};
};
