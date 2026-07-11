<script>
	import { Search, Receipt, ArrowRight, CheckCircle, Clock, ChevronLeft, ChevronRight, Filter } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	import { formatCurrency, formatDate } from '$lib/utils/format';

	let { data } = $props();
	let transactions = $derived(data.transactions);
	let currentPage = $derived(data.page);
	let totalCount = $derived(data.totalCount);
	let limit = $derived(data.limit);
	let totalPages = $derived(Math.ceil(totalCount / limit));
	let colSpan = $derived(data.profile?.role === 'owner' ? 6 : 5);

	// Filter state
	let searchVal = $state('');
	let selectedBranch = $state('');
	let selectedType = $state('');
	let selectedStatus = $state('');

	// Keep states in sync with loader data (e.g. back navigation or page loads)
	$effect(() => {
		searchVal = data.search || '';
		selectedBranch = data.filters?.branchId || '';
		selectedType = data.filters?.type || '';
		selectedStatus = data.filters?.status || '';
	});

	function handleFilterChange() {
		const url = new URL($page.url);
		url.searchParams.set('page', '1'); // Reset ke halaman pertama saat filter berubah
		
		if (searchVal.trim()) {
			url.searchParams.set('q', searchVal.trim());
		} else {
			url.searchParams.delete('q');
		}

		if (selectedBranch) {
			url.searchParams.set('branchId', selectedBranch);
		} else {
			url.searchParams.delete('branchId');
		}

		if (selectedType) {
			url.searchParams.set('type', selectedType);
		} else {
			url.searchParams.delete('type');
		}

		if (selectedStatus) {
			url.searchParams.set('status', selectedStatus);
		} else {
			url.searchParams.delete('status');
		}

		goto(url.toString(), { keepFocus: true, noScroll: false });
	}

	function resetFilters() {
		searchVal = '';
		selectedBranch = '';
		selectedType = '';
		selectedStatus = '';
		handleFilterChange();
	}

	/**
	 * Navigate to a new page using SvelteKit goto
	 * @param {number} newPage
	 */
	function goToPage(newPage) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString(), { keepFocus: true, noScroll: false });
	}
</script>

