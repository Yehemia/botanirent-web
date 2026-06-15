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

	ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

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
					label: 'Total Pendapatan (Rp)',
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
					label: 'Sewa & Retail',
					data: branchStats.map((/** @type {any} */ b) => b.revenue - (b.penalty_revenue || 0)),
					backgroundColor: 'rgba(212, 168, 67, 0.85)', // Amber
					borderColor: 'rgba(212, 168, 67, 1)',
					borderWidth: 1.5,
					borderRadius: 6
				},
				{
					label: 'Denda',
					data: branchStats.map((/** @type {any} */ b) => b.penalty_revenue || 0),
					backgroundColor: 'rgba(185, 28, 28, 0.85)', // Red
					borderColor: 'rgba(185, 28, 28, 1)',
					borderWidth: 1.5,
					borderRadius: 6
				}
			]
		};
	});

	// Config for Category Doughnut Chart
	let typeChartData = $derived(() => {
		return {
			labels: ['Rental', 'Retail', 'Package', 'Denda'],
			datasets: [
				{
					data: [
						typeBreakdown.rental.revenue,
						typeBreakdown.retail.revenue,
						typeBreakdown.package.revenue,
						typeBreakdown.penalty.revenue
					],
					backgroundColor: [
						'rgba(45, 80, 22, 0.85)', // Forest (Rental)
						'rgba(212, 168, 67, 0.85)', // Amber (Retail)
						'rgba(200, 90, 58, 0.85)', // Terracotta (Package)
						'rgba(185, 28, 28, 0.85)' // Red (Denda)
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
			legend: {
				display: true,
				position: /** @type {'top'} */ ('top'),
				labels: { boxWidth: 12, font: { size: 10, weight: /** @type {'bold'} */ ('bold') } }
			},
			tooltip: {
				callbacks: {
					/** @param {any} context */
					label: function (context) {
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
			x: { stacked: true },
			y: {
				stacked: true,
				beginAtZero: true,
				ticks: {
					/** @param {any} value */
					callback: function (value) {
						if (value === 0) return '0';
						return 'Rp ' + value / 1000 + 'k';
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
					label: function (context) {
						const value = context.raw || 0;
						return ` ${context.label}: ${formatCurrency(value)}`;
					}
				}
			}
		}
	};
</script>

<div class="mx-auto max-w-7xl space-y-8 pb-12">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1
				class="flex items-center gap-2 font-heading text-2xl font-bold text-[var(--color-earth)] sm:text-3xl"
			>
				<BarChart3 class="h-6 w-6 sm:h-7 sm:w-7" /> Statistik Bisnis
			</h1>
			<p class="mt-1 text-xs text-[var(--color-stone)] sm:text-sm">
				Analisis mendalam performa inventaris, transaksi, dan pendapatan antar cabang.
			</p>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<div
			class="flex flex-col justify-between rounded-lg border-none bg-gradient-to-br from-[var(--color-forest)] to-[#1E3710] p-5 text-white shadow-[var(--shadow-sm)]"
		>
			<div class="flex items-start justify-between">
				<div class="min-w-0 flex-grow">
					<p class="mb-1 truncate text-xs font-medium text-white/85 sm:text-sm">
						Total Pendapatan Bersih
					</p>
					<h3 class="font-heading text-2xl font-bold break-words text-white sm:text-3xl">
						{formatCurrency(metrics.totalRevenue)}
					</h3>
					<div
						class="mt-2 flex flex-col gap-0.5 border-t border-white/10 pt-2 text-[11px] text-white/80"
					>
						<span class="flex justify-between"
							><span>Sewa & Retail:</span>
							<span class="font-bold text-white">{formatCurrency(metrics.totalTxRevenue)}</span
							></span
						>
						<span class="flex justify-between"
							><span>Denda:</span>
							<span class="font-bold text-amber-300"
								>{formatCurrency(metrics.totalPenaltyRevenue)}</span
							></span
						>
					</div>
				</div>
				<div class="ml-2 shrink-0 rounded-xl bg-white/10 p-2 text-amber-300">
					<Coins size={20} />
				</div>
			</div>
		</div>

		<Card padding="md" class="border border-[var(--color-border)]">
			<div class="flex items-start justify-between">
				<div class="min-w-0">
					<p class="mb-1 truncate text-xs font-medium text-[var(--color-stone)] sm:text-sm">
						Volume Transaksi
					</p>
					<h3
						class="truncate font-heading text-2xl font-bold text-[var(--color-earth)] sm:text-3xl"
					>
						{metrics.totalTxCount} Transaksi
					</h3>
					<p class="mt-2 text-[11px] text-[var(--color-stone)] sm:text-xs">
						Transaksi berbayar sukses dicatat
					</p>
				</div>
				<div
					class="shrink-0 rounded-xl bg-[var(--color-success)]/10 p-2 text-[var(--color-success)]"
				>
					<TrendingUp size={20} />
				</div>
			</div>
		</Card>

		<Card padding="md" class="border border-[var(--color-border)]">
			<div class="flex items-start justify-between">
				<div class="min-w-0">
					<p class="mb-1 truncate text-xs font-medium text-[var(--color-stone)] sm:text-sm">
						Rata-rata Nilai Transaksi (ATV)
					</p>
					<h3
						class="font-heading text-2xl font-bold break-words text-[var(--color-earth)] sm:text-3xl"
					>
						{formatCurrency(metrics.avgTxValue)}
					</h3>
					<p class="mt-2 text-[11px] text-[var(--color-stone)] sm:text-xs">
						Rata-rata pengeluaran per pelanggan
					</p>
				</div>
				<div class="shrink-0 rounded-xl bg-[var(--color-amber)]/10 p-2 text-[var(--color-amber)]">
					<ArrowUpRight size={20} />
				</div>
			</div>
		</Card>
	</div>

	<!-- Charts Section -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Monthly Trend Chart -->
		<div class="lg:col-span-2">
			<Card padding="md" class="flex h-full flex-col justify-between">
				<div class="mb-4">
					<h3 class="flex items-center gap-2 font-bold text-[var(--color-earth)]">
						<TrendingUp size={18} /> Tren Pendapatan Bulanan
					</h3>
					<p class="mt-0.5 text-xs text-[var(--color-stone)]">
						Pendapatan agregat 6 bulan terakhir
					</p>
				</div>
				<div class="min-h-[220px] flex-grow sm:min-h-[300px]">
					<Bar data={trendChartData()} options={barOptions} />
				</div>
			</Card>
		</div>

		<!-- Category Breakdown Chart -->
		<div class="lg:col-span-1">
			<Card padding="md" class="flex h-full flex-col justify-between">
				<div class="mb-4">
					<h3 class="flex items-center gap-2 font-bold text-[var(--color-earth)]">
						<PieChart size={18} /> Distribusi Tipe Pendapatan
					</h3>
					<p class="mt-0.5 text-xs text-[var(--color-stone)]">
						Kontribusi pendapatan dari kategori
					</p>
				</div>
				<div class="flex min-h-[200px] flex-grow items-center justify-center sm:min-h-[250px]">
					<Doughnut data={typeChartData()} options={doughnutOptions} />
				</div>
			</Card>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Branch Comparison -->
		<div class="lg:col-span-1">
			<Card padding="md" class="flex h-full flex-col justify-between">
				<div class="mb-4">
					<h3 class="flex items-center gap-2 font-bold text-[var(--color-earth)]">
						<Store size={18} /> Pendapatan per Cabang
					</h3>
					<p class="mt-0.5 text-xs text-[var(--color-stone)]">
						Perbandingan performa penjualan antar cabang
					</p>
				</div>
				<div class="min-h-[200px] flex-grow sm:min-h-[250px]">
					<Bar data={branchChartData()} options={barOptions} />
				</div>
			</Card>
		</div>

		<!-- Popular Items -->
		<div class="lg:col-span-2">
			<Card padding="none" class="flex h-full flex-col overflow-hidden">
				<div class="flex items-center justify-between border-b border-[var(--color-border)] p-6">
					<div>
						<h3 class="flex items-center gap-2 font-bold text-[var(--color-earth)]">
							<Award size={18} /> 5 Barang Terpopuler
						</h3>
						<p class="mt-0.5 text-xs text-[var(--color-stone)]">
							Barang dengan volume transaksi keluar terbanyak
						</p>
					</div>
				</div>

				<!-- Desktop Popular Items Table -->
				<div class="hidden flex-1 overflow-x-auto sm:block">
					<table class="w-full text-left text-sm whitespace-nowrap">
						<thead
							class="border-b border-[var(--color-border)] bg-[var(--color-sand-light)] font-semibold text-[var(--color-earth)]"
						>
							<tr>
								<th class="w-16 px-6 py-4 text-center">Peringkat</th>
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
									<tr class="transition-colors hover:bg-[var(--color-sand-lightest)]/50">
										<td class="px-6 py-4 text-center font-bold">
											<span
												class="inline-flex h-6 w-6 items-center justify-center rounded-full
												{idx === 0
													? 'bg-[var(--color-amber)] text-[var(--color-earth)]'
													: idx === 1
														? 'bg-gray-300 text-gray-800'
														: idx === 2
															? 'bg-amber-600 text-white'
															: 'bg-gray-100 text-gray-500'} text-xs"
											>
												{idx + 1}
											</span>
										</td>
										<td class="px-6 py-4 font-semibold text-[var(--color-earth)]">{item.name}</td>
										<td class="px-6 py-4 capitalize">
											<span
												class="inline-block rounded-md border px-2.5 py-0.5 text-xs
												{item.type === 'rental'
													? 'border-[var(--color-success)]/10 bg-[var(--color-success-bg)] text-[var(--color-success)]'
													: item.type === 'retail'
														? 'border-[var(--color-info)]/10 bg-[var(--color-info-bg)] text-[var(--color-info)]'
														: 'border-[var(--color-warning)]/10 bg-[var(--color-warning-bg)] text-[var(--color-warning)]'}"
											>
												{item.type}
											</span>
										</td>
										<td class="px-6 py-4 text-center font-medium">{item.quantity}x</td>
										<td class="px-6 py-4 text-right font-bold text-[var(--color-forest)]"
											>{formatCurrency(item.total)}</td
										>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>

				<!-- Mobile Popular Items Card List -->
				<div class="block divide-y divide-[var(--color-border-light)] sm:hidden">
					{#if popularItems.length === 0}
						<p class="p-6 text-center text-xs text-[var(--color-stone)] italic">
							Belum ada data barang terjual/disewa.
						</p>
					{:else}
						{#each popularItems as item, idx}
							<div
								class="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--color-sand-lightest)]/30"
							>
								<!-- Left Rank Badge -->
								<div class="flex shrink-0 items-center justify-center">
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full font-bold
										{idx === 0
											? 'bg-[var(--color-amber)] text-[var(--color-earth)]'
											: idx === 1
												? 'bg-gray-300 text-gray-800'
												: idx === 2
													? 'bg-amber-600 text-white'
													: 'bg-gray-100 text-gray-500'} text-xs"
									>
										{idx + 1}
									</span>
								</div>

								<!-- Center Details -->
								<div class="flex min-w-0 flex-grow flex-col gap-1">
									<p class="truncate text-xs font-bold text-[var(--color-earth)]">{item.name}</p>
									<div class="flex items-center gap-2">
										<span
											class="inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase
											{item.type === 'rental'
												? 'border-[var(--color-success)]/10 bg-[var(--color-success-bg)] text-[var(--color-success)]'
												: item.type === 'retail'
													? 'border-[var(--color-info)]/10 bg-[var(--color-info-bg)] text-[var(--color-info)]'
													: 'border-[var(--color-warning)]/10 bg-[var(--color-warning-bg)] text-[var(--color-warning)]'}"
										>
											{item.type}
										</span>
										<span class="text-[10px] text-[var(--color-stone)]"
											>Qty: <strong>{item.quantity}x</strong></span
										>
									</div>
								</div>

								<!-- Right Total -->
								<div class="shrink-0 text-right">
									<span class="text-xs font-bold text-[var(--color-forest)]"
										>{formatCurrency(item.total)}</span
									>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</Card>
		</div>
	</div>
</div>
