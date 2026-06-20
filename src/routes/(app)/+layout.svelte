<!--
  ============================================================
  FILE: (app)/+layout.svelte
  TUJUAN: Layout UI untuk SEMUA halaman aplikasi utama.
          Menampilkan Sidebar (menu navigasi) dan TopBar (bar atas).

  FILE PASANGAN:
    - (app)/+layout.server.js → memuat data dari database (SERVER)
    - (app)/+layout.svelte    → menampilkan UI (BROWSER) ← file ini

  STRUKTUR HALAMAN:
    ┌─────────────────────────────────┐
    │  TopBar (judul, profil, cabang) │
    ├───────┬─────────────────────────┤
    │       │                         │
    │ Side  │     Konten Halaman      │
    │ bar   │     (children)          │
    │       │                         │
    │       │                         │
    └───────┴─────────────────────────┘

  KONSEP Svelte 5 Runes yang dipakai:
    $props()   → menerima data dari parent/server
    $state()   → reactive state (data yang otomatis update UI saat berubah)
    $derived() → computed value (dihitung otomatis dari data lain)
  ============================================================
-->
<script>
	// Import komponen layout
	import Sidebar from '$lib/components/layout/Sidebar.svelte'; // Menu navigasi kiri
	import TopBar from '$lib/components/layout/TopBar.svelte'; // Bar atas

	// $app/stores = store SvelteKit yang berisi info halaman aktif
	// page = objek yang berisi URL, params, status halaman saat ini
	import { page } from '$app/stores';

	// onMount = lifecycle function Svelte
	// Kode di dalam onMount() HANYA berjalan DI BROWSER setelah render pertama
	// TIDAK berjalan di server (SSR)
	import { onMount } from 'svelte';

	// $props() = Svelte 5 rune untuk menerima props
	// data     = data dari +layout.server.js (session, profile, branch, branches, dll)
	// children = konten halaman anak yang akan di-render (dashboard, pos, inventory, dll)
	let { data, children } = $props();

	// ─────────────────────────────────────────────────
	// REACTIVE STATE — data yang otomatis update UI saat berubah
	// ─────────────────────────────────────────────────

	// $state() = Svelte 5 rune untuk membuat REACTIVE STATE
	// Saat nilai ini berubah (true↔false), UI otomatis update
	// Local state for sidebar toggle (handled by runes)
	let sidebarExpanded = $state(false); // Status sidebar: buka (true) / tutup (false)
	let isReady = $state(false); // Flag untuk mencegah animasi CSS saat halaman pertama dimuat

	// ─────────────────────────────────────────────────
	// LIFECYCLE: onMount — dijalankan SEKALI setelah render pertama di browser
	// ─────────────────────────────────────────────────
	onMount(() => {
		// Default to expanded on desktop viewports
		// Di DESKTOP (layar ≥ 768px): sidebar langsung expanded/terbuka
		// Di MOBILE (layar < 768px): sidebar tetap collapsed/tertutup
		if (window.innerWidth >= 768) {
			sidebarExpanded = true;
		}

		// Close sidebar on mobile when route changes
		// SUBSCRIBE ke perubahan URL (setiap kali user navigasi ke halaman baru)
		// Jika di MOBILE → otomatis tutup sidebar
		// Karena di mobile, sidebar menutupi konten (overlay mode)
		// Setelah user memilih menu, sidebar harus tertutup otomatis
		const unsubscribe = page.subscribe(() => {
			if (window.innerWidth < 768) {
				sidebarExpanded = false;
			}
		});

		// Setelah 100ms, aktifkan animasi CSS (transition)
		// MENGAPA ditunda 100ms?
		// Tanpa delay: sidebar langsung animasi dari 0 → 260px saat load pertama (jelek)
		// Dengan delay: sidebar sudah di posisi benar → baru animasi diaktifkan
		setTimeout(() => {
			isReady = true;
		}, 100);

		// Cleanup: saat komponen dihancurkan (unmount), hentikan subscription
		// Ini PENTING untuk mencegah memory leak!
		// Jika tidak di-unsubscribe, subscription tetap berjalan
		// walaupun komponen sudah tidak ada di layar
		return unsubscribe;
	});

	// Toggle = balik nilai: true → false, false → true
	function toggleSidebar() {
		sidebarExpanded = !sidebarExpanded;
	}

	// ─────────────────────────────────────────────────
	// DERIVED STATE — computed value yang dihitung otomatis
	// ─────────────────────────────────────────────────

	// $derived() = Svelte 5 rune untuk COMPUTED VALUE
	// Nilainya otomatis dihitung ulang saat dependensinya ($page) berubah
	// Di sini: menentukan judul halaman berdasarkan URL saat ini
	// Derive page title from path or meta
	let pageTitle = $derived(() => {
		const path = $page.url.pathname;
		// Cek URL dan kembalikan judul yang sesuai
		if (path.includes('/dashboard')) return 'Dashboard';
		if (path.includes('/pos')) return 'Point of Sale';
		if (path.includes('/customers')) return 'Data Penyewa';
		if (path.includes('/booking')) return 'Kalender Booking';
		if (path.includes('/inventory')) return 'Inventaris';
		if (path.includes('/packages')) return 'Paket Bundling';
		if (path.includes('/asset-status')) return 'Status Aset';
		if (path.includes('/returns')) return 'Pengembalian Barang';
		if (path.includes('/transactions')) return 'Riwayat Transaksi';
		if (path.includes('/statistics')) return 'Statistik Bisnis';
		if (path.includes('/branches')) return 'Manajemen Cabang';
		if (path.includes('/staff')) return 'Manajemen Staff';
		if (path.includes('/penalties')) return 'Pengaturan Denda';
		if (path.includes('/activity-log')) return 'Log Aktivitas';
		if (path.includes('/settings')) return 'Pengaturan Sistem';
		return 'BotaniRent'; // Default jika tidak cocok dengan path manapun
	});
