<!--
  ============================================================
  FILE: Sidebar.svelte
  TUJUAN: Komponen SIDEBAR — menu navigasi vertikal di sisi kiri layar.

  FITUR:
    1. Menampilkan daftar menu sesuai ROLE user (kasir/gudang/owner)
    2. Bisa di-expand (lebar, tampilkan label) atau collapse (sempit, hanya ikon)
    3. Menampilkan badge notifikasi denda belum bayar
    4. Area profil user + tombol logout di bawah

  RESPONSIF:
    - Desktop (≥768px): sidebar fixed di kiri, bisa toggle expand/collapse
    - Mobile (<768px): sidebar tersembunyi, muncul sebagai overlay saat toggle

  KONSEP ROLE-BASED ACCESS CONTROL (RBAC):
    Menu yang muncul BERBEDA tergantung role user:
    - Kasir:  POS, Data Penyewa, Pengembalian, Riwayat
    - Gudang: Inventaris, Paket, Status Aset
    - Owner:  SEMUA menu + Statistik, Cabang, Staff, Settings

    Ini diterapkan dengan cara FILTER array menuItems berdasarkan role.
  ============================================================
-->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores'; // Info halaman aktif (URL)
	import { base } from '$app/paths'; // Base path app (biasanya kosong)

	// Import ikon dari library Lucide
	// Setiap menu item punya ikon berbeda untuk identifikasi visual
	import {
		LayoutDashboard, // Dashboard
		MonitorSmartphone, // POS (Point of Sale)
		Users, // Data Penyewa / Staff
		CalendarDays, // Kalender Booking
		RotateCcw, // Pengembalian
		History, // Riwayat Transaksi
		Package, // Inventaris
		Boxes, // Paket Bundling
		Wrench, // Status Aset
		BarChart3, // Statistik
		Store, // Manajemen Cabang
		Settings, // Pengaturan
		LogOut, // Tombol Logout
		FileText // Log Aktivitas
	} from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} userProfile - data profil user (nama, role, avatar)
	 * @property {boolean} [expanded] - status buka/tutup sidebar ($bindable)
	 * @property {number} [unpaidDendaCount] - jumlah customer dengan denda
	 */

	/** @type {Props} */
	let { userProfile, expanded = $bindable(true), unpaidDendaCount = 0 } = $props();
	// $bindable: parent bisa mengontrol 'expanded' dengan bind:expanded={variable}
	// Dan sidebar sendiri bisa mengubah 'expanded' (saat user klik logo → toggle)

	// Flag untuk mencegah animasi CSS saat pertama kali render
	// (sama seperti di (app)/+layout.svelte)
	let isReady = $state(false);

	onMount(() => {
		setTimeout(() => {
			isReady = true;
		}, 100);
	});

	// ─────────────────────────────────────────────────
	// ACTIVE STATE — menentukan menu mana yang sedang aktif
	// ─────────────────────────────────────────────────

	// $derived = otomatis update saat $page berubah (user navigasi)
	// Derived state to check current path
	let currentPath = $derived($page.url.pathname);

	// Cek apakah path tertentu sedang aktif
	// Contoh: isActive('/dashboard') → true jika URL = /dashboard atau /dashboard/xxx
	/** @param {string} path */
	function isActive(path) {
		if (path === '/' && currentPath === '/') return true;
		// startsWith: /customers cocok dengan /customers, /customers/123, dll
		if (path !== '/' && currentPath.startsWith(path)) return true;
		return false;
	}

	// ─────────────────────────────────────────────────
	// MENU ITEMS — definisi seluruh menu navigasi
	// ─────────────────────────────────────────────────
	// Setiap item bisa berupa:
	//   1. LINK: { icon, label, href, roles } — item menu yang bisa diklik
	//   2. SECTION: { section, roles } — header pemisah grup (contoh: "KASIR", "GUDANG")
	//
	// 'roles' menentukan menu ini TAMPIL untuk role apa saja

	const menuItems = [
		// Dashboard — tampil untuk SEMUA role
		{
			icon: LayoutDashboard,
			label: 'Dashboard',
			href: '/dashboard',
			roles: ['owner', 'kasir', 'gudang']
		},

		// --- GRUP KASIR ---
		{ section: 'KASIR', roles: ['kasir', 'owner'] },
		{ icon: MonitorSmartphone, label: 'POS', href: '/pos', roles: ['kasir'] },
		{ icon: Users, label: 'Data Penyewa', href: '/customers', roles: ['kasir'] },
		{ icon: CalendarDays, label: 'Kalender Booking', href: '/booking', roles: ['kasir', 'gudang'] },
		{ icon: RotateCcw, label: 'Pengembalian', href: '/returns', roles: ['kasir'] },
		{ icon: History, label: 'Riwayat', href: '/transactions', roles: ['kasir', 'owner'] },

		// --- GRUP GUDANG ---
		{ section: 'GUDANG', roles: ['gudang'] },
		{ icon: Package, label: 'Inventaris', href: '/inventory', roles: ['gudang'] },
		{ icon: Boxes, label: 'Paket Bundling', href: '/packages', roles: ['gudang'] },
		{ icon: Wrench, label: 'Status Aset', href: '/asset-status', roles: ['gudang'] },

		// --- GRUP OWNER ---
		{ section: 'OWNER', roles: ['owner'] },
		{ icon: BarChart3, label: 'Statistik', href: '/statistics', roles: ['owner'] },
		{ icon: Store, label: 'Manajemen Cabang', href: '/branches', roles: ['owner'] },
		{ icon: Users, label: 'Manajemen Staff', href: '/staff', roles: ['owner'] },
		{ icon: Settings, label: 'Pengaturan Sistem', href: '/settings', roles: ['owner'] },
		{ icon: FileText, label: 'Log Aktivitas', href: '/activity-log', roles: ['owner'] }
	];

	// Filter menu items based on user role
	// $derived: otomatis difilter ulang jika userProfile berubah
	// .filter() = hanya tampilkan item yang role-nya cocok dengan role user
	let visibleItems = $derived(menuItems.filter((item) => item.roles.includes(userProfile?.role)));
