<script>
	import { Plus, Boxes, Search, Edit, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();
	let packages = $derived(data.packages);
	let role = $derived(data.role);

	let searchQuery = $state('');

	let filteredPackages = $derived(
		packages.filter((/** @type {any} */ pkg) =>
			pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	/**
	 * @param {any} pkg
	 * @returns {import('@sveltejs/kit').SubmitFunction}
	 */
	const handleDeleteSubmit = (pkg) => {
		return ({ cancel }) => {
			if (!confirm(`Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`)) {
				cancel();
				return;
			}
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					toast.success(`Paket "${pkg.name}" berhasil dihapus.`);
				} else if (result.type === 'failure') {
					toast.error(result.data?.error || 'Gagal menghapus paket.');
				} else {
					toast.error('Terjadi kesalahan sistem.');
				}
			};
		};
	};
</script>

<div class="mx-auto max-w-7xl space-y-6 pb-12">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Paket Bundling</h1>
			<p class="mt-1 text-[var(--color-stone)]">Kelola paket sewa gabungan dengan harga khusus.</p>
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
		<Input type="text" bind:value={searchQuery} placeholder="Cari nama paket..." class="max-w-md">
			{#snippet iconLeft()}
				<Search size={18} />
			{/snippet}
		</Input>
	</Card>

	<!-- Grid -->
	{#if filteredPackages.length === 0}
		<Card padding="lg" class="text-center text-[var(--color-stone)]">
			<Boxes size={48} class="mx-auto mb-3 opacity-20" />
			<p class="text-lg font-medium text-[var(--color-earth)]">Tidak ada paket ditemukan</p>
			<p class="mt-1 text-sm">Silakan buat paket bundling baru untuk penyewa Anda.</p>
		</Card>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredPackages as pkg (pkg.id)}
				<Card
					padding="none"
					class="group flex h-full flex-col overflow-hidden transition-all hover:border-[var(--color-forest)]/30"
				>
					<!-- Gambar -->
					<div
						class="relative h-48 overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-sand)]"
					>
						{#if pkg.image_url}
							<img src={pkg.image_url} alt={pkg.name} class="h-full w-full object-cover" />
						{:else}
							<div
								class="absolute inset-0 flex items-center justify-center text-[var(--color-stone)] opacity-50"
							>
								<Boxes size={48} />
							</div>
						{/if}
						<div class="absolute top-3 right-3">
							{#if pkg.is_active}
								<Badge variant="success">Aktif</Badge>
							{:else}
								<Badge variant="neutral">Nonaktif</Badge>
							{/if}
						</div>
					</div>

					<!-- Info -->
					<div class="flex flex-1 flex-col p-5">
						<div class="mb-2 flex items-start justify-between">
							<h3
								class="truncate font-heading text-lg font-bold text-[var(--color-earth)]"
								title={pkg.name}
							>
								{pkg.name}
							</h3>
						</div>

						<p class="mb-4 line-clamp-2 flex-1 text-sm text-[var(--color-stone)]">
							{pkg.description || 'Tidak ada deskripsi'}
						</p>

						<div
							class="mt-auto flex items-center justify-between border-t border-[var(--color-border-light)] pt-4"
						>
							<div>
								<p class="mb-0.5 text-xs text-[var(--color-stone)]">Isi Paket</p>
								<p class="font-medium text-[var(--color-earth)]">
									{pkg.package_items?.[0]?.count || 0} Barang
								</p>
							</div>
							<div class="text-right">
								<p class="mb-0.5 text-xs text-[var(--color-stone)]">Harga Sewa</p>
								<p class="text-lg font-bold text-[var(--color-forest)]">
									{formatCurrency(pkg.package_price)}
								</p>
							</div>
						</div>
					</div>

					<!-- Actions Bar -->
					{#if role === 'owner' || role === 'gudang'}
						<div class="flex border-t border-[var(--color-border-light)] bg-[var(--color-cream)]/10 px-5 py-3 gap-2">
							<a
								href="/packages/{pkg.id}"
								class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-light)] bg-white py-2 text-xs font-bold text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-forest)]"
							>
								<Edit size={14} /> Edit
							</a>
							<form
								method="POST"
								action="?/deletePackage"
								use:enhance={handleDeleteSubmit(pkg)}
								class="flex flex-1"
							>
								<input type="hidden" name="id" value={pkg.id} />
								<button
									type="submit"
									class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-light)] bg-white py-2 text-xs font-bold text-[var(--color-stone)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
								>
									<Trash2 size={14} /> Hapus
								</button>
							</form>
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>
