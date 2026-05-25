<script>
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
	 */

	/** @type {Props} */
	let { userProfile, expanded = $bindable(true) } = $props();

	// Derived state to check current path
	let currentPath = $derived($page.url.pathname);
	
	/** @param {string} path */
	function isActive(path) {
		if (path === '/' && currentPath === '/') return true;
		if (path !== '/' && currentPath.startsWith(path)) return true;
		return false;
	}

	const menuItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['owner', 'kasir', 'gudang'] },

		// --- KASIR ---
		{ section: 'KASIR', roles: ['kasir'] },
		{ icon: MonitorSmartphone, label: 'POS', href: '/pos', roles: ['kasir'] },
		{ icon: Users, label: 'Data Penyewa', href: '/customers', roles: ['kasir'] },
		{ icon: CalendarDays, label: 'Kalender Booking', href: '/booking', roles: ['kasir', 'gudang'] },
		{ icon: RotateCcw, label: 'Pengembalian', href: '/returns', roles: ['kasir'] },
		{ icon: History, label: 'Riwayat', href: '/transactions', roles: ['kasir'] },

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
	let visibleItems = $derived(
		menuItems.filter(item => item.roles.includes(userProfile?.role))
	);
</script>

<aside 
	class="bg-gradient-to-b from-[#182C0D] to-[#254514] border-r border-[#385624]/30 text-white transition-all duration-250 flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden select-none"
	style="width: {expanded ? '260px' : '72px'};"
>
	<!-- Logo Area -->
	<button 
		class="h-16 flex items-center px-5 shrink-0 bg-black/15 border-b border-white/5 group cursor-pointer w-full text-left focus:outline-none border-none"
		onclick={() => expanded = !expanded}
		title={expanded ? "Sembunyikan Menu" : "Tampilkan Menu"}
		aria-label="Toggle Sidebar"
	>
		<div class="flex items-center gap-3 w-full overflow-hidden">
			<!-- Logo Image -->
			<img 
				src="/logo.svg" 
				alt="Logo BotaniRent" 
				class="w-7 h-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105" 
			/>
			{#if expanded}
				<!-- Wordmark Image (using brightness-0 invert for readability on dark background) -->
				<img 
					src="/wordmark.svg" 
					alt="BotaniRent" 
					class="h-6 object-contain brightness-0 invert transition-opacity duration-300" 
				/>
			{/if}
		</div>
	</button>

	<!-- Navigation Links -->
	<div class="flex-1 overflow-y-auto py-4 scrollbar-hide">
		<nav class="flex flex-col gap-1">
			{#each visibleItems as item (item.label || item.section)}
				{#if item.section}
					{#if expanded}
						<div class="px-5 mt-5 mb-1.5 flex items-center">
							<span class="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold font-heading">{item.section}</span>
						</div>
					{:else}
						<div class="h-px bg-white/5 mx-4 my-3"></div>
					{/if}
				{:else}
					{@const active = isActive(item.href || '')}
					<!-- eslint-disable-next-line -->
					<a 
						href="{base}{item.href}"
						class="flex items-center h-11 rounded-xl transition-all duration-200 group relative border border-transparent
							{expanded ? 'px-4 mx-3' : 'justify-center mx-3'}
							{active 
								? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] border-white/5' 
								: 'text-white/60 hover:bg-white/5 hover:text-white'}"
						title={!expanded ? item.label : undefined}
					>
						{#if active}
							<div class="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-[var(--color-amber)] rounded-full"></div>
						{/if}
						
						{#if item.icon}
							{@const Icon = item.icon}
							<Icon size={20} class="shrink-0 transition-transform duration-200 group-hover:scale-105 {active ? 'text-[var(--color-amber)]' : 'text-white/60 group-hover:text-white'}" />
						{/if}
						
						{#if expanded}
							<span class="ml-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-200">{item.label}</span>
						{/if}
					</a>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- User Area -->
	{#if expanded}
		<div class="p-3 mx-3 mb-4 rounded-xl bg-white/5 border border-white/10 shrink-0 backdrop-blur-sm shadow-inner transition-all duration-200">
			<div class="flex items-center gap-3 overflow-hidden">
				<div class="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-forest-light)] flex items-center justify-center text-white shrink-0 font-bold text-sm uppercase border border-white/15 shadow-sm">
					{userProfile?.full_name?.charAt(0) || 'U'}
				</div>
				<div class="flex flex-col min-w-0 flex-1">
					<p class="text-xs font-semibold text-white truncate leading-tight">{userProfile?.full_name || 'User'}</p>
					<p class="text-[10px] text-white/50 truncate capitalize mt-0.5 leading-none">{userProfile?.role || 'Guest'}</p>
				</div>
				<form action="/logout" method="POST" class="m-0 shrink-0">
					<button 
						class="p-1.5 text-white/40 hover:text-[var(--color-terracotta)] hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer"
						title="Keluar"
					>
						<LogOut size={16} />
					</button>
				</form>
			</div>
		</div>
	{:else}
		<div class="mb-4 flex flex-col items-center gap-3 shrink-0 transition-all duration-200">
			<div 
				class="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-forest-light)] flex items-center justify-center text-white font-bold text-sm uppercase border border-white/15 shadow-md cursor-pointer hover:scale-105 transition-transform"
				title="{userProfile?.full_name || 'User'} ({userProfile?.role || 'Guest'})"
			>
				{userProfile?.full_name?.charAt(0) || 'U'}
			</div>
			<form action="/logout" method="POST" class="m-0">
				<button 
					class="p-2 text-white/40 hover:text-[var(--color-terracotta)] hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer"
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

