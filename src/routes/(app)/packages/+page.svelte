<script>
	import { Plus, Boxes, Search, Edit, Trash2 } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();
	let { packages } = data;

	let searchQuery = $state('');

	let filteredPackages = $derived(
		packages.filter(pkg => 
			pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function formatCurrency(amount) {
		if (amount == null) return '-';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Paket Bundling</h1>
			<p class="text-[var(--color-stone)] mt-1">Kelola paket sewa gabungan dengan harga khusus.</p>
		</div>
		<!-- eslint-disable-next-line -->
		<a href="/packages/new" class="w-full sm:w-auto">
			<Button class="w-full">
				<Plus size={18} class="mr-2" /> Buat Paket Baru
			</Button>
		</a>
	</div>

	<!-- Search -->
	<Card padding="md">
		<div class="relative max-w-md">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
				<Search size={18} />
			</div>
			<input 
				type="text" 
				bind:value={searchQuery} 
				placeholder="Cari nama paket..." 
				class="w-full pl-10 pr-4 py-2 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
			>
		</div>
	</Card>

	<!-- Grid -->
	{#if filteredPackages.length === 0}
		<Card padding="xl" class="text-center text-[var(--color-stone)]">
			<Boxes size={48} class="mx-auto mb-3 opacity-20" />
			<p class="text-lg font-medium text-[var(--color-earth)]">Tidak ada paket ditemukan</p>
			<p class="text-sm mt-1">Silakan buat paket bundling baru untuk penyewa Anda.</p>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredPackages as pkg (pkg.id)}
				<Card padding="none" class="flex flex-col h-full overflow-hidden group hover:border-[var(--color-forest)]/30 transition-all">
					<!-- Gambar -->
					<div class="h-48 bg-[var(--color-sand)] relative overflow-hidden border-b border-[var(--color-border-light)]">
						{#if pkg.image_url}
							<img src={pkg.image_url} alt={pkg.name} class="w-full h-full object-cover" />
						{:else}
							<div class="absolute inset-0 flex items-center justify-center text-[var(--color-stone)] opacity-50">
								<Boxes size={48} />
							</div>
						{/if}
						<div class="absolute top-3 right-3">
							{#if pkg.is_active}
								<Badge variant="success">Aktif</Badge>
							{:else}
								<Badge variant="default">Nonaktif</Badge>
							{/if}
						</div>
					</div>

					<!-- Info -->
					<div class="p-5 flex-1 flex flex-col">
						<div class="flex justify-between items-start mb-2">
							<h3 class="font-bold font-heading text-lg text-[var(--color-earth)] truncate" title={pkg.name}>
								{pkg.name}
							</h3>
						</div>
						
						<p class="text-sm text-[var(--color-stone)] line-clamp-2 mb-4 flex-1">
							{pkg.description || 'Tidak ada deskripsi'}
						</p>

						<div class="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-border-light)]">
							<div>
								<p class="text-xs text-[var(--color-stone)] mb-0.5">Isi Paket</p>
								<p class="font-medium text-[var(--color-earth)]">{pkg.package_items?.[0]?.count || 0} Barang</p>
							</div>
							<div class="text-right">
								<p class="text-xs text-[var(--color-stone)] mb-0.5">Harga Sewa</p>
								<p class="font-bold text-[var(--color-forest)] text-lg">{formatCurrency(pkg.package_price)}</p>
							</div>
						</div>
					</div>

					<!-- Actions Overlay -->
					<div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
						<!-- eslint-disable-next-line -->
						<a href="/packages/{pkg.id}" class="p-2 bg-white rounded-lg shadow-sm text-[var(--color-stone)] hover:text-[var(--color-forest)] transition-colors">
							<Edit size={16} />
						</a>
						<button type="button" class="p-2 bg-white rounded-lg shadow-sm text-[var(--color-stone)] hover:text-[var(--color-error)] transition-colors">
							<Trash2 size={16} />
						</button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
