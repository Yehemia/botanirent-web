<script>
	import { Bar, Doughnut } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
		ArcElement
	} from 'chart.js';
	import { 
		BarChart3, 
		TrendingUp, 
		Store, 
		PieChart, 
		ShoppingBag, 
		Award, 
		Coins, 
		ArrowUpRight,
		Tent
	} from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatCurrency } from '$lib/utils/format';

	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
		ArcElement
	);

	/** @type {{ data: any }} */
	let { data } = $props();
	let metrics = $derived(data.metrics);
	let branchStats = $derived(data.branchStats);
	let popularItems = $derived(data.popularItems);
	let typeBreakdown = $derived(data.typeBreakdown);
	let trend = $derived(data.trend);

	// Config for Month Trend Chart
	let trendChartData = $derived(() => {
		return {
			labels: trend.labels,
			datasets: [
				{
					label: 'Pendapatan Bulanan (Rp)',
					data: trend.data,
					backgroundColor: 'rgba(45, 80, 22, 0.85)', // Forest
					borderColor: 'rgba(45, 80, 22, 1)',
					borderWidth: 1.5,
					borderRadius: 6
				}
			]
		};
	});

	// Config for Branch Revenue Chart
	let branchChartData = $derived(() => {
		return {
			labels: branchStats.map((/** @type {any} */ b) => b.name),
			datasets: [
				{
					label: 'Pendapatan (Rp)',
					data: branchStats.map((/** @type {any} */ b) => b.revenue),
					backgroundColor: 'rgba(212, 168, 67, 0.85)', // Amber
					borderColor: 'rgba(212, 168, 67, 1)',
					borderWidth: 1.5,
					borderRadius: 6
				}
			]
		};
	});

	// Config for Category Doughnut Chart
	let typeChartData = $derived(() => {
		return {
			labels: ['Rental', 'Retail', 'Package'],
			datasets: [
				{
					data: [
						typeBreakdown.rental.revenue,
						typeBreakdown.retail.revenue,
						typeBreakdown.package.revenue
					],
					backgroundColor: [
						'rgba(45, 80, 22, 0.85)',   // Forest (Rental)
						'rgba(212, 168, 67, 0.85)',  // Amber (Retail)
						'rgba(200, 90, 58, 0.85)'    // Terracotta (Package)
					],
					borderWidth: 1
				}
			]
		};
	});

	const barOptions = {
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
						return 'Rp ' + (value / 1000) + 'k';
					}
				}
			}
		}
	};

	/** @type {any} */
	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'bottom',
				labels: {
					font: { family: 'Inter', size: 12 },
					boxWidth: 12
				}
			},
			tooltip: {
				callbacks: {
					/** @param {any} context */
					label: function(context) {
						const value = context.raw || 0;
						return ` ${context.label}: ${formatCurrency(value)}`;
					}
				}
			}
		}
	};
</script>

