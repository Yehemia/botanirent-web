/**
 * ============================================================
 * FILE: svelte.config.js
 * TUJUAN: Mengonfigurasi SvelteKit sebagai framework aplikasi.
 *
 * ANALOGI: Kalau Vite adalah "mesin mobil", maka svelte.config.js
 *          adalah "dashboard kontrol" yang mengatur bagaimana
 *          mesin tersebut beroperasi.
 *
 * KAPAN DIJALANKAN: Dibaca otomatis oleh SvelteKit saat dev/build
 * ============================================================
 */

// ADAPTER = "penerjemah deployment"
// SvelteKit bisa di-deploy ke berbagai platform (Vercel, Netlify, Node.js, dll)
// Adapter ini mengubah output SvelteKit menjadi format yang Vercel pahami.
//
// ANALOGI: Seperti memilih tipe colokan listrik yang sesuai negara tujuan
//   adapter-vercel  = colokan untuk Vercel
//   adapter-node    = colokan untuk server Node.js biasa
//   adapter-static  = colokan untuk hosting statis (GitHub Pages)
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
// JSDoc type annotation — memberi tahu editor (VS Code) bahwa variabel 'config'
// bertipe Config dari SvelteKit, sehingga kamu dapat autocomplete saat mengetik
const config = {
	compilerOptions: {
		// Opsi untuk COMPILER Svelte (yang mengubah file .svelte → .js)

		// RUNES MODE = fitur baru Svelte 5
		// Svelte 5 punya 2 cara menulis kode:
		//   - Runes mode (baru): $state(), $derived(), $effect()
		//   - Legacy mode (lama): let count = 0; (reactivity otomatis)
		//
		// Logika di bawah ini:
		//   - Jika file ada di node_modules → biarkan default library (undefined)
		//   - Jika file BUKAN di node_modules → paksa pakai runes mode (true)
		//
		// MENGAPA? Kode kita mau pakai Svelte 5 runes,
		// tapi library pihak ketiga mungkin masih pakai mode lama.
		// Kalau dipaksa runes semua, library bisa error.
		//
		// Cara kerja: filename.split(/[/\\]/) memecah path file jadi array
		//   Contoh: "src/routes/+page.svelte" → ["src","routes","+page.svelte"]
		//   Lalu .includes('node_modules') → cek apakah ada folder node_modules
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.

		// Gunakan adapter Vercel yang sudah di-import di atas
		// adapter() dipanggil sebagai function karena bisa menerima opsi tambahan
		adapter: adapter()
	}
};

export default config;
