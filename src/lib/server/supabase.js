/**
 * ============================================================
 * FILE: supabase.js
 * TUJUAN: Membuat KONEKSI ke Supabase (layanan database cloud).
 *
 * Ada 2 jenis koneksi yang dibuat di sini:
 *
 * 1. CLIENT BIASA (createSupabaseServerClient)
 *    → Menghormati aturan keamanan RLS (Row Level Security)
 *    → Dipakai untuk SEMUA operasi normal
 *    → ANALOGI: Seperti karyawan biasa yang hanya bisa akses data sesuai izinnya
 *
 * 2. ADMIN CLIENT (supabaseAdmin)
 *    → Melewati SEMUA aturan keamanan
 *    → Hanya untuk operasi khusus (auto-create profile, kelola user)
 *    → ANALOGI: Seperti bos yang punya akses ke semua ruangan
 *
 * KONSEP PENTING:
 *   - Environment Variables: nilai rahasia di file .env
 *   - Proxy Pattern: objek perantara untuk lazy initialization
 *   - RLS: aturan database agar user hanya akses data yang diizinkan
 * ============================================================
 */

// createServerClient = function dari Supabase khusus untuk SERVER
// Versi SSR (Server-Side Rendering) yang bisa mengelola cookies browser
import { createServerClient } from '@supabase/ssr';

// Mengambil variabel environment yang BOLEH diketahui publik:
// - PUBLIC_SUPABASE_URL = alamat database Supabase (contoh: https://xxx.supabase.co)
// - PUBLIC_SUPABASE_PUBLISHABLE_KEY = API key publik (aman di-expose ke browser)
//
// $env/static/public = cara SvelteKit membaca file .env
// Prefix PUBLIC_ artinya variabel ini BOLEH dikirim ke browser
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

// Variabel environment yang RAHASIA (hanya server yang boleh tahu)
// Service Role Key = "kunci admin" yang bisa melewati semua aturan keamanan
// ⚠️ JANGAN PERNAH mengirim key ini ke browser!
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// createClient = function untuk membuat client Supabase biasa (non-SSR)
// Dipakai untuk admin client yang tidak perlu mengelola cookies
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use on the server.
 * Requires event to set/get cookies correctly during SSR.
 *
 * Function ini MEMBUAT client Supabase baru untuk SETIAP request.
 * Parameter 'event' = objek request dari SvelteKit yang berisi cookies, URL, dll.
 *
 * MENGAPA buat baru setiap request? Karena setiap user punya cookies berbeda
 * (auth token berbeda), jadi client-nya pun harus berbeda.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const createSupabaseServerClient = (event) => {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			// Memberitahu Supabase cara MEMBACA semua cookies
			// Supabase menyimpan auth token di cookies browser
			getAll: () => event.cookies.getAll(),

			// Memberitahu Supabase cara MENULIS cookies
			// Dipanggil saat session di-refresh (token auth baru)
			setAll: (cookiesToSet) => {
				/**
				 * setAll is called when the session is refreshed.
				 * This must be done inside a try/catch block because we might
				 * not have access to set cookies in certain contexts (like from a page).
				 */
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						// Set cookie dengan path: '/' artinya cookie berlaku
						// untuk SEMUA halaman di website (bukan hanya halaman tertentu)
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				} catch {
					// The `setAll` method was called from a context where cookies cannot be set
					// like a Server Component or inside a page. This can be ignored.
					// Try-catch karena ada konteks di mana cookies TIDAK BISA di-set
					// Contoh: di dalam +page.js (bukan +page.server.js). Error ini aman diabaikan
				}
			}
		}
	});
};

/**
 * Creates a Supabase admin client using the service role key.
 * Only use this in server actions where bypassing RLS or managing users is required.
 *
 * ⚠️ HANYA GUNAKAN UNTUK OPERASI YANG MEMBUTUHKAN AKSES PENUH
 * Contoh: auto-create profile, menghapus user, bypass RLS
 *
 * POLA DESAIN: PROXY + LAZY INITIALIZATION
 *
 * Proxy = "perantara" yang mencegat akses ke objek.
 * Setiap kali kode mengakses supabaseAdmin.apapun,
 * function get() akan dipanggil dulu.
 *
 * Lazy Initialization = client admin TIDAK dibuat saat file di-import,
 * tapi HANYA saat pertama kali digunakan.
 *
 * MENGAPA pakai Proxy? Untuk mencegah error saat development reload,
 * karena environment variables mungkin belum tersedia
 * saat file pertama kali di-load oleh Vite.
 *
 * Wrap in a Proxy to lazily initialize the client when it's first accessed, preventing
 * startup errors in SvelteKit when static public variables are temporarily empty during dev reload.
 */
/** @type {any} */
let adminClient = null;
/** @type {any} */
export const supabaseAdmin = new Proxy(
	{}, // Target: objek kosong (hanya "facade" / tampak depan)
	{
		// get() dipanggil setiap kali ada yang mengakses property dari supabaseAdmin
		// Contoh: supabaseAdmin.from('profiles') → get() dipanggil dengan prop = 'from'
		get(target, prop) {
			// Jika admin client BELUM dibuat, buat sekarang (lazy init)
			if (!adminClient) {
				// Validasi: pastikan env variables tersedia
				if (!PUBLIC_SUPABASE_URL || !PRIVATE_SUPABASE_SERVICE_ROLE_KEY) {
					throw new Error(
						'PUBLIC_SUPABASE_URL or PRIVATE_SUPABASE_SERVICE_ROLE_KEY is missing when trying to access supabaseAdmin.'
					);
				}
				// Buat client admin dengan Service Role Key (bypass RLS)
				adminClient = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SUPABASE_SERVICE_ROLE_KEY, {
					auth: {
						autoRefreshToken: false, // JANGAN refresh token otomatis (admin tidak punya "sesi")
						persistSession: false // JANGAN simpan sesi (berjalan di server, tidak perlu persist)
					}
				});
			}
			// Ambil property yang diminta dari adminClient yang sudah dibuat
			const val = adminClient[prop];
			if (typeof val === 'function') {
				// .bind() = pastikan function tetap "terikat" ke adminClient
				// Tanpa bind, 'this' di dalam function bisa salah
				// Contoh: supabaseAdmin.from('profiles')
				// → from() harus tahu bahwa 'this' = adminClient, bukan Proxy
				return val.bind(adminClient);
			}
			return val;
		}
	}
);