</script>

<!-- ============================================================
     TEMPLATE HTML — Struktur layout aplikasi utama
     ============================================================ -->

<!-- Container utama: full screen height, flexbox horizontal (sidebar | konten) -->
<div class="relative flex h-screen overflow-hidden bg-[var(--color-cream)]">
	<!-- ═══════ SIDEBAR (Menu Navigasi Kiri) ═══════
	     bind:expanded = TWO-WAY BINDING
	     Artinya: Sidebar bisa MENGUBAH nilai sidebarExpanded dari dalam
	     (bukan hanya menerimanya). Jika Sidebar mengubah 'expanded',
	     nilai sidebarExpanded di sini juga ikut berubah otomatis.
	     
	     Props yang dikirim:
	     - expanded: status buka/tutup sidebar
	     - userProfile: data profil user (nama, role, avatar)
	     - unpaidDendaCount: badge notifikasi jumlah customer dengan denda -->
	<Sidebar bind:expanded={sidebarExpanded} userProfile={data.profile} unpaidDendaCount={data.unpaidDendaCount} />

	<!-- ═══════ OVERLAY GELAP (hanya di MOBILE) ═══════
	     Saat sidebar terbuka di mobile, tampilkan lapisan gelap di belakang sidebar.
	     Jika di-klik → tutup sidebar.
	     
	     md:hidden = hanya tampil di layar < 768px (disembunyikan di desktop)
	     bg-black/40 = background hitam dengan 40% opacity (semi-transparan)
	     z-30 = z-index 30 (di atas konten, di bawah sidebar) -->
	{#if sidebarExpanded}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-30 bg-black/40 transition-opacity duration-250 md:hidden"
			onclick={toggleSidebar}
		></div>
	{/if}

	<!-- ═══════ AREA KONTEN UTAMA (TopBar + Halaman) ═══════
	     ml-0 = margin-left 0 di mobile (sidebar overlay, tidak mendorong konten)
	     flex-1 = mengisi SISA ruang yang tersedia
	     min-w-0 = penting agar flex item bisa menyusut (mencegah overflow)
	     
	     Margin kiri (md:ml-...) menyesuaikan sidebar:
	     - Expanded: margin 260px (sidebar penuh lebar)
	     - Collapsed: margin 72px (sidebar hanya ikon)
	     
	     transition-all duration-250 = animasi halus saat sidebar toggle
	     TAPI hanya aktif setelah isReady=true (mencegah animasi saat load pertama) -->
	<div
		class="ml-0 flex min-w-0 flex-1 flex-col {isReady ? 'transition-all duration-250' : ''} {sidebarExpanded
			? 'md:ml-[260px]'
			: 'md:ml-[72px]'}"
	>
		<!-- ═══════ TOPBAR (Bar Atas) ═══════
		     Default TopBar, but can be overridden by specific pages if needed (like POS)
		     Menampilkan:
		     - Tombol toggle sidebar (hamburger icon)
		     - Judul halaman (dari pageTitle)
		     - Nama cabang aktif
		     - Profil user (nama, avatar)
		     
		     pageTitle() dipanggil sebagai FUNCTION karena $derived mengembalikan
		     function yang perlu di-invoke untuk mendapatkan nilainya -->
		<TopBar
			{sidebarExpanded}
			title={pageTitle()}
			userProfile={data.profile}
			branch={data.branch}
			branches={data.branches}
			{toggleSidebar}
		/>

		<!-- ═══════ MAIN CONTENT (Konten Halaman) ═══════
		     flex-1 = mengisi sisa tinggi yang tersedia (di bawah TopBar)
		     overflow-y-auto = jika konten lebih tinggi dari layar → munculkan scrollbar
		     p-4 md:p-6 = padding 16px di mobile, 24px di desktop
		     max-w-7xl = lebar maksimal 1280px (agar tidak terlalu lebar di monitor besar) -->
		<main class="flex-1 overflow-y-auto p-4 md:p-6">
			<div class="mx-auto w-full max-w-7xl">
				<!-- DI SINILAH halaman-halaman ditampilkan!
				     @render children() merender konten halaman anak:
				       /dashboard    → render halaman Dashboard
				       /pos          → render halaman POS (Point of Sale)
				       /inventory    → render halaman Inventaris
				       /customers    → render halaman Data Penyewa
				       dll -->
				{@render children()}
			</div>
		</main>
	</div>
</div>
