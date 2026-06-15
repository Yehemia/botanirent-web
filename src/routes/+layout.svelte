<script>
	import '../app.css';
	import { Toaster } from 'svelte-sonner';

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
