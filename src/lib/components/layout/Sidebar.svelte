<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import {
		LayoutDashboard,
		MonitorSmartphone,
		Users,
		CalendarDays,
		RotateCcw,
		History,
		Package,
		Boxes,
		Wrench,
		BarChart3,
		Store,
		Settings,
		LogOut,
		FileText
	} from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} userProfile
	 * @property {boolean} [expanded]
	 * @property {number} [unpaidDendaCount]
	 */

	/** @type {Props} */
	let { userProfile, expanded = $bindable(true), unpaidDendaCount = 0 } = $props();

	let isReady = $state(false);

	onMount(() => {
		setTimeout(() => {
			isReady = true;
		}, 100);
	});

	// Derived state to check current path
	let currentPath = $derived($page.url.pathname);

	/** @param {string} path */
	function isActive(path) {
		if (path === '/' && currentPath === '/') return true;
		if (path !== '/' && currentPath.startsWith(path)) return true;
		return false;
	}

	const menuItems = [
		{
			icon: LayoutDashboard,
			label: 'Dashboard',
			href: '/dashboard',
			roles: ['owner', 'kasir', 'gudang']
		},

		// --- KASIR ---
		{ section: 'KASIR', roles: ['kasir', 'owner'] },
		{ icon: MonitorSmartphone, label: 'POS', href: '/pos', roles: ['kasir'] },
		{ icon: Users, label: 'Data Penyewa', href: '/customers', roles: ['kasir', 'owner'] },
		{ icon: CalendarDays, label: 'Kalender Booking', href: '/booking', roles: ['kasir', 'gudang', 'owner'] },
		{ icon: RotateCcw, label: 'Pengembalian', href: '/returns', roles: ['kasir'] },
		{ icon: History, label: 'Riwayat', href: '/transactions', roles: ['kasir', 'owner'] },

		// --- GUDANG ---
		{ section: 'GUDANG', roles: ['gudang'] },
		{ icon: Package, label: 'Inventaris', href: '/inventory', roles: ['gudang'] },
		{ icon: Boxes, label: 'Paket Bundling', href: '/packages', roles: ['gudang'] },
		{ icon: Wrench, label: 'Status Aset', href: '/asset-status', roles: ['gudang'] },

		// --- OWNER ---
		{ section: 'OWNER', roles: ['owner'] },
		{ icon: BarChart3, label: 'Statistik', href: '/statistics', roles: ['owner'] },
		{ icon: Store, label: 'Manajemen Cabang', href: '/branches', roles: ['owner'] },
		{ icon: Users, label: 'Manajemen Staff', href: '/staff', roles: ['owner'] },
		{ icon: Settings, label: 'Pengaturan Sistem', href: '/settings', roles: ['owner'] },
		{ icon: FileText, label: 'Log Aktivitas', href: '/activity-log', roles: ['owner'] }
	];

	// Filter menu items based on user role
	let visibleItems = $derived(menuItems.filter((item) => item.roles.includes(userProfile?.role)));
</script>

<aside
	class="fixed top-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-[#385624]/30 bg-gradient-to-b from-[#182C0D] to-[#254514] text-white select-none
		{isReady ? 'transition-all duration-250' : ''}
		{expanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
		w-[260px] {expanded ? 'md:w-[260px]' : 'md:w-[72px]'}"
>
	<!-- Logo Area -->
	<button
		class="group flex h-16 w-full shrink-0 cursor-pointer items-center border-b border-none border-white/5 bg-black/15 px-5 text-left focus:outline-none"
		onclick={() => (expanded = !expanded)}
		title={expanded ? 'Sembunyikan Menu' : 'Tampilkan Menu'}
		aria-label="Toggle Sidebar"
	>
		<div class="flex w-full items-center gap-3 overflow-hidden">
			<!-- Logo Image -->
			<img
				src="/logo.svg"
				alt="Logo BotaniRent"
				width="28"
				height="28"
				class="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
			/>
			{#if expanded}
				<!-- Wordmark Image (using brightness-0 invert for readability on dark background) -->
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

	<!-- Navigation Links -->
	<div class="scrollbar-hide flex-1 overflow-y-auto py-4">
		<nav class="flex flex-col gap-1">
			{#each visibleItems as item (item.label || item.section)}
				{#if item.section}
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
					{@const active = isActive(item.href || '')}
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
						{#if active}
							<div
								class="absolute top-2.5 bottom-2.5 left-1.5 w-1 rounded-full bg-[var(--color-amber)]"
							></div>
						{/if}

						{#if item.icon}
							{@const Icon = item.icon}
							<Icon
								size={20}
								class="shrink-0 transition-transform duration-200 group-hover:scale-105 {active
									? 'text-[var(--color-amber)]'
									: 'text-white/60 group-hover:text-white'}"
							/>
						{/if}

						{#if expanded}
							<span
								class="ml-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-200"
								>{item.label}</span
							>
							{#if item.href === '/customers' && unpaidDendaCount > 0}
								<span class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white leading-none">
									{unpaidDendaCount}
								</span>
							{/if}
						{/if}

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

	<!-- User Area -->
	{#if expanded}
		<div
			class="mx-3 mb-4 shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner backdrop-blur-sm transition-all duration-200"
		>
			<div class="flex items-center gap-3 overflow-hidden">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-forest-light)] text-sm font-bold text-white uppercase shadow-sm"
				>
					{userProfile?.full_name?.charAt(0) || 'U'}
				</div>
				<div class="flex min-w-0 flex-1 flex-col">
					<p class="truncate text-xs leading-tight font-semibold text-white">
						{userProfile?.full_name || 'User'}
					</p>
					<p class="mt-0.5 truncate text-[10px] leading-none text-white/50 capitalize">
						{userProfile?.role || 'Guest'}
					</p>
				</div>
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

<style>
	/* Hide scrollbar for nav area but allow scrolling */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
