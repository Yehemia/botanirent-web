/**
 * ============================================================
 * FILE: hooks.server.js
 * TUJUAN: MIDDLEWARE (satpam) untuk seluruh aplikasi.
 *         SETIAP REQUEST yang masuk ke server PASTI melewati file ini dulu.
 *
 * Yang dilakukan di sini:
 *   1. Membuat koneksi Supabase untuk request ini
 *   2. Menyiapkan function safeGetSession() untuk cek autentikasi
 *   3. Meneruskan request ke halaman yang diminta
 *
 * KONSEP MIDDLEWARE:
 *   Middleware = kode yang berjalan DI ANTARA request masuk dan halaman.
 *   ANALOGI: Seperti satpam di pintu gedung:
 *     - Request masuk = tamu yang datang
 *     - hooks.server.js = satpam yang cek identitas
 *     - resolve() = satpam membukakan pintu ke halaman tujuan
 *
 * ALUR EKSEKUSI:
 *   Browser → hooks.server.js (handle) → +layout.server.js → +page.server.js → Render
 * ============================================================
 */

import { createSupabaseServerClient, supabaseAdmin } from '$lib/server/supabase';

// =====================================================
// SESSION CACHE — Cache sesi user di memori server
// =====================================================

// Map untuk menyimpan data sesi user yang sudah diverifikasi
// Key = gabungan nilai auth cookies
// Value = { data: { session, user, profile }, timestamp: ... }
const sessionCache = new Map();

// TTL (Time-To-Live) cache sesi = 15 detik
// Artinya: jika user navigasi 5 halaman dalam 15 detik,
// hanya REQUEST PERTAMA yang benar-benar cek ke Supabase.
// 4 request sisanya langsung pakai cache → SUPER CEPAT
const CACHE_TTL_MS = 15000;

// Clean up expired cache items periodically to prevent memory leaks in dev/prod
// Bersihkan cache yang expired SETIAP 60 detik agar memori tidak penuh
//
// globalThis = objek global yang persist antar hot-reload
//   Di browser = window, di Node.js = global
//   Menyimpan interval di globalThis mencegah interval GANDA saat dev hot-reload
//
// TANPA pengecekan ini: setiap kali Vite hot-reload, setInterval BARU dibuat
// tapi interval LAMA tetap jalan → memory leak!
if (globalThis['sessionCacheCleanupInterval']) {
	clearInterval(globalThis['sessionCacheCleanupInterval']);
}
globalThis['sessionCacheCleanupInterval'] = setInterval(() => {
	const now = Date.now();
	for (const [key, value] of sessionCache.entries()) {
		if (now - value.timestamp > CACHE_TTL_MS) {
			sessionCache.delete(key);
		}
	}
}, 60000);

// =====================================================
// HANDLE — Function utama yang dijalankan SETIAP REQUEST
// =====================================================

/**
 * Function 'handle' adalah function KHUSUS SvelteKit.
 * SvelteKit akan memanggil function ini untuk SETIAP request yang masuk.
 *
 * @type {import('@sveltejs/kit').Handle}
 *
 * ANALOGI:
 *   event  = tamu yang datang (siapa, mau ke mana)
 *   resolve = membukakan pintu (membiarkan masuk ke halaman)
 *   handle = satpam yang memutuskan: cek ID dulu → baru buka pintu
 */
