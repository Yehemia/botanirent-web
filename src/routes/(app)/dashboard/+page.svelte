<script>
	import { 
		TrendingUp, 
		Activity, 
		PackageCheck, 
		Wrench, 
		Tent, 
		Droplets,
		ArrowRight,
		Clock,
		CheckCircle
	} from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	// Chart.js setup
	import { Bar } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
	} from 'chart.js';

	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale
	);

	import { formatCurrency, formatDate } from '$lib/utils/format';

	let { data } = $props();
	let role = $derived(data.role);
	let assetStats = $derived(data.assetStats);
	let recentTransactions = $derived(data.recentTransactions);
	let revenueData = $derived(data.revenueData);
	let chartData = $derived(data.chartData);

	let chartConfig = $derived(() => {
		if (!chartData) {
			return {
				labels: [],
				datasets: []
			};
		}
		return {
			labels: chartData.labels,
			datasets: [
				{
					label: 'Pendapatan (Rp)',
					data: chartData.data,
					backgroundColor: 'rgba(44, 76, 59, 0.8)', // forest color
					borderColor: 'rgba(44, 76, 59, 1)',
					borderWidth: 1,
					borderRadius: 4
				}
			]
		};
	});

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					/** @param {any} context */
					label: function(context) {
						let label = context.dataset.label || '';
						if (label) label += ': ';
						if (context.parsed.y !== null) {
							label += formatCurrency(context.parsed.y);
						}
						return label;
					}
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					/** @param {any} value */
					callback: function(value) {
						if (value === 0) return '0';
						return 'Rp ' + (value / 1000) + 'k'; // simplify numbers
					}
				}
			}
		}
	};
</script>

