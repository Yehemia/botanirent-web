/**
 * ============================================================
 * FILE: app.d.ts
 * TUJUAN: Mendefinisikan TIPE DATA (types) yang tersedia secara
 *         global di seluruh aplikasi.
 *
 * File ini TIDAK DIJALANKAN — ia hanya memberitahu editor (VS Code)
 * apa saja yang tersedia, sehingga editor bisa memberikan autocomplete
 * dan mendeteksi error.
 *
 * KONSEP: File .d.ts = "Declaration file" (file deklarasi)
 *   Seperti "katalog" yang menjelaskan bentuk data
 *   tanpa mengeksekusi kode apapun.
 *
 * See https://svelte.dev/docs/kit/types#app.d.ts
 * for information about these interfaces
 * ============================================================
 */

// declare global = "umumkan ke seluruh aplikasi"
// Apapun yang didefinisikan di sini bisa diakses dari mana saja
declare global {
	// namespace App = namespace khusus SvelteKit
	// SvelteKit akan membaca definisi di sini untuk mengetahui
	// bentuk data yang tersedia di hooks, load functions, dll
	namespace App {
		// interface Error {}
		// (Bisa digunakan untuk menambah field custom ke error)

		// Locals = data yang tersedia DI SETIAP REQUEST server.
		// Setiap kali ada request masuk, SvelteKit menyediakan objek 'locals'
		// yang bisa diisi data apapun oleh hooks.server.js.
		//
		// CONTOH PENGGUNAAN di +page.server.js:
		//   const supabase = locals.supabase;        ← akses database
		//   const { user } = await locals.safeGetSession();  ← cek siapa yang login
		interface Locals {
			// Property 'supabase' bertipe SupabaseClient
			// Ini adalah koneksi ke database yang disiapkan oleh hooks.server.js
			// Setiap halaman bisa mengakses database lewat locals.supabase
			supabase: import('@supabase/supabase-js').SupabaseClient;

			// Function untuk mendapatkan data sesi user yang sedang login
			// Mengembalikan:
			//   - session: informasi sesi (token, expiry)
			//   - user: data user Supabase (id, email)
			//   - profile: data profil dari tabel 'profiles' (nama, role, cabang)
			//
			// Promise<...> artinya function ini ASYNCHRONOUS
			// (perlu di-await karena mengambil data dari database)
			//
			// | null artinya BISA KOSONG (jika user belum login)
			safeGetSession: () => Promise<{
				session: import('@supabase/supabase-js').Session | null;
				user: import('@supabase/supabase-js').User | null;
				profile: any | null;
			}>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Baris ini WAJIB ada!
// Tanpa export {}, TypeScript menganggap file ini sebagai "script" biasa
// bukan "module". Dengan export {}, file ini dianggap module
// dan declare global baru bisa bekerja dengan benar
export {};
