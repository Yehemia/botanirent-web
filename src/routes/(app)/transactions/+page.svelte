<script>
	import { Search, Receipt, ArrowRight, CheckCircle, Clock } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	let { transactions, search } = data;

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
	}

	function formatDate(dateStr) {
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
		}).format(new Date(dateStr));
	}
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Riwayat Transaksi</h1>
			<p class="text-[var(--color-stone)] mt-1">Pantau semua transaksi penyewaan dan penjualan cabang ini.</p>
		</div>
	</div>

	<!-- Pencarian -->
	<Card padding="md">
		<form method="GET" class="relative max-w-md">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
				<Search size={18} />
			</div>
			<input 
				type="text" 
				name="q"
				value={search} 
				placeholder="Cari berdasarkan kode transaksi (TRX-...)" 
				class="w-full pl-10 pr-4 py-2 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
			>
		</form>
	</Card>

	<!-- Tabel Data -->
	<Card padding="none" class="overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead class="bg-[var(--color-sand-light)] text-[var(--color-earth)] font-semibold border-b border-[var(--color-border)]">
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
									<p class="text-sm mt-1">Pencarian "{search}" tidak membuahkan hasil.</p>
								{/if}
							</td>
						</tr>
					{:else}
						{#each transactions as trx (trx.id)}
							<tr class="hover:bg-[var(--color-sand-lightest)]/50 transition-colors group">
								<td class="px-6 py-4">
									<span class="font-mono font-bold text-[var(--color-earth)]">{trx.transaction_code}</span>
								</td>
								<td class="px-6 py-4 text-[var(--color-stone)]">
									{formatDate(trx.created_at)}
								</td>
								<td class="px-6 py-4">
									<div class="font-medium text-[var(--color-earth)]">{trx.customer?.full_name || '-'}</div>
								</td>
								<td class="px-6 py-4">
									{#if trx.type === 'retail'}
										<Badge variant="warning">Retail</Badge>
									{:else if trx.type === 'rental'}
										<Badge variant="info">Sewa</Badge>
									{:else}
										<Badge variant="default">Hybrid</Badge>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="font-bold text-[var(--color-forest)]">{formatCurrency(trx.total_amount)}</div>
									<div class="text-[10px] text-[var(--color-stone)] uppercase tracking-wider">{trx.payment_method}</div>
								</td>
								<td class="px-6 py-4">
									{#if trx.payment_status === 'paid'}
										<Badge variant="success" class="flex items-center gap-1 w-max">
											<CheckCircle size={12} /> Lunas
										</Badge>
									{:else}
										<Badge variant="warning" class="flex items-center gap-1 w-max">
											<Clock size={12} /> {trx.payment_status}
										</Badge>
									{/if}
								</td>
								<td class="px-6 py-4 text-right">
									<!-- eslint-disable-next-line -->
									<a href="/transactions/{trx.id}" class="inline-flex items-center justify-center p-2 text-[var(--color-forest)] hover:bg-[var(--color-forest)]/10 rounded-lg transition-colors font-medium">
										Lihat Detail <ArrowRight size={16} class="ml-1" />
									</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>
</div>
