<script>
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import { page } from '$app/stores';

	let { data, children } = $props();
	
	// Local state for sidebar toggle (handled by runes)
	let sidebarExpanded = $state(true);
	
	function toggleSidebar() {
		sidebarExpanded = !sidebarExpanded;
	}

	// Derive page title from path or meta
	let pageTitle = $derived(() => {
		const path = $page.url.pathname;
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
		return 'BotaniRent';
	});
</script>

<div class="flex h-screen overflow-hidden bg-[var(--color-cream)]">
	<Sidebar 
		bind:expanded={sidebarExpanded} 
		userProfile={data.profile} 
	/>
	
	<div 
		class="flex-1 flex flex-col min-w-0 transition-all duration-250"
		style="margin-left: {sidebarExpanded ? '260px' : '72px'};"
	>
		<!-- Default TopBar, but can be overridden by specific pages if needed (like POS) -->
		<TopBar 
			{sidebarExpanded} 
			title={pageTitle()}
			userProfile={data.profile}
			branch={data.branch}
			branches={data.branches}
			{toggleSidebar}
		/>
		
		<main class="flex-1 overflow-y-auto p-6">
			<div class="max-w-7xl mx-auto w-full">
				{@render children()}
			</div>
		</main>
	</div>
</div>
