<!--
  ============================================================
  FILE: routes/+layout.svelte (ROOT LAYOUT)
  TUJUAN: Layout PALING ATAS yang membungkus SEMUA halaman di aplikasi.
  
  Bertugas untuk:
    1. Memuat CSS global (app.css)
    2. Memasang sistem notifikasi toast (svelte-sonner)
    3. Menyediakan SEO meta tags (title, description)
    4. Mengaktifkan Vercel Speed Insights (hanya di production)
  
  KONSEP LAYOUT di SvelteKit:
    Layout = "pembungkus" yang mengelilingi konten halaman.
    ANALOGI: Seperti bingkai foto — foto (konten) berubah-ubah,
    tapi bingkainya (layout) tetap sama.
  
    Hierarki layout di app ini:
    +layout.svelte (ROOT — file ini)
      └── (auth)/+layout.svelte  → untuk halaman login/logout
      └── (app)/+layout.svelte   → untuk halaman aplikasi (sidebar + topbar)
  
  KONSEP $props() — Svelte 5 Runes:
    $props() = cara Svelte 5 menerima data dari "parent"
    'children' = konten halaman anak yang akan ditampilkan di dalam layout
  ============================================================
-->
<script>
	// Import CSS global — semua design tokens, base styles, animasi
	// Karena di-import di root layout, berlaku untuk SELURUH halaman
	import '../app.css';

	// Toaster = komponen notifikasi toast (pesan kecil yang muncul sementara)
	// Contoh: "Data berhasil disimpan ✅", "Error! Gagal menghapus ❌"
	// svelte-sonner = library toast populer untuk Svelte
	import { Toaster } from 'svelte-sonner';

	// browser = true jika kode berjalan di BROWSER
	//         = false jika kode berjalan di SERVER (SSR)
	// Digunakan untuk memastikan kode browser-only tidak jalan di server
	import { browser } from '$app/environment';

	// Vercel Speed Insights = tracking performa halaman
	// Mengumpulkan data: berapa cepat halaman dimuat oleh user nyata di production
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	// Aktifkan Speed Insights HANYA di:
	//   1. Browser (bukan server — karena SSR tidak punya window)
	//   2. BUKAN localhost (bukan development)
	//   3. BUKAN 127.0.0.1 (bukan development)
	//
	// MENGAPA? Data development akan mengacaukan statistik performa
	// production yang sesungguhnya (di dev biasanya lebih lambat)
	if (browser && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
		injectSpeedInsights();
	}

	// $props() = Svelte 5 rune untuk menerima props dari parent
	// 'children' = konten halaman yang akan ditampilkan di dalam layout
	//
	// ANALOGI: Layout = bingkai foto, children = foto yang bisa diganti
	// Setiap halaman berbeda mengisi 'children' yang berbeda:
	//   /login     → children = halaman Login
	//   /dashboard → children = halaman Dashboard
	let { children } = $props();
</script>

<!-- svelte:head menambahkan elemen ke <head> di app.html
     Title ini adalah DEFAULT — halaman lain bisa meng-override-nya
     Penting untuk SEO (Google) dan tab browser -->
<svelte:head>
	<title>BotaniRent — Sistem Manajemen Rental & Retail Outdoor</title>
	<!-- Meta description untuk SEO — Google menampilkan deskripsi ini di hasil pencarian -->
	<meta
		name="description"
		content="BotaniRent: POS dan manajemen inventaris terpadu untuk toko outdoor. Multi-cabang, transaksi hybrid sewa & jual."
	/>
</svelte:head>

<!-- @render = Svelte 5 syntax untuk me-render "snippet"
     children() = render konten halaman anak
     
     DI SINILAH semua halaman ditampilkan!
     Tanpa baris ini, TIDAK ADA konten yang muncul! -->
{@render children()}

<!-- Komponen Toaster ditempatkan di ROOT layout agar bisa
     menampilkan toast dari HALAMAN MANAPUN di aplikasi.
     
     richColors = warna otomatis sesuai tipe (sukses=hijau, error=merah)
     position="top-center" = toast muncul di atas tengah layar -->
<Toaster richColors position="top-center" />
