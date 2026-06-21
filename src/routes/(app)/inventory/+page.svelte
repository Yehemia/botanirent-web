<script>
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Plus, Search, Package, Filter, MoreHorizontal, Edit, Trash2, RefreshCw } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();
	let items = $derived(data.items);
	let categories = $derived(data.categories);

	let searchQuery = $state('');
	let selectedCategory = $state('all');

	// Filter items based on search and category
	let filteredItems = $derived(
		items.filter((/** @type {any} */ item) => {
			const matchSearch =
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
			return matchSearch && matchCategory;
		})
	);

	/**
	 * @param {any} item
	 * @returns {import('@sveltejs/kit').SubmitFunction}
	 */
	const handleDeactivateSubmit = (item) => {
		return ({ cancel }) => {
			if (!confirm(`Apakah Anda yakin ingin menonaktifkan barang "${item.name}"? Barang yang dinonaktifkan tidak akan muncul di katalog kasir (POS).`)) {
				cancel();
				return;
			}
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					toast.success(`Barang "${item.name}" berhasil dinonaktifkan.`);
				} else if (result.type === 'failure') {
					toast.error(result.data?.error || 'Gagal menonaktifkan barang.');
				} else {
					toast.error('Terjadi kesalahan sistem.');
				}
			};
		};
	};

	/**
	 * @param {any} item
	 * @returns {import('@sveltejs/kit').SubmitFunction}
	 */
	const handleActivateSubmit = (item) => {
		return () => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					toast.success(`Barang "${item.name}" berhasil diaktifkan kembali.`);
				} else if (result.type === 'failure') {
					toast.error(result.data?.error || 'Gagal mengaktifkan kembali barang.');
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
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Data Barang</h1>
			<p class="mt-1 text-[var(--color-stone)]">Kelola master data barang sewa dan retail.</p>
		</div>
		<div class="flex w-full items-center gap-3 sm:w-auto">
			<!-- eslint-disable-next-line -->
			<a href="/inventory/bulk-upload" class="flex-1 sm:flex-none">
				<Button variant="secondary" class="w-full">Bulk Upload</Button>
			</a>
			<!-- eslint-disable-next-line -->
			<a href="/inventory/new" class="flex-1 sm:flex-none">
				<Button class="w-full">
					<Plus size={18} class="mr-2" /> Tambah Barang
				</Button>
			</a>
		</div>
	</div>

	<!-- Controls (Search & Category) -->
	<Card padding="md">
		<div class="flex flex-col gap-4 md:flex-row">
			<Input bind:value={searchQuery} placeholder="Cari nama barang atau barcode..." class="flex-1">
				{#snippet iconLeft()}
					<Search size={18} />
				{/snippet}
			</Input>

			<Select bind:value={selectedCategory} class="w-full md:w-64">
				<option value="all">Semua Kategori</option>
				{#each categories as cat (cat.id)}
					<option value={cat.id}>{cat.name} ({cat.type})</option>
				{/each}
			</Select>
		</div>
	</Card>

	<!-- Data Table -->
	<Card padding="none" class="overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead
					class="border-b border-[var(--color-border)] bg-[var(--color-sand-light)] font-semibold text-[var(--color-earth)]"
				>
					<tr>
						<th class="px-6 py-4">Barang</th>
						<th class="px-6 py-4">Kategori</th>
						<th class="px-6 py-4">Harga Sewa / Jual</th>
						<th class="px-6 py-4">Stok (Tersedia / Total)</th>
						<th class="px-6 py-4">Status</th>
						<th class="px-6 py-4 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)]">
					{#if filteredItems.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center text-[var(--color-stone)]">
								<Package size={48} class="mx-auto mb-3 opacity-20" />
								<p class="text-lg font-medium">Tidak ada barang ditemukan</p>
								<p class="mt-1 text-sm">
									Coba sesuaikan kata kunci pencarian atau tambah barang baru.
								</p>
							</td>
						</tr>
					{:else}
						{#each filteredItems as item (item.id)}
							<tr class="group transition-colors hover:bg-[var(--color-sand-lightest)]/50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border-light)] bg-[var(--color-sand)]"
										>
											{#if item.image_url}
												<img
													src={item.image_url}
													alt={item.name}
													class="h-full w-full object-cover"
												/>
											{:else}
												<Package size={20} class="text-[var(--color-stone)] opacity-50" />
											{/if}
										</div>
										<div>
											<div
												class="max-w-[200px] truncate font-semibold text-[var(--color-earth)]"
												title={item.name}
											>
												{item.name}
											</div>
											<div class="font-mono text-xs text-[var(--color-stone)]">
												{item.barcode || '-'}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<Badge variant={item.category?.type === 'sewa' ? 'info' : 'warning'}>
										{item.category?.name || 'Unknown'}
									</Badge>
								</td>
								<td class="px-6 py-4">
									{#if item.category?.type === 'sewa'}
										<div class="font-medium text-[var(--color-forest)]">
											{formatCurrency(item.rental_price_per_day)}<span
												class="text-xs font-normal text-[var(--color-stone)]">/siklus</span
											>
										</div>
									{:else}
										<div class="font-medium text-[var(--color-terracotta)]">
											{formatCurrency(item.sell_price)}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-1.5">
										<span
											class="font-bold {item.stock_available > 0
												? 'text-[var(--color-success)]'
												: 'text-[var(--color-error)]'}"
										>
											{item.stock_available}
										</span>
										<span class="text-[var(--color-stone)]">/ {item.stock_total}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									{#if item.is_active}
										<Badge variant="success">Aktif</Badge>
									{:else}
										<Badge variant="neutral">Nonaktif</Badge>
									{/if}
								</td>
								<td class="px-6 py-4 text-right">
									<div
										class="flex justify-end items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<!-- eslint-disable-next-line -->
										<a
											href="/inventory/{item.id}"
											class="rounded-md p-1.5 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-forest)]/10 hover:text-[var(--color-forest)]"
											title="Edit"
										>
											<Edit size={16} />
										</a>
										
										{#if item.is_active}
											<form method="POST" action="?/deactivate" use:enhance={handleDeactivateSubmit(item)} class="inline">
												<input type="hidden" name="id" value={item.id} />
												<button
													type="submit"
													class="rounded-md p-1.5 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
													title="Nonaktifkan"
												>
													<Trash2 size={16} />
												</button>
											</form>
										{:else}
											<form method="POST" action="?/activate" use:enhance={handleActivateSubmit(item)} class="inline">
												<input type="hidden" name="id" value={item.id} />
												<button
													type="submit"
													class="rounded-md p-1.5 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-forest)]/10 hover:text-[var(--color-forest)]"
													title="Aktifkan Kembali"
												>
													<RefreshCw size={16} />
												</button>
											</form>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>
</div>