export const handle = async ({ event, resolve }) => {
	// ─────────────────────────────────────────────────
	// LANGKAH 1: Buat koneksi Supabase untuk request ini
	// ─────────────────────────────────────────────────
	// Setiap request mendapat Supabase client SENDIRI
	// Disimpan di event.locals agar bisa diakses di mana saja:
	//   - +layout.server.js (load function)
	//   - +page.server.js (load function & form actions)
	//   - API routes (+server.js)
	event.locals.supabase = createSupabaseServerClient(event);

	// ─────────────────────────────────────────────────
	// LANGKAH 2: Siapkan function safeGetSession
	// ─────────────────────────────────────────────────

	/**
	 * A convenience helper so we can just call await event.locals.safeGetSession() in
	 * +page.server.js/js load functions to check auth.
	 *
	 * MENGAPA function dan bukan langsung dijalankan?
	 * Karena TIDAK SEMUA halaman butuh auth check (misal: halaman login).
	 * Jadi cek hanya dilakukan SAAT DIPANGGIL (lazy evaluation).
	 *
	 * SafeGetSession uses getUser() instead of getSession() as recommended by Supabase
	 * for SSR environments to ensure the token is still valid.
	 */
	event.locals.safeGetSession = async () => {
		// === DEDUPLIKASI ===
		// Pastikan function ini hanya berjalan SEKALI per request
		// Jika sudah dipanggil sebelumnya, kembalikan Promise yang sama
		// Ini mencegah query database GANDA dalam 1 request
		// Use bracket notation to avoid TypeScript static type errors on Locals interface
		const localsWithPromise = /** @type {any} */ (event.locals);
		if (localsWithPromise._sessionPromise) {
			return localsWithPromise._sessionPromise;
		}

		localsWithPromise._sessionPromise = (async () => {
			try {
				// ── Cari auth cookie dari browser ──
				// Supabase menyimpan auth token di cookies browser
				// Nama cookie dimulai dengan 'sb-' dan mengandung '-auth-token'
				//
				// Kadang token dipecah jadi beberapa "chunk" cookies
				// (karena browser membatasi ukuran 1 cookie max ~4KB)
				//
				// Filter '-code-verifier' karena itu cookie untuk OAuth flow,
				// bukan token sesi
				// Find all auth token chunk cookies and combine their values to form a unique key
				const authCookies = event.cookies
					.getAll()
					.filter(
						(c) =>
							c.name.startsWith('sb-') &&
							c.name.includes('-auth-token') &&
							!c.name.includes('-code-verifier')
					)
					.sort((a, b) => a.name.localeCompare(b.name));

				// Gabungkan semua nilai cookie menjadi 1 string
				// String ini dipakai sebagai KEY untuk session cache
				const tokenKey = authCookies.length > 0 ? authCookies.map((c) => c.value).join('|') : null;

				// Tidak ada auth cookie = user BELUM LOGIN
				// Langsung kembalikan null TANPA query database (hemat resource)
				// If there is no auth cookie, the user is definitely not logged in
				if (!tokenKey) {
					return { session: null, user: null, profile: null };
				}

				const isGet = event.request.method === 'GET';

				// ── Invalidasi cache untuk POST/PUT/DELETE ──
				// Untuk request yang MENGUBAH data, HAPUS cache
				// agar data terbaru dimuat ulang setelah perubahan
				// Contoh: Setelah update profil, cache harus di-refresh
				// Invalidate cache for mutations/POST requests
				if (!isGet && tokenKey) {
					sessionCache.delete(tokenKey);
				}

				// ── Cek cache untuk GET request ──
				// Saat user navigasi antar halaman (GET), cek cache dulu
				// Jika cache masih segar → langsung return → navigasi INSTAN!
				// For GET requests, check the in-memory cache first to make navigation instant
				if (isGet) {
					const cached = sessionCache.get(tokenKey);
					const now = Date.now();
					if (cached && now - cached.timestamp < CACHE_TTL_MS) {
						return cached.data; // CACHE HIT! ✅ Navigasi instan!
					}
				}

				// ── CACHE MISS → Verifikasi user ke Supabase ──
				// getUser() mengirim auth token ke Supabase untuk diverifikasi
				// Supabase mengecek: "Apakah token ini valid dan belum expired?"
				//
				// MENGAPA getUser() bukan getSession()?
				//   getUser()    → NETWORK CALL ke Supabase, memverifikasi token (AMAN)
				//   getSession() → hanya membaca data lokal (bisa di-tamper/manipulasi)
				//   Untuk keamanan SSR, getUser() WAJIB digunakan!
				// Otherwise, perform the full check by calling getUser()
				const {
					data: { user },
					error
				} = await event.locals.supabase.auth.getUser();

				// Token invalid atau expired → user tidak terautentikasi
				if (error || !user) {
					return { session: null, user: null, profile: null };
				}

				// ── Ambil profil user dari tabel 'profiles' ──
				// Query: SELECT * FROM profiles WHERE id = user.id LIMIT 1
				// Tabel 'profiles' berisi data tambahan: nama, role, cabang, avatar
				// Fetch the profile associated with the user
				let profile = null;
				const { data: profileData, error: profileError } = await event.locals.supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (!profileError && profileData) {
					profile = profileData;
				} else {
					// ── AUTO-CREATE PROFILE ──
					// Jika profil BELUM ADA (user baru pertama kali login), buat otomatis
					//
					// ⚠️ Menggunakan supabaseAdmin (bukan client biasa)
					// karena RLS mungkin mencegah user membuat profil sendiri
					//
					// user_metadata?. = optional chaining
					// Artinya: jika user_metadata ada, ambil full_name
					// Jika tidak ada (null/undefined), kembalikan undefined (tidak error)
					// Fallback: If profile doesn't exist, create it using supabaseAdmin
					console.log(`Profile missing for user ${user.id}. Attempting to auto-create...`);
					const { data: newProfile, error: insertError } = await supabaseAdmin
						.from('profiles')
						.insert({
							id: user.id,
							full_name: user.user_metadata?.full_name || user.email || 'Google User',
							avatar_url: user.user_metadata?.avatar_url || null,
							role: 'kasir' // Default role untuk user baru = kasir
						})
						.select()
						.single();

					if (!insertError && newProfile) {
						profile = newProfile;
						console.log(`Successfully auto-created profile for user ${user.id}`);
					} else {
						console.error('Failed to auto-create profile:', insertError);
					}
				}

				// ── Buat synthetic session object ──
				// Kita sudah memverifikasi user lewat getUser().
				// Tapi kode di halaman lain mungkin mengecek: if (session) { ... }
				// Jadi kita buat objek session "dummy" agar pengecekan tersebut berhasil.
				//
				// access_token & refresh_token = 'dummy' karena TIDAK dipakai
				// (semua auth sudah dihandle lewat cookies oleh Supabase SSR)
				// Construct a synthetic session object containing the user info
				// to satisfy layout/page loader truthiness checks without calling getSession()
				const session = {
					user,
					expires_at: Math.floor(Date.now() / 1000) + 3600,
					expires_in: 3600,
					token_type: 'bearer',
					access_token: 'dummy',
					refresh_token: 'dummy'
				};

				const result = { session, user, profile };

				// ── Simpan ke cache untuk GET request berikutnya ──
				// Sehingga navigasi berikutnya (dalam 15 detik) langsung pakai cache
				// Cache the result for future GET requests
				if (isGet) {
					sessionCache.set(tokenKey, {
						data: result,
						timestamp: Date.now()
					});
				}

				return result;
			} catch (err) {
				// Jika Supabase down/offline, JANGAN crash aplikasi!
				// Kembalikan null agar app bisa menampilkan halaman login
				const message = err instanceof Error ? err.message : String(err);
				console.error('[Supabase Connection Error/Offline]:', message);
				return { session: null, user: null, profile: null };
			}
		})();

		return localsWithPromise._sessionPromise;
	};

	// ─────────────────────────────────────────────────
	// LANGKAH 3: Lanjutkan ke halaman yang diminta
	// ─────────────────────────────────────────────────
	// resolve(event) = proses request dan render halaman yang sesuai
	// Return the resolved response, injecting supabase into the context
	return resolve(event, {
		filterSerializedResponseHeaders(/** @type {string} */ name) {
			/**
			 * SvelteKit secara default MENGHAPUS sebagian response headers.
			 * Tapi Supabase butuh 2 header ini untuk berfungsi:
			 * - content-range: untuk pagination (data banyak halaman)
			 * - x-supabase-api-version: untuk kompatibilitas API
			 *
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