<div class="space-y-8 max-w-7xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)] flex items-center gap-2">
				<BarChart3 size={28} /> Statistik Bisnis
			</h1>
			<p class="text-[var(--color-stone)] mt-1">Analisis mendalam performa inventaris, transaksi, dan pendapatan antar cabang.</p>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card padding="md" class="border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-forest)] to-emerald-950 text-white border-none">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-white/80 text-sm font-medium mb-1">Total Pendapatan Bersih</p>
					<h3 class="text-3xl font-bold font-heading">{formatCurrency(metrics.totalRevenue)}</h3>
					<p class="text-xs text-white/60 mt-2">Dari seluruh transaksi yang berstatus lunas</p>
				</div>
				<div class="p-2.5 bg-white/10 rounded-xl text-[var(--color-amber)]"><Coins size={24} /></div>
			</div>
		</Card>

		<Card padding="md" class="border border-[var(--color-border)]">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-[var(--color-stone)] text-sm font-medium mb-1">Volume Transaksi</p>
					<h3 class="text-3xl font-bold font-heading text-[var(--color-earth)]">{metrics.totalTxCount} Transaksi</h3>
					<p class="text-xs text-[var(--color-stone)] mt-2">Transaksi berbayar sukses dicatat</p>
				</div>
				<div class="p-2.5 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-xl"><TrendingUp size={24} /></div>
			</div>
		</Card>

		<Card padding="md" class="border border-[var(--color-border)]">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-[var(--color-stone)] text-sm font-medium mb-1">Rata-rata Nilai Transaksi (ATV)</p>
					<h3 class="text-3xl font-bold font-heading text-[var(--color-earth)]">{formatCurrency(metrics.avgTxValue)}</h3>
					<p class="text-xs text-[var(--color-stone)] mt-2">Rata-rata pengeluaran per pelanggan</p>
				</div>
				<div class="p-2.5 bg-[var(--color-amber)]/10 text-[var(--color-amber)] rounded-xl"><ArrowUpRight size={24} /></div>
			</div>
		</Card>
	</div>

	<!-- Charts Section -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Monthly Trend Chart -->
		<div class="lg:col-span-2">
			<Card padding="md" class="h-full flex flex-col justify-between">
				<div class="mb-4">
					<h3 class="font-bold text-[var(--color-earth)] flex items-center gap-2">
						<TrendingUp size={18} /> Tren Pendapatan Bulanan
					</h3>
					<p class="text-xs text-[var(--color-stone)] mt-0.5">Pendapatan agregat 6 bulan terakhir</p>
				</div>
				<div class="flex-grow min-h-[300px]">
					<Bar data={trendChartData()} options={barOptions} />
				</div>
			</Card>
		</div>

		<!-- Category Breakdown Chart -->
		<div class="lg:col-span-1">
			<Card padding="md" class="h-full flex flex-col justify-between">
				<div class="mb-4">
					<h3 class="font-bold text-[var(--color-earth)] flex items-center gap-2">
						<PieChart size={18} /> Distribusi Tipe Pendapatan
					</h3>
					<p class="text-xs text-[var(--color-stone)] mt-0.5">Kontribusi pendapatan dari kategori</p>
				</div>
				<div class="flex-grow min-h-[250px] flex items-center justify-center">
					<Doughnut data={typeChartData()} options={doughnutOptions} />
				</div>
			</Card>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Branch Comparison -->
		<div class="lg:col-span-1">
			<Card padding="md" class="h-full flex flex-col justify-between">
				<div class="mb-4">
					<h3 class="font-bold text-[var(--color-earth)] flex items-center gap-2">
						<Store size={18} /> Pendapatan per Cabang
					</h3>
					<p class="text-xs text-[var(--color-stone)] mt-0.5">Perbandingan performa penjualan antar cabang</p>
				</div>
				<div class="flex-grow min-h-[250px]">
					<Bar data={branchChartData()} options={barOptions} />
				</div>
			</Card>
		</div>

		<!-- Popular Items -->
		<div class="lg:col-span-2">
			<Card padding="none" class="h-full overflow-hidden flex flex-col">
				<div class="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
					<div>
						<h3 class="font-bold text-[var(--color-earth)] flex items-center gap-2">
							<Award size={18} /> 5 Barang Terpopuler
						</h3>
						<p class="text-xs text-[var(--color-stone)] mt-0.5">Barang dengan volume transaksi keluar terbanyak</p>
					</div>
				</div>
				<div class="overflow-x-auto flex-1">
					<table class="w-full text-left text-sm whitespace-nowrap">
						<thead class="bg-[var(--color-sand-light)] text-[var(--color-earth)] font-semibold border-b border-[var(--color-border)]">
							<tr>
								<th class="px-6 py-4 text-center w-16">Peringkat</th>
								<th class="px-6 py-4">Nama Barang</th>
								<th class="px-6 py-4">Kategori</th>
								<th class="px-6 py-4 text-center">Qty Keluar</th>
								<th class="px-6 py-4 text-right">Total Pendapatan</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[var(--color-border-light)]">
							{#if popularItems.length === 0}
								<tr>
									<td colspan="5" class="px-6 py-8 text-center text-[var(--color-stone)] italic">
										Belum ada data barang terjual/disewa.
									</td>
								</tr>
							{:else}
								{#each popularItems as item, idx}
									<tr class="hover:bg-[var(--color-sand-lightest)]/50 transition-colors">
										<td class="px-6 py-4 text-center font-bold">
											<span class="inline-flex items-center justify-center w-6 h-6 rounded-full 
												{idx === 0 ? 'bg-[var(--color-amber)] text-[var(--color-earth)]' : 
												 idx === 1 ? 'bg-gray-300 text-gray-800' : 
												 idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'} text-xs">
												{idx + 1}
											</span>
										</td>
										<td class="px-6 py-4 font-semibold text-[var(--color-earth)]">{item.name}</td>
										<td class="px-6 py-4 capitalize">
											<span class="inline-block px-2.5 py-0.5 border rounded-md text-xs
												{item.type === 'rental' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/10' :
												 item.type === 'retail' ? 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/10' :
												 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/10'}">
												{item.type}
											</span>
										</td>
										<td class="px-6 py-4 text-center font-medium">{item.quantity}x</td>
										<td class="px-6 py-4 text-right font-bold text-[var(--color-forest)]">{formatCurrency(item.total)}</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	</div>
</div>
