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
		{ section: 'KASIR', roles: ['kasir', 'owner'] },
		{ icon: MonitorSmartphone, label: 'POS', href: '/pos', roles: ['kasir', 'owner'] },
		{ icon: Users, label: 'Data Penyewa', href: '/customers', roles: ['kasir', 'owner'] },
		{ icon: CalendarDays, label: 'Kalender Booking', href: '/booking', roles: ['kasir', 'owner', 'gudang'] },
		{ icon: RotateCcw, label: 'Pengembalian', href: '/returns', roles: ['kasir', 'owner'] },
		{ icon: History, label: 'Riwayat', href: '/transactions', roles: ['kasir', 'owner'] },

		// --- GUDANG ---
		{ section: 'GUDANG', roles: ['gudang', 'owner'] },
		{ icon: Package, label: 'Inventaris', href: '/inventory', roles: ['gudang', 'owner'] },
		{ icon: Boxes, label: 'Paket Bundling', href: '/packages', roles: ['gudang', 'owner'] },
		{ icon: Wrench, label: 'Status Aset', href: '/asset-status', roles: ['gudang', 'owner'] },

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
	class="bg-[var(--color-forest)] text-white transition-all duration-250 flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden"
	style="width: {expanded ? '260px' : '72px'};"
>
	<!-- Logo Area -->
	<div class="h-16 flex items-center px-5 shrink-0 bg-black/10">
		<div class="flex items-center gap-3 w-full overflow-hidden text-[var(--color-amber)]">
			<!-- Simple leaf/tent icon placeholder -->
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M12 2L2 22h20L12 2z"/><path d="M12 22V12"/></svg>
			{#if expanded}
				<span class="font-heading font-bold text-xl tracking-wide whitespace-nowrap">BotaniRent</span>
			{/if}
		</div>
	</div>

	<!-- Navigation Links -->
	<div class="flex-1 overflow-y-auto py-4 scrollbar-hide">
		<nav class="flex flex-col gap-1">
			{#each visibleItems as item (item.label || item.section)}
				{#if item.section}
					{#if expanded}
						<div class="px-5 mt-4 mb-2">
							<span class="text-[11px] uppercase tracking-wider text-white/50 font-semibold">{item.section}</span>
						</div>
					{:else}
						<div class="h-px bg-white/10 mx-4 my-2"></div>
					{/if}
				{:else}
					{@const active = isActive(item.href || '')}
					<!-- eslint-disable-next-line -->
					<a 
						href="{base}{item.href}"
						class="flex items-center px-5 py-3 mx-2 rounded-lg transition-colors group relative
							{active 
								? 'bg-white/15 text-white' 
								: 'text-white/70 hover:bg-white/10 hover:text-white'}"
						title={!expanded ? item.label : undefined}
					>
						{#if active && expanded}
							<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--color-amber)] rounded-r-md"></div>
						{/if}
						
						{#if item.icon}
							{@const Icon = item.icon}<Icon size={20} class="shrink-0 {active ? 'text-[var(--color-amber)]' : ''}" />
						{/if}
						
						{#if expanded}
							<span class="ml-3 text-[14px] font-medium whitespace-nowrap">{item.label}</span>
						{/if}
					</a>
				{/if}
			{/each}
		</nav>
	</div>

	<!-- User Area -->
	<div class="p-4 bg-black/20 shrink-0">
		<div class="flex items-center gap-3 overflow-hidden">
			<div class="w-10 h-10 rounded-full bg-[var(--color-sage)] flex items-center justify-center text-white shrink-0 font-bold uppercase">
				{userProfile?.full_name?.charAt(0) || 'U'}
			</div>
			{#if expanded}
				<div class="flex-col min-w-0 flex-1">
					<p class="text-sm font-medium text-white truncate">{userProfile?.full_name}</p>
					<p class="text-xs text-white/70 truncate capitalize">{userProfile?.role}</p>
				</div>
				<form action="/logout" method="POST">
					<button class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors">
						<LogOut size={18} />
					</button>
				</form>
			{/if}
		</div>
	</div>
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