</script>

<!-- ═══════ SIDEBAR CONTAINER ═══════
     fixed top-0 left-0 = menempel di kiri atas layar
     z-40 = di atas konten halaman, di bawah overlay mobile
     h-screen = setinggi layar
     bg-gradient-to-b = gradient dari hijau gelap ke hijau
     
     Animasi:
     - expanded: translate-x-0 (terlihat)
     - collapsed mobile: -translate-x-full (tersembunyi di luar layar kiri)
     - collapsed desktop: tetap terlihat tapi sempit (72px)
     
     Lebar:
     - expanded: 260px (label + ikon terlihat)
     - collapsed desktop: 72px (hanya ikon) -->
<aside
	class="fixed top-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-[#385624]/30 bg-gradient-to-b from-[#182C0D] to-[#254514] text-white select-none
		{isReady ? 'transition-all duration-250' : ''}
		{expanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
		w-[260px] {expanded ? 'md:w-[260px]' : 'md:w-[72px]'}"
>
	<!-- ═══════ LOGO AREA ═══════
	     Klik logo = toggle sidebar expand/collapse
	     bg-black/15 = sedikit lebih gelap dari sidebar body -->
	<button
		class="group flex h-16 w-full shrink-0 cursor-pointer items-center border-b border-none border-white/5 bg-black/15 px-5 text-left focus:outline-none"
		onclick={() => (expanded = !expanded)}
		title={expanded ? 'Sembunyikan Menu' : 'Tampilkan Menu'}
		aria-label="Toggle Sidebar"
	>
		<div class="flex w-full items-center gap-3 overflow-hidden">
			<!-- Logo icon — selalu tampil -->
			<img
				src="/logo.svg"
				alt="Logo BotaniRent"
				width="28"
				height="28"
				class="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
			/>
			<!-- Wordmark (teks "BotaniRent") — hanya tampil saat expanded
			     brightness-0 invert = ubah gambar menjadi putih (untuk dark bg) -->
			{#if expanded}
				<img
					src="/wordmark.svg"
					alt="BotaniRent"
					width="110"
					height="24"
					class="h-6 object-contain brightness-0 invert transition-opacity duration-300"
				/>
			{/if}
		</div>
	</button>

	<!-- ═══════ NAVIGATION LINKS ═══════
	     scrollbar-hide = sembunyikan scrollbar tapi masih bisa di-scroll
	     (lihat <style> di bawah) -->
	<div class="scrollbar-hide flex-1 overflow-y-auto py-4">
		<nav class="flex flex-col gap-1">
			<!-- Loop setiap item menu yang sudah difilter berdasarkan role -->
			{#each visibleItems as item (item.label || item.section)}
				{#if item.section}
					<!-- ═══ SECTION HEADER ═══
					     Judul grup (KASIR, GUDANG, OWNER)
					     Expanded: tampilkan teks
					     Collapsed: tampilkan garis pemisah tipis -->
					{#if expanded}
						<div class="mt-5 mb-1.5 flex items-center px-5">
							<span
								class="font-heading text-[10px] font-bold tracking-[0.15em] text-white/30 uppercase"
								>{item.section}</span
							>
						</div>
					{:else}
						<div class="mx-4 my-3 h-px bg-white/5"></div>
					{/if}
				{:else}
					<!-- ═══ MENU ITEM (link navigasi) ═══ -->
					{@const active = isActive(item.href || '')}
					<!-- @const = variabel lokal di dalam blok template Svelte -->

					<!-- eslint-disable-next-line -->
					<a
						href="{base}{item.href}"
						class="group relative flex h-11 items-center rounded-xl border border-transparent transition-all duration-200
							{expanded ? 'mx-3 px-4' : 'mx-3 justify-center'}
							{active
							? 'border-white/5 bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]'
							: 'text-white/60 hover:bg-white/5 hover:text-white'}"
						title={!expanded ? item.label : undefined}
						aria-label={item.label}
					>
						<!-- Indikator ACTIVE: garis kuning amber di kiri -->
						{#if active}
							<div
								class="absolute top-2.5 bottom-2.5 left-1.5 w-1 rounded-full bg-[var(--color-amber)]"
							></div>
						{/if}

						<!-- IKON menu
						     active: ikon berwarna amber (kuning)
						     inactive: ikon putih transparan -->
						{#if item.icon}
							{@const Icon = item.icon}
							<Icon
								size={20}
								class="shrink-0 transition-transform duration-200 group-hover:scale-105 {active
									? 'text-[var(--color-amber)]'
									: 'text-white/60 group-hover:text-white'}"
							/>
						{/if}

						<!-- LABEL menu (hanya tampil saat expanded) -->
						{#if expanded}
							<span
								class="ml-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-200"
								>{item.label}</span
							>
							<!-- BADGE DENDA: lingkaran merah di menu "Data Penyewa"
							     Menampilkan jumlah customer yang punya denda belum bayar -->
							{#if item.href === '/customers' && unpaidDendaCount > 0}
								<span class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white leading-none">
									{unpaidDendaCount}
								</span>
							{/if}
						{/if}

						<!-- BADGE DENDA versi COLLAPSED (ikon kecil di pojok kanan atas) -->
						{#if !expanded && item.href === '/customers' && unpaidDendaCount > 0}
							<span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white leading-none shadow-sm">
								{unpaidDendaCount}
							</span>
						{/if}
					</a>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- ═══════ USER AREA (di bawah sidebar) ═══════ -->
	{#if expanded}
		<!-- EXPANDED: Tampilkan kartu profil user -->
		<div
			class="mx-3 mb-4 shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner backdrop-blur-sm transition-all duration-200"
		>
			<div class="flex items-center gap-3 overflow-hidden">
				<!-- Avatar: huruf pertama nama user dalam lingkaran gradient -->
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-forest-light)] text-sm font-bold text-white uppercase shadow-sm"
				>
					{userProfile?.full_name?.charAt(0) || 'U'}
				</div>
				<!-- Info user: nama + role -->
				<div class="flex min-w-0 flex-1 flex-col">
					<p class="truncate text-xs leading-tight font-semibold text-white">
						{userProfile?.full_name || 'User'}
					</p>
					<p class="mt-0.5 truncate text-[10px] leading-none text-white/50 capitalize">
						{userProfile?.role || 'Guest'}
					</p>
				</div>
				<!-- Tombol LOGOUT
				     Menggunakan <form> dengan method POST ke /logout
				     Ini lebih aman daripada link GET (mencegah CSRF) -->
				<form action="/logout" method="POST" class="m-0 shrink-0">
					<button
						class="cursor-pointer rounded-lg p-1.5 text-white/40 transition-all duration-200 hover:bg-white/10 hover:text-[var(--color-terracotta)]"
						title="Keluar"
					>
						<LogOut size={16} />
					</button>
				</form>
			</div>
		</div>
	{:else}
		<!-- COLLAPSED: Tampilkan hanya avatar + tombol logout -->
		<div class="mb-4 flex shrink-0 flex-col items-center gap-3 transition-all duration-200">
			<div
				class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-forest-light)] text-sm font-bold text-white uppercase shadow-md transition-transform hover:scale-105"
				title="{userProfile?.full_name || 'User'} ({userProfile?.role || 'Guest'})"
			>
				{userProfile?.full_name?.charAt(0) || 'U'}
			</div>
			<form action="/logout" method="POST" class="m-0">
				<button
					class="cursor-pointer rounded-lg p-2 text-white/40 transition-all duration-200 hover:bg-white/10 hover:text-[var(--color-terracotta)]"
					title="Keluar"
				>
					<LogOut size={18} />
				</button>
			</form>
		</div>
	{/if}
</aside>

<!-- CSS khusus: sembunyikan scrollbar tapi tetap bisa scroll -->
<style>
	/* Hide scrollbar for nav area but allow scrolling */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE/Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