<div class="mx-auto max-w-7xl space-y-6 pb-12">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Riwayat Transaksi</h1>
			<p class="mt-1 text-[var(--color-stone)]">
				Pantau semua transaksi penyewaan dan penjualan cabang ini.
			</p>
		</div>
	</div>

	<!-- Pencarian & Filter -->
	<Card padding="md">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
			<!-- Pencarian Teks -->
			<div class="sm:col-span-2 md:col-span-1">
				<form onsubmit={(e) => { e.preventDefault(); handleFilterChange(); }} class="relative w-full">
					<Input
						name="q"
						bind:value={searchVal}
						placeholder="Cari kode / pelanggan..."
					>
						{#snippet iconLeft()}
							<Search size={18} />
						{/snippet}
					</Input>
				</form>
			</div>

			<!-- Filter Tipe -->
			<div>
				<Select bind:value={selectedType} onchange={handleFilterChange}>
					<option value="">Semua Tipe</option>
					<option value="retail">Retail</option>
					<option value="rental">Sewa</option>
					<option value="hybrid">Hybrid</option>
				</Select>
			</div>

			<!-- Filter Status -->
			<div>
				<Select bind:value={selectedStatus} onchange={handleFilterChange}>
					<option value="">Semua Status</option>
					<option value="paid">Lunas</option>
					<option value="unpaid">Belum Lunas</option>
				</Select>
			</div>

			<!-- Filter Cabang (hanya untuk Owner) -->
			{#if data.profile?.role === 'owner'}
				<div>
					<Select bind:value={selectedBranch} onchange={handleFilterChange}>
						<option value="">Semua Cabang</option>
						{#each data.activeBranches as br}
							<option value={br.id}>{br.name}</option>
						{/each}
					</Select>
				</div>
			{/if}
		</div>

		{#if searchVal || selectedBranch || selectedType || selectedStatus}
			<div class="mt-4 flex justify-end">
				<Button variant="ghost" size="sm" onclick={resetFilters} class="text-[var(--color-stone)] hover:text-[var(--color-earth)]">
					Reset Filter
				</Button>
			</div>
		{/if}
	</Card>

	<!-- Tabel Data -->
	<Card padding="none" class="overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead
					class="border-b border-[var(--color-border)] bg-[var(--color-sand-light)] font-semibold text-[var(--color-earth)]"
				>
					<tr>
						<th class="px-6 py-4">Transaksi</th>
						{#if data.profile?.role === 'owner'}
							<th class="px-6 py-4">Cabang</th>
						{/if}
						<th class="px-6 py-4">Pelanggan</th>
						<th class="px-6 py-4">Tipe</th>
						<th class="px-6 py-4">Pembayaran</th>
						<th class="px-6 py-4 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)]">
					{#if transactions.length === 0}
						<tr>
							<td colspan={colSpan} class="px-6 py-12 text-center text-[var(--color-stone)]">
								<Receipt size={48} class="mx-auto mb-3 opacity-20" />
								<p class="text-lg font-medium">Tidak ada transaksi ditemukan</p>
								{#if searchVal}
									<p class="mt-1 text-sm">Pencarian atau filter tidak membuahkan hasil.</p>
								{/if}
							</td>
						</tr>
					{:else}
						{#each transactions as trx (trx.id)}
							<tr class="group transition-colors hover:bg-[var(--color-sand-lightest)]/50">
								<td class="px-6 py-4">
									<div class="font-mono font-bold text-[var(--color-earth)]">
										{trx.transaction_code}
									</div>
									<div class="text-[11px] text-[var(--color-stone)] mt-0.5">
										{formatDate(trx.created_at)}
									</div>
								</td>
								{#if data.profile?.role === 'owner'}
									<td class="px-6 py-4">
										<span class="inline-flex items-center rounded-md bg-[var(--color-sand-light)] px-2.5 py-1 text-xs font-semibold text-[var(--color-earth)]">
											{trx.branch?.name || 'BotaniRent'}
										</span>
									</td>
								{/if}
								<td class="px-6 py-4">
									<div class="font-medium text-[var(--color-earth)]">
										{trx.customer?.full_name || '-'}
									</div>
								</td>
								<td class="px-6 py-4">
									{#if trx.type === 'retail'}
										<Badge variant="warning">Retail</Badge>
									{:else if trx.type === 'rental'}
										<Badge variant="info">Sewa</Badge>
									{:else}
										<Badge variant="neutral">Hybrid</Badge>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="font-bold text-[var(--color-forest)]">
										{formatCurrency(trx.total_amount)}
									</div>
									<div class="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--color-stone)]">
										<span class="uppercase tracking-wider text-[10px]">{trx.payment_method}</span>
										<span>•</span>
										{#if trx.payment_status === 'paid'}
											<span class="text-xs font-semibold text-[var(--color-forest)]">Lunas</span>
										{:else}
											<span class="text-xs font-semibold text-[var(--color-warning)]">{trx.payment_status}</span>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 text-right">
									<!-- eslint-disable-next-line -->
									<a
										href="/transactions/{trx.id}"
										class="inline-flex items-center justify-center rounded-lg p-2 font-medium text-[var(--color-forest)] transition-colors hover:bg-[var(--color-forest)]/10"
									>
										Lihat Detail <ArrowRight size={16} class="ml-1" />
									</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		{#if totalCount > 0}
			<div
				class="flex items-center justify-between border-t border-[var(--color-border-light)] bg-white p-4 text-[var(--color-stone)]"
			>
				<span class="text-[13px]">
					Menampilkan <strong class="text-[var(--color-earth)]"
						>{(currentPage - 1) * limit + 1}</strong
					>
					sampai
					<strong class="text-[var(--color-earth)]"
						>{Math.min(currentPage * limit, totalCount)}</strong
					>
					dari
					<strong class="text-[var(--color-earth)]">{totalCount}</strong> transaksi
				</span>
				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={() => goToPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						class="rounded-lg border border-[var(--color-border-light)] p-1.5 transition-colors hover:bg-[var(--color-sand)] disabled:opacity-40 disabled:hover:bg-transparent"
					>
						<ChevronLeft size={16} />
					</button>
					<span class="px-2 font-mono text-[13px]">Hal {currentPage} / {totalPages}</span>
					<button
						type="button"
						onclick={() => goToPage(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
						class="rounded-lg border border-[var(--color-border-light)] p-1.5 transition-colors hover:bg-[var(--color-sand)] disabled:opacity-40 disabled:hover:bg-transparent"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		{/if}
	</Card>
</div>
