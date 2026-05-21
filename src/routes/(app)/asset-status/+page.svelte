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
		assets.filter((/** @type {any} */ a) => 
			a.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
			a.item?.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const columns = [
		{ id: 'ready', title: 'Siap Disewa', icon: PackageCheck, color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/10', border: 'border-[var(--color-success)]/30' },
		{ id: 'rented', title: 'Sedang Disewa', icon: Tent, color: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info)]/10', border: 'border-[var(--color-info)]/30' },
		{ id: 'washing', title: 'Dicuci', icon: Waves, color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/10', border: 'border-[var(--color-primary)]/30' },
		{ id: 'maintenance', title: 'Perbaikan', icon: Wrench, color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]/10', border: 'border-[var(--color-warning)]/30' }
	];

	/** @param {string} status */
	function getAssetsByStatus(status) {
		return filteredAssets.filter((/** @type {any} */ a) => a.status === status);
	}


</script>

<div class="space-y-6 max-w-[1400px] mx-auto pb-12 overflow-x-hidden">
	<!-- Header -->
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Status Aset Fisik</h1>
			<p class="text-[var(--color-stone)] mt-1">Pantau pergerakan setiap unit fisik barang sewa Anda (Kanban Board).</p>
		</div>
		<Input 
			bind:value={searchQuery} 
			placeholder="Cari nama atau kode aset..." 
			class="w-full md:w-72 shadow-sm"
		>
			{#snippet iconLeft()}
				<Search size={18} />
			{/snippet}
		</Input>
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium text-sm">
			{form.error}
		</div>
	{/if}

	<!-- Kanban Board Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-start">
		{#each columns as col}
			{@const colAssets = getAssetsByStatus(col.id)}
			{@const Icon = col.icon}
			<div class="flex flex-col bg-[var(--color-sand-lightest)]/50 rounded-2xl border border-[var(--color-border)] h-[75vh] overflow-hidden">
				
				<!-- Column Header -->
				<div class="p-4 border-b border-[var(--color-border)] bg-white flex justify-between items-center shrink-0">
					<div class="flex items-center gap-2">
						<div class="p-1.5 rounded-lg {col.bg} {col.color}">
							<Icon size={18} />
						</div>
						<h2 class="font-bold font-heading text-[var(--color-earth)]">{col.title}</h2>
					</div>
					<Badge variant="neutral" class="bg-[var(--color-sand)]">{colAssets.length}</Badge>
				</div>

				<!-- Column Body (Scrollable) -->
				<div class="p-3 flex-1 overflow-y-auto space-y-3">
					{#if colAssets.length === 0}
						<div class="h-32 flex items-center justify-center border-2 border-dashed border-[var(--color-border-light)] rounded-xl text-[var(--color-stone)] text-sm">
							Kosong
						</div>
					{:else}
						{#each colAssets as asset (asset.id)}
							<div class="bg-white rounded-xl border border-[var(--color-border)] p-3 shadow-sm hover:shadow-md transition-all group relative {updatingId === asset.id ? 'opacity-50 pointer-events-none' : ''}">
								<div class="flex justify-between items-start mb-2">
									<span class="inline-block px-2 py-1 bg-[var(--color-sand)] text-[var(--color-earth)] text-xs font-mono font-bold rounded-md">
										{asset.asset_code}
									</span>
								</div>
								<h3 class="font-semibold text-sm text-[var(--color-earth)] line-clamp-2 leading-snug mb-3">
									{asset.item?.name}
								</h3>
								<div class="text-[10px] text-[var(--color-stone)]">
									Update: {formatDate(asset.last_status_change, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
								</div>

								<!-- Status Change Actions (Hover) -->
								<div class="absolute inset-x-0 bottom-0 top-auto translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all bg-white/95 backdrop-blur border-t border-[var(--color-border-light)] p-2 rounded-b-xl flex flex-wrap gap-1 justify-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
												class="flex-1 min-w-[30%]"
											>
												<input type="hidden" name="id" value={asset.id} />
												<input type="hidden" name="status" value={targetCol.id} />
												<button 
													type="submit" 
													class="w-full text-[10px] font-medium py-1 px-1 rounded-md transition-colors border {targetCol.color} {targetCol.bg} {targetCol.border} hover:opacity-80 flex flex-col items-center gap-0.5"
													title="Pindah ke {targetCol.title}"
												>
													<TargetIcon size={12} />
													<span class="truncate w-full text-center">{targetCol.title.split(' ')[0]}</span>
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
