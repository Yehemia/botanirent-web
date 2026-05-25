<script>
	import { page } from '$app/stores';
	import { Menu, Bell, ChevronRight, Home, ChevronDown } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} sidebarExpanded
	 * @property {string} title
	 * @property {any} userProfile
	 * @property {any} [branch]
	 * @property {() => void} toggleSidebar
	 */

	/** @type {Props} */
	let { sidebarExpanded, title, userProfile, branch, toggleSidebar } = $props();

	// Generate dynamic breadcrumb segments based on path
	let pathname = $derived($page.url.pathname);
	let breadcrumbs = $derived(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return [];
		
		// Map paths to readable Indonesian names
		/** @type {Record<string, string>} */
		const nameMap = {
			dashboard: 'Dashboard',
			pos: 'POS',
			checkout: 'Pembayaran',
			customers: 'Data Penyewa',
			booking: 'Kalender Booking',
			inventory: 'Inventaris',
			packages: 'Paket Bundling',
			'asset-status': 'Status Aset',
			returns: 'Pengembalian',
			transactions: 'Riwayat',
			statistics: 'Statistik',
			branches: 'Cabang',
			staff: 'Staff',
			settings: 'Pengaturan',
			'activity-log': 'Log Aktivitas'
		};

		return segments.map((seg, idx) => {
			const path = '/' + segments.slice(0, idx + 1).join('/');
			const label = nameMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
			return { label, path };
		});
	});
</script>

<header 
	class="h-16 bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)]/60 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-250 select-none"
>
	<!-- Left: Toggle & Breadcrumb/Title -->
	<div class="flex items-center gap-3">
		{#if sidebarExpanded}
			<button 
				class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-lg transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
				onclick={toggleSidebar}
				aria-label="Toggle Sidebar"
			>
				<Menu size={18} />
			</button>
		{/if}
		
		<!-- Breadcrumbs Navigation -->
		<div class="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--color-stone)] overflow-hidden">
			<a href="/dashboard" class="flex items-center text-[var(--color-stone)] hover:text-[var(--color-forest)] transition-colors gap-1">
				<Home size={14} class="translate-y-[-1px]" />
			</a>
			{#each breadcrumbs() as bc, idx}
				<ChevronRight size={12} class="text-[var(--color-muted)] shrink-0" />
				{#if idx === breadcrumbs().length - 1}
					<span class="text-sm font-semibold text-[var(--color-earth)] truncate max-w-[120px] md:max-w-none">{bc.label}</span>
				{:else}
					<a href={bc.path} class="hover:text-[var(--color-forest)] transition-colors truncate max-w-[100px]">{bc.label}</a>
				{/if}
			{/each}
		</div>
		
		<!-- Mobile Fallback Title -->
		<h1 class="sm:hidden text-base font-bold font-heading text-[var(--color-earth)] truncate">
			{title}
		</h1>
	</div>

	<!-- Right: Actions & User Info -->
	<div class="flex items-center gap-4">
		<!-- Branch Badge -->
		{#if userProfile?.branch_id}
			<div class="hidden md:flex items-center bg-[var(--color-sage-10)] text-[var(--color-forest)] border border-[var(--color-sage)]/10 px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 shadow-sm">
				<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse"></span>
				Cabang: {branch?.name || 'Cabang Aktif'}
			</div>
		{/if}

		<!-- Notifications -->
		<button class="relative p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-full transition-all duration-200 cursor-pointer active:scale-95 group">
			<Bell size={18} class="transition-transform duration-300 group-hover:rotate-12" />
			<span class="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full border border-white"></span>
		</button>

		<div class="h-6 w-px bg-[var(--color-border-light)] mx-1"></div>

		<!-- User Dropdown Trigger -->
		<button class="flex items-center gap-2 hover:bg-[var(--color-sand)] p-1 pr-2.5 rounded-full border border-transparent hover:border-[var(--color-border-light)] transition-all duration-200 cursor-pointer group shadow-sm bg-white">
			<!-- Avatar with gradient/border -->
			<div class="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-forest)] text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm border border-white/20 transition-transform group-hover:scale-105 duration-200">
				{userProfile?.full_name?.charAt(0) || 'U'}
			</div>
			<div class="hidden md:block text-left max-w-[120px]">
				<p class="text-[12px] font-bold text-[var(--color-earth)] leading-tight truncate">{userProfile?.full_name || 'User'}</p>
				<p class="text-[10px] text-[var(--color-stone)] capitalize leading-none mt-0.5">{userProfile?.role || 'Guest'}</p>
			</div>
			<ChevronDown size={14} class="text-[var(--color-stone)] transition-transform duration-200 group-hover:translate-y-0.5 shrink-0" />
		</button>
	</div>
</header>
