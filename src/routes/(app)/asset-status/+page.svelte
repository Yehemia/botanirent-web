<script>
	import { enhance } from '$app/forms';
	import { Tent, Wrench, Waves, PackageCheck, Search, ArrowRight, ArrowLeft } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { formatDate } from '$lib/utils/format';

	let { data, form } = $props();
	let assets = $derived(data.assets);

	let searchQuery = $state('');
	let updatingId = $state(null);

	let filteredAssets = $derived(
		assets.filter(
			(/** @type {any} */ a) =>
				a.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				a.item?.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const columns = [
		{
			id: 'ready',
			title: 'Siap Disewa',
			icon: PackageCheck,
			color: 'text-[var(--color-success)]',
			bg: 'bg-[var(--color-success)]/10',
			border: 'border-[var(--color-success)]/30'
		},
		{
			id: 'rented',
			title: 'Sedang Disewa',
			icon: Tent,
			color: 'text-[var(--color-info)]',
			bg: 'bg-[var(--color-info)]/10',
			border: 'border-[var(--color-info)]/30'
		},
		{
			id: 'washing',
			title: 'Dicuci',
			icon: Waves,
			color: 'text-[var(--color-primary)]',
			bg: 'bg-[var(--color-primary)]/10',
			border: 'border-[var(--color-primary)]/30'
		},
		{
			id: 'maintenance',
			title: 'Perbaikan',
			icon: Wrench,
			color: 'text-[var(--color-warning)]',
			bg: 'bg-[var(--color-warning)]/10',
			border: 'border-[var(--color-warning)]/30'
		}
	];

	/** @param {string} status */
	function getAssetsByStatus(status) {
		return filteredAssets.filter((/** @type {any} */ a) => a.status === status);
	}
</script>

<div class="mx-auto max-w-[1400px] space-y-6 overflow-x-hidden pb-12">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Status Aset Fisik</h1>
			<p class="mt-1 text-[var(--color-stone)]">
				Pantau pergerakan setiap unit fisik barang sewa Anda (Kanban Board).
			</p>
		</div>
		<Input
			bind:value={searchQuery}
			placeholder="Cari nama atau kode aset..."
			class="w-full shadow-sm md:w-72"
		>
			{#snippet iconLeft()}
				<Search size={18} />
			{/snippet}
		</Input>
	</div>

	{#if form?.error}
		<div
			class="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm font-medium text-[var(--color-error)]"
		>
			{form.error}
		</div>
	{/if}

	<!-- Kanban Board Grid -->
	<div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
		{#each columns as col}
			{@const colAssets = getAssetsByStatus(col.id)}
			{@const Icon = col.icon}
			<div
				class="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)]/50"
			>
				<!-- Column Header -->
				<div
					class="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white p-4"
				>
					<div class="flex items-center gap-2">
						<div class="rounded-lg p-1.5 {col.bg} {col.color}">
							<Icon size={18} />
						</div>
						<h2 class="font-heading font-bold text-[var(--color-earth)]">{col.title}</h2>
					</div>
					<Badge variant="neutral" class="bg-[var(--color-sand)]">{colAssets.length}</Badge>
				</div>

				<!-- Column Body (Scrollable) -->
				<div class="flex-1 space-y-3 overflow-y-auto p-3">
					{#if colAssets.length === 0}
						<div
							class="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border-light)] text-sm text-[var(--color-stone)]"
						>
							Kosong
						</div>
					{:else}
						{#each colAssets as asset (asset.id)}
							<div
								class="group relative rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm transition-all hover:shadow-md {updatingId ===
								asset.id
									? 'pointer-events-none opacity-50'
									: ''}"
							>
								<div class="mb-2 flex items-start justify-between">
									<span
										class="inline-block rounded-md bg-[var(--color-sand)] px-2 py-1 font-mono text-xs font-bold text-[var(--color-earth)]"
									>
										{asset.asset_code}
									</span>
								</div>
								<h3
									class="mb-3 line-clamp-2 text-sm leading-snug font-semibold text-[var(--color-earth)]"
								>
									{asset.item?.name}
								</h3>
								<div class="text-[10px] text-[var(--color-stone)]">
									Update: {formatDate(asset.last_status_change, {
										day: '2-digit',
										month: 'short',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</div>

								<!-- Status Change Actions (Hover) -->
								<div
									class="absolute inset-x-0 top-auto bottom-0 z-10 flex translate-y-full flex-wrap justify-center gap-1 rounded-b-xl border-t border-[var(--color-border-light)] bg-white/95 p-2 opacity-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100"
								>
									{#each columns as targetCol}
										{@const TargetIcon = targetCol.icon}
										{#if targetCol.id !== col.id}
											<form
												method="POST"
												action="?/updateStatus"
												use:enhance={() => {
													updatingId = asset.id;
													return async ({ update }) => {
														await update();
														updatingId = null;
													};
												}}
												class="min-w-[30%] flex-1"
											>
												<input type="hidden" name="id" value={asset.id} />
												<input type="hidden" name="status" value={targetCol.id} />
												<button
													type="submit"
													class="w-full rounded-md border px-1 py-1 text-[10px] font-medium transition-colors {targetCol.color} {targetCol.bg} {targetCol.border} flex flex-col items-center gap-0.5 hover:opacity-80"
													title="Pindah ke {targetCol.title}"
												>
													<TargetIcon size={12} />
													<span class="w-full truncate text-center"
														>{targetCol.title.split(' ')[0]}</span
													>
												</button>
											</form>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
