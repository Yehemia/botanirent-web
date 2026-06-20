/**
 * ============================================================
 * FILE: vite.config.js
 * TUJUAN: Mengonfigurasi Vite — "build tool" yang menerjemahkan
 *         kode SvelteKit menjadi aplikasi web yang bisa dijalankan browser.
 *
 * ANALOGI: Vite seperti "penerjemah" — dia membaca kode .svelte
 *          dan mengubahnya jadi HTML/CSS/JS yang browser pahami.
 *
 * KAPAN DIJALANKAN: Otomatis saat `npm run dev` atau `npm run build`
 * ============================================================
 */

// Import plugin Tailwind CSS untuk Vite
// Tailwind CSS = framework utility CSS (contoh: "bg-red-500" = background merah)
// Plugin ini memproses class-class Tailwind menjadi CSS yang siap pakai
import tailwindcss from '@tailwindcss/vite';

// Import plugin SvelteKit untuk Vite
// Tanpa plugin ini, Vite tidak tahu cara memproses file .svelte
import { sveltekit } from '@sveltejs/kit/vite';

// Helper function dari Vite untuk mendefinisikan konfigurasi
// Memberikan autocomplete & validasi di editor (VS Code)
import { defineConfig } from 'vite';

export default defineConfig({
	// Daftar plugin yang aktif:
	// 1. tailwindcss() → memproses class Tailwind menjadi CSS
	// 2. sveltekit()   → memproses file .svelte dan routing SvelteKit
	//
	// ⚠️ URUTAN PENTING! Tailwind harus SEBELUM SvelteKit
	//    karena CSS perlu diproses dulu sebelum komponen Svelte
	plugins: [tailwindcss(), sveltekit()],

	// SSR = Server-Side Rendering (halaman di-render di server dulu, baru dikirim ke browser)
	ssr: {
		// noExternal: library 'svelte-sonner' (library toast/notifikasi)
		// harus di-bundle bersama kode server, bukan dibiarkan sebagai external.
		//
		// MENGAPA? Karena svelte-sonner menggunakan syntax yang hanya bisa
		// diproses oleh Vite. Kalau dibiarkan external, Node.js akan error
		// karena tidak mengerti syntax tersebut.
		noExternal: ['svelte-sonner']
	}
});
