<script>
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	let sidebarExpanded = $state(false);
	let isReady = $state(false);

	onMount(() => {
		if (window.innerWidth >= 768) {
			sidebarExpanded = true;
		}

		const unsubscribe = page.subscribe(() => {
			if (window.innerWidth < 768) {
				sidebarExpanded = false;
			}
		});

		setTimeout(() => {
			isReady = true;
		}, 100);

		return unsubscribe;
	});

	function toggleSidebar() {
		sidebarExpanded = !sidebarExpanded;
	}

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

<div class="relative flex h-screen overflow-hidden bg-[var(--color-cream)]">
	<Sidebar bind:expanded={sidebarExpanded} userProfile={data.profile} unpaidDendaCount={data.unpaidDendaCount} />

	{#if sidebarExpanded}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-30 bg-black/40 transition-opacity duration-250 md:hidden"
			onclick={toggleSidebar}
		></div>
	{/if}

	<div
		class="ml-0 flex min-w-0 flex-1 flex-col {isReady ? 'transition-all duration-250' : ''} {sidebarExpanded
			? 'md:ml-[260px]'
			: 'md:ml-[72px]'}"
	>
		<TopBar
			{sidebarExpanded}
			title={pageTitle()}
			userProfile={data.profile}
			branch={data.branch}
			branches={data.branches}
			{toggleSidebar}
		/>

		<main class="flex-1 overflow-y-auto p-4 md:p-6">
			<div class="mx-auto w-full max-w-7xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>
