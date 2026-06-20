<script>
	import { Search, Receipt, ArrowRight, CheckCircle, Clock, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	import { formatCurrency, formatDate } from '$lib/utils/format';

	let { data } = $props();
	let transactions = $derived(data.transactions);
	let search = $derived(data.search);
	let currentPage = $derived(data.page);
	let totalCount = $derived(data.totalCount);
	let limit = $derived(data.limit);
	let totalPages = $derived(Math.ceil(totalCount / limit));

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

	<!-- Pencarian -->
	<Card padding="md">
		<form method="GET" class="relative max-w-md">
			<Input name="q" value={search} placeholder="Cari berdasarkan kode transaksi (TRX-...)">
				{#snippet iconLeft()}
					<Search size={18} />
				{/snippet}
			</Input>
		</form>
	</Card>

	<!-- Tabel Data -->
	<Card padding="none" class="overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead
					class="border-b border-[var(--color-border)] bg-[var(--color-sand-light)] font-semibold text-[var(--color-earth)]"
				>
					<tr>
						<th class="px-6 py-4">Kode Transaksi</th>
						<th class="px-6 py-4">Waktu</th>
						<th class="px-6 py-4">Pelanggan</th>
						<th class="px-6 py-4">Tipe</th>
						<th class="px-6 py-4">Total Tagihan</th>
						<th class="px-6 py-4">Status</th>
						<th class="px-6 py-4 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)]">
					{#if transactions.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-[var(--color-stone)]">
								<Receipt size={48} class="mx-auto mb-3 opacity-20" />
								<p class="text-lg font-medium">Tidak ada transaksi ditemukan</p>
								{#if search}
									<p class="mt-1 text-sm">Pencarian "{search}" tidak membuahkan hasil.</p>
								{/if}
							</td>
						</tr>
					{:else}
						{#each transactions as trx (trx.id)}
							<tr class="group transition-colors hover:bg-[var(--color-sand-lightest)]/50">
								<td class="px-6 py-4">
									<span class="font-mono font-bold text-[var(--color-earth)]"
										>{trx.transaction_code}</span
									>
								</td>
								<td class="px-6 py-4 text-[var(--color-stone)]">
									{formatDate(trx.created_at)}
								</td>
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
									<div class="text-[10px] tracking-wider text-[var(--color-stone)] uppercase">
										{trx.payment_method}
									</div>
								</td>
								<td class="px-6 py-4">
									{#if trx.payment_status === 'paid'}
										<Badge variant="success" class="flex w-max items-center gap-1">
											<CheckCircle size={12} /> Lunas
										</Badge>
									{:else}
										<Badge variant="warning" class="flex w-max items-center gap-1">
											<Clock size={12} />
											{trx.payment_status}
										</Badge>
									{/if}
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