<div class="space-y-8 max-w-7xl mx-auto pb-12">
	
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">
				{role === 'owner' ? 'Dashboard Bisnis' : 'Beranda Operasional'}
			</h1>
			<p class="text-[var(--color-stone)] mt-1">
				{role === 'owner' ? 'Pantau performa dan pendapatan seluruh cabang.' : 'Pantau ketersediaan alat dan operasional hari ini.'}
			</p>
		</div>
	</div>

	<!-- Owner KPI Cards -->
	{#if role === 'owner' && revenueData}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<Card padding="md" class="bg-gradient-to-br from-[var(--color-forest)] to-emerald-900 text-white border-none">
				<div class="flex justify-between items-start">
					<div>
						<p class="text-white/80 text-sm font-medium mb-1">Pendapatan Bulan Ini</p>
						<h3 class="text-3xl font-bold font-heading">{formatCurrency(revenueData.totalRevenueMonth)}</h3>
					</div>
					<div class="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
				</div>
			</Card>

			<Card padding="md" class="bg-[var(--color-sand-lightest)] border border-[var(--color-border)]">
				<div class="flex justify-between items-start">
					<div>
						<p class="text-[var(--color-stone)] text-sm font-medium mb-1">Transaksi Sukses (Bulan Ini)</p>
						<h3 class="text-3xl font-bold font-heading text-[var(--color-earth)]">{revenueData.successfulTrxCountMonth}</h3>
					</div>
					<div class="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg"><Activity size={24} /></div>
				</div>
			</Card>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Grafik Pendapatan (Owner Only) -->
		{#if role === 'owner' && chartConfig()}
			<div class="lg:col-span-2">
				<Card padding="md" class="h-full flex flex-col">
					<h3 class="font-bold text-[var(--color-earth)] mb-6 flex items-center gap-2">
						<TrendingUp size={18} /> Tren Pendapatan (7 Hari Terakhir)
					</h3>
					<div class="flex-grow min-h-[300px]">
						<Bar data={chartConfig()} options={chartOptions} />
					</div>
				</Card>
			</div>
		{/if}

		<!-- Status Aset Fisik -->
		<div class="{role === 'owner' ? 'lg:col-span-1' : 'lg:col-span-3'}">
			<Card padding="md" class="h-full">
				<h3 class="font-bold text-[var(--color-earth)] mb-4 flex items-center gap-2">
					<PackageCheck size={18} /> Status Aset Fisik (Gudang)
				</h3>
				
				<div class="{role === 'owner' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}">
					<!-- Ready -->
					<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5">
						<div class="flex items-center gap-3 text-[var(--color-success)]">
							<div class="p-2 bg-[var(--color-success)]/20 rounded-lg"><Tent size={20} /></div>
							<span class="font-bold">Siap Sewa</span>
						</div>
						<span class="text-2xl font-bold font-heading text-[var(--color-success)]">{assetStats.ready}</span>
					</div>

					<!-- Rented -->
					<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-info)]/20 bg-[var(--color-info)]/5">
						<div class="flex items-center gap-3 text-[var(--color-info)]">
							<div class="p-2 bg-[var(--color-info)]/20 rounded-lg"><Activity size={20} /></div>
							<span class="font-bold">Disewa</span>
						</div>
						<span class="text-2xl font-bold font-heading text-[var(--color-info)]">{assetStats.rented}</span>
					</div>

					<!-- Washing -->
					<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5">
						<div class="flex items-center gap-3 text-[var(--color-warning)]">
							<div class="p-2 bg-[var(--color-warning)]/20 rounded-lg"><Droplets size={20} /></div>
							<span class="font-bold">Dicuci</span>
						</div>
						<span class="text-2xl font-bold font-heading text-[var(--color-warning)]">{assetStats.washing}</span>
					</div>

					<!-- Maintenance -->
					<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5">
						<div class="flex items-center gap-3 text-[var(--color-error)]">
							<div class="p-2 bg-[var(--color-error)]/20 rounded-lg"><Wrench size={20} /></div>
							<span class="font-bold">Perbaikan</span>
						</div>
						<span class="text-2xl font-bold font-heading text-[var(--color-error)]">{assetStats.maintenance}</span>
					</div>
				</div>
			</Card>
		</div>
	</div>

	<!-- Recent Transactions -->
	<Card padding="none" class="overflow-hidden">
		<div class="p-6 border-b border-[var(--color-border)] flex justify-between items-center">
			<h3 class="font-bold text-[var(--color-earth)]">Transaksi Terkini</h3>
			<!-- eslint-disable-next-line -->
			<a href="/transactions" class="text-sm font-medium text-[var(--color-forest)] hover:underline flex items-center gap-1">
				Lihat Semua <ArrowRight size={14} />
			</a>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead class="bg-[var(--color-sand-light)] text-[var(--color-earth)] font-semibold border-b border-[var(--color-border)]">
					<tr>
						<th class="px-6 py-4">Kode Transaksi</th>
						<th class="px-6 py-4">Waktu</th>
						<th class="px-6 py-4">Pelanggan</th>
						<th class="px-6 py-4">Tipe</th>
						{#if role === 'owner'}
							<th class="px-6 py-4">Total</th>
						{/if}
						<th class="px-6 py-4">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)]">
					{#if recentTransactions.length === 0}
						<tr>
							<td colspan={role === 'owner' ? 6 : 5} class="px-6 py-8 text-center text-[var(--color-stone)] italic">
								Belum ada transaksi terbaru.
							</td>
						</tr>
					{:else}
						{#each recentTransactions as trx}
							<tr class="hover:bg-[var(--color-sand-lightest)]/50 transition-colors">
								<td class="px-6 py-4 font-mono font-bold text-[var(--color-earth)]">
									<a href="/transactions/{trx.id}" class="hover:text-[var(--color-forest)]">{trx.transaction_code}</a>
								</td>
								<td class="px-6 py-4 text-[var(--color-stone)]">{formatDate(trx.created_at)}</td>
								<td class="px-6 py-4 font-medium">{trx.customer?.full_name || '-'}</td>
								<td class="px-6 py-4 capitalize">{trx.type}</td>
								{#if role === 'owner'}
									<td class="px-6 py-4 font-bold text-[var(--color-forest)]">{formatCurrency(trx.total_amount)}</td>
								{/if}
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
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>
</div>
