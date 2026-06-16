<script>
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	if (browser && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
		injectSpeedInsights();
	}

	let { children } = $props();
</script>

<svelte:head>
	<title>BotaniRent — Sistem Manajemen Rental & Retail Outdoor</title>
	<meta
		name="description"
		content="BotaniRent: POS dan manajemen inventaris terpadu untuk toko outdoor. Multi-cabang, transaksi hybrid sewa & jual."
	/>
</svelte:head>

{@render children()}
<Toaster richColors position="top-center" />
