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
		CheckCircle,
		Users,
		Store,
		Calendar,
		ArrowUpRight,
		Plus,
		ClipboardCheck,
		ClipboardList,
		ShieldAlert,
		History,
		LogOut,
		MapPin,
		Search,
		Coins
	} from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import { onMount } from 'svelte';

	import { formatCurrency, formatDate } from '$lib/utils/format';

	let { data } = $props();
	let role = $derived(data.role);
	let profile = $derived(data.profile);
	let assetStats = $derived(data.assetStats);
	let recentTransactions = $derived(data.recentTransactions);
	let ownerData = $derived(data.ownerData);
	let kasirData = $derived(data.kasirData);
	let gudangData = $derived(data.gudangData);

	/** @type {any} */
	let BarComponent = $state(null);

	onMount(async () => {
		if (role === 'owner') {
			try {
				const [
					{ Bar },
					{ Chart, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale }
				] = await Promise.all([
					import('svelte-chartjs'),
					import('chart.js')
				]);
				Chart.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
				BarComponent = Bar;
			} catch (err) {
				console.error('Failed to load chart libraries dynamically:', err);
			}
		}
	});

	// Owner targets
	let monthlyTarget = $derived(ownerData?.revenueData?.monthlyRevenueTarget || 20000000);
	let targetProgress = $derived(
		ownerData
			? Math.min(Math.round((ownerData.revenueData.totalRevenueMonth / monthlyTarget) * 100), 100)
			: 0
	);

	// Chart data
	let chartData = $derived(ownerData?.chartData);
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
					label: 'Sewa & Retail',
					data: chartData.revenueData,
					backgroundColor: 'rgba(44, 76, 59, 0.8)', // forest color
					borderColor: 'rgba(44, 76, 59, 1)',
					borderWidth: 1,
					borderRadius: 4
				},
				{
					label: 'Denda',
					data: chartData.penaltyData,
					backgroundColor: 'rgba(185, 28, 28, 0.8)', // red-700
					borderColor: 'rgba(185, 28, 28, 1)',
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
			legend: {
				display: true,
				position: /** @type {'top'} */ ('top'),
				labels: {
					boxWidth: 12,
					font: { size: 11, weight: /** @type {'bold'} */ ('bold') }
				}
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
						return 'Rp ' + value / 1000 + 'k'; // simplify numbers
					}
				}
			}
		}
	};

	// Log activity translations
	/** @param {string} act */
	function getActionLabel(act) {
		/** @type {Record<string, string>} */
		const maps = {
			item_returned: 'Pengembalian Barang',
			checkout: 'Transaksi Baru (POS)',
			penalty_rule_updated: 'Update Aturan Denda',
			item_created: 'Tambah Barang Baru',
			staff_created: 'Tambah Staff Baru',
			branch_created: 'Tambah Cabang Baru'
		};
		return maps[act] || act;
	}

	/** @param {string} act */
	function getLogBadgeColor(act) {
		if (act === 'item_returned') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
		if (act === 'checkout') return 'bg-blue-50 text-blue-700 border-blue-100';
		if (act === 'penalty_rule_updated') return 'bg-amber-50 text-amber-700 border-amber-100';
		return 'bg-gray-50 text-gray-700 border-gray-100';
	}
</script>

<div class="mx-auto max-w-7xl space-y-6 pb-12">
	<!-- Modern Welcome Banner Card -->
	<div
		class="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-[#182C0D] to-[#2E5519] p-6 text-white shadow-md md:p-8"
	>
		<div class="relative z-10 max-w-2xl space-y-2">
			<span
				class="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-amber-300 uppercase backdrop-blur-md"
			>
				{role === 'owner' ? 'Owner Access' : role === 'kasir' ? 'Kasir Access' : 'Gudang Access'}
			</span>
			<h1 class="font-heading text-2xl font-bold text-white md:text-4xl">
				Selamat Datang Kembali, {profile?.full_name || 'User'}!
			</h1>
			<p class="text-sm leading-relaxed text-white/80 md:text-base">
				{#if role === 'owner'}
					Pantau metrik penjualan, tren denda, performa seluruh cabang, dan log aktivitas secara
					real-time dari satu tempat.
				{:else}
					Semoga aktivitas pelayanan operasional dan pengelolaan aset hari ini berjalan dengan
					lancar dan tertib.
				{/if}
			</p>
		</div>
		<!-- Geometric background accent -->
		<div
			class="absolute top-0 right-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-white/5 blur-2xl"
		></div>
		<div
			class="absolute right-0 bottom-0 h-48 w-48 translate-x-4 translate-y-12 rounded-full bg-white/5 blur-xl"
		></div>
	</div>

	<!-- ================== 1. OWNER LAYOUT ================== -->
	{#if role === 'owner' && ownerData}
		<!-- target pencapaian & KPI overview -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Target progress -->
			<Card
				padding="md"
				class="flex flex-col justify-between border border-[var(--color-border)] bg-white shadow-sm lg:col-span-1"
			>
				<div>
					<h3 class="mb-2 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase">
						Target Pendapatan Bulan Ini
					</h3>
					<div class="mb-1 flex items-baseline justify-between">
						<span class="font-heading text-3xl font-extrabold text-[var(--color-earth)]"
							>{targetProgress}%</span
						>
						<span class="text-xs text-[var(--color-stone)]"
							>{formatCurrency(ownerData.revenueData.totalRevenueMonth)} / {formatCurrency(
								monthlyTarget
							)}</span
						>
					</div>
					<!-- Progress bar -->
					<div
						class="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--color-sand)] shadow-inner"
					>
						<div
							class="h-3 rounded-full bg-[var(--color-forest)] transition-all duration-500"
							style="width: {targetProgress}%;"
						></div>
					</div>
				</div>
				<p class="mt-4 text-[11px] text-[var(--color-stone)]">
					Batas aman target bulanan. Tingkatkan penyewaan barang dan penawaran paket bundling untuk
					mempercepat pencapaian target.
				</p>
			</Card>

			<!-- KPI Cards Grid -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-2">
				<!-- Total Revenue -->
				<div
					class="flex flex-col justify-between rounded-lg border-none bg-gradient-to-br from-[var(--color-forest)] to-[#1E3710] p-5 text-white shadow-[var(--shadow-sm)]"
				>
					<div class="flex items-start justify-between">
						<div>
							<p class="mb-1 text-xs font-semibold tracking-wider text-white/85 uppercase">
								Pendapatan Bulan Ini
							</p>
							<h3 class="font-heading text-2xl font-bold text-white">
								{formatCurrency(ownerData.revenueData.totalRevenueMonth)}
							</h3>
						</div>
						<div class="rounded-lg bg-white/10 p-2 text-amber-300"><TrendingUp size={20} /></div>
					</div>
					<div class="mt-4 space-y-0.5 border-t border-white/10 pt-2 text-[10px] text-white/80">
						<div class="flex justify-between">
							<span>Sewa & Retail:</span>
							<span class="font-bold text-white"
								>{formatCurrency(ownerData.revenueData.totalTxRevenueMonth)}</span
							>
						</div>
						<div class="flex justify-between">
							<span>Denda Lunas:</span>
							<span class="font-bold text-amber-300"
								>{formatCurrency(ownerData.revenueData.totalPenaltyRevenueMonth)}</span
							>
						</div>
					</div>
				</div>

				<!-- Transactions -->
				<Card
					padding="md"
					class="flex flex-col justify-between border border-[var(--color-border)] bg-white shadow-sm"
				>
					<div class="flex items-start justify-between">
						<div>
							<p
								class="mb-1 text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase"
							>
								Transaksi Sukses
							</p>
							<h3 class="font-heading text-2xl font-bold text-[var(--color-earth)]">
								{ownerData.revenueData.successfulTrxCountMonth}
							</h3>
						</div>
						<div class="rounded-lg bg-[var(--color-success)]/10 p-2 text-[var(--color-success)]">
							<Activity size={20} />
						</div>
					</div>
					<p class="mt-4 text-xs text-[var(--color-stone)]">
						Transaksi berstatus lunas yang sukses dicatat pada bulan berjalan.
					</p>
				</Card>

				<!-- Business Size -->
				<Card
					padding="md"
					class="flex flex-col justify-between border border-[var(--color-border)] bg-white shadow-sm"
				>
					<div class="flex items-start justify-between">
						<div>
							<p
								class="mb-1 text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase"
							>
								Ekosistem Bisnis
							</p>
							<h3 class="font-heading text-2xl font-bold text-[var(--color-earth)]">
								{ownerData.customerCount}
							</h3>
						</div>
						<div class="rounded-lg bg-[var(--color-amber)]/10 p-2 text-[var(--color-amber)]">
							<Users size={20} />
						</div>
					</div>
					<div
						class="mt-4 flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-[var(--color-border-light)] pt-2 text-[10px] text-[var(--color-stone)]"
					>
						<span>Penyewa: <strong>{ownerData.customerCount}</strong></span>
						<span>Staff: <strong>{ownerData.staffCount}</strong></span>
						<span>Cabang: <strong>{ownerData.branchCount}</strong></span>
					</div>
				</Card>
			</div>
		</div>

		<!-- Trend Chart -->
		{#if BarComponent && chartConfig()}
			<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
				<h3
					class="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase"
				>
					<TrendingUp size={18} /> Tren Pendapatan Harian (7 Hari Terakhir)
				</h3>
				<div class="h-[240px] w-full sm:h-[300px]">
					<BarComponent data={chartConfig()} options={chartOptions} />
				</div>
			</Card>
		{/if}

		<!-- Log & Recent Transactions -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Activity Log Feed -->
			<Card
				padding="md"
				class="flex flex-col justify-between border border-[var(--color-border)] bg-white shadow-sm lg:col-span-1"
			>
				<div>
					<h3
						class="mb-4 flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase"
					>
						<History size={16} /> Log Aktivitas Terbaru
					</h3>
					<div
						class="max-h-[350px] divide-y divide-[var(--color-border-light)] overflow-y-auto pr-1"
					>
						{#if ownerData.recentLogs.length === 0}
							<p class="py-8 text-center text-xs text-[var(--color-stone)] italic">
								Belum ada aktivitas tercatat.
							</p>
						{:else}
							{#each ownerData.recentLogs as log}
								<div class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
									<div class="flex items-start justify-between gap-2">
										<span class="truncate text-xs font-semibold text-[var(--color-earth)]"
											>{log.profile?.full_name || 'System'}</span
										>
										<span class="text-[10px] whitespace-nowrap text-[var(--color-stone)]"
											>{formatDate(log.created_at, { hour: '2-digit', minute: '2-digit' })}</span
										>
									</div>
									<div class="mt-0.5 flex items-center justify-between gap-1.5">
										<p class="truncate text-[11px] text-[var(--color-stone)]">
											{getActionLabel(log.action)}
										</p>
										<span
											class="rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider whitespace-nowrap uppercase {getLogBadgeColor(
												log.action
											)}"
										>
											{log.profile?.role || 'SYSTEM'}
										</span>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<!-- eslint-disable-next-line -->
				<a
					href="/activity-log"
					class="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
				>
					Buka Log Aktivitas Lengkap <ArrowRight size={12} />
				</a>
			</Card>

			<!-- Recent Transactions Table -->
			<Card
				padding="none"
				class="flex flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm lg:col-span-2"
			>
				<div>
					<div class="flex items-center justify-between border-b border-[var(--color-border)] p-4">
						<h3
							class="flex items-center gap-1.5 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							💳 Transaksi Terbaru
						</h3>
					</div>

					<!-- Desktop Transactions Table -->
					<div class="hidden overflow-x-auto sm:block">
						<table class="w-full text-left text-xs whitespace-nowrap">
							<thead
								class="border-b border-[var(--color-border)] bg-[var(--color-sand-light)] font-semibold text-[var(--color-earth)]"
							>
								<tr>
									<th class="px-4 py-3">Kode</th>
									<th class="px-4 py-3">Waktu</th>
									<th class="px-4 py-3">Pelanggan</th>
									<th class="px-4 py-3 text-right">Total</th>
									<th class="px-4 py-3 text-center">Status</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--color-border-light)]">
								{#if recentTransactions.length === 0}
									<tr>
										<td colspan="5" class="px-4 py-8 text-center text-[var(--color-stone)] italic"
											>Belum ada transaksi terbaru.</td
										>
									</tr>
								{:else}
									{#each recentTransactions as trx}
										<tr class="transition-colors hover:bg-[var(--color-sand-lightest)]/30">
											<td class="px-4 py-3 font-mono font-bold text-[var(--color-earth)]">
												<a href="/transactions/{trx.id}" class="hover:text-[var(--color-forest)]"
													>{trx.transaction_code}</a
												>
											</td>
											<td class="px-4 py-3 text-[var(--color-stone)]"
												>{formatDate(trx.created_at, {
													day: '2-digit',
													month: 'short',
													hour: '2-digit',
													minute: '2-digit'
												})}</td
											>
											<td class="max-w-[120px] truncate px-4 py-3 font-medium"
												>{trx.customer?.full_name || 'Umum'}</td
											>
											<td class="px-4 py-3 text-right font-bold text-[var(--color-forest)]"
												>{formatCurrency(trx.total_amount)}</td
											>
											<td class="px-4 py-3 text-center">
												{#if trx.payment_status === 'paid'}
													<span
														class="inline-flex items-center gap-0.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
													>
														<CheckCircle size={10} /> Lunas
													</span>
												{:else}
													<span
														class="inline-flex items-center gap-0.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
													>
														<Clock size={10} />
														{trx.payment_status}
													</span>
												{/if}
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>

					<!-- Mobile Transactions Card List -->
					<div class="block divide-y divide-[var(--color-border-light)] sm:hidden">
						{#if recentTransactions.length === 0}
							<p class="p-6 text-center text-xs text-[var(--color-stone)] italic">
								Belum ada transaksi terbaru.
							</p>
						{:else}
							{#each recentTransactions as trx}
								<div
									class="flex flex-col gap-2 p-4 transition-colors hover:bg-[var(--color-sand-lightest)]/30"
								>
									<div class="flex items-center justify-between">
										<a
											href="/transactions/{trx.id}"
											class="font-mono text-xs font-bold text-[var(--color-forest)] hover:underline"
										>
											{trx.transaction_code}
										</a>
										{#if trx.payment_status === 'paid'}
											<span
												class="inline-flex items-center gap-0.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700"
											>
												<CheckCircle size={8} /> Lunas
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-0.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700"
											>
												<Clock size={8} />
												{trx.payment_status}
											</span>
										{/if}
									</div>
									<div class="flex items-center justify-between text-xs text-[var(--color-earth)]">
										<span class="max-w-[150px] truncate font-medium"
											>{trx.customer?.full_name || 'Umum'}</span
										>
										<span class="font-bold text-[var(--color-forest)]"
											>{formatCurrency(trx.total_amount)}</span
										>
									</div>
									<div class="text-[10px] text-[var(--color-stone)]">
										{formatDate(trx.created_at, {
											day: '2-digit',
											month: 'short',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4">
					<!-- eslint-disable-next-line -->
					<a
						href="/transactions"
						class="flex items-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Buka Riwayat Transaksi <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>

		<!-- ================== 2. KASIR LAYOUT ================== -->
	{:else if role === 'kasir' && kasirData}
		<!-- Kasir Stats Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Today sales -->
			<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<p
							class="mb-1 text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase"
						>
							Pendapatan Cabang (Hari Ini)
						</p>
						<h3 class="font-heading text-2xl font-bold text-[var(--color-forest)]">
							{formatCurrency(kasirData.todayRevenue)}
						</h3>
						<p class="mt-2 text-[10px] text-[var(--color-stone)]">
							Total pembayaran lunas di cabang ini sejak tadi pagi
						</p>
					</div>
					<div class="rounded-lg bg-[var(--color-forest)]/10 p-2 text-[var(--color-forest)]">
						<Coins size={20} />
					</div>
				</div>
			</Card>

			<!-- Today Trx -->
			<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<p
							class="mb-1 text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase"
						>
							Transaksi Cabang (Hari Ini)
						</p>
						<h3 class="font-heading text-2xl font-bold text-[var(--color-earth)]">
							{kasirData.todayTrxCount} Transaksi
						</h3>
						<p class="mt-2 text-[10px] text-[var(--color-stone)]">
							Volume penjualan lunas hari ini
						</p>
					</div>
					<div class="rounded-lg bg-[var(--color-success)]/10 p-2 text-[var(--color-success)]">
						<Activity size={20} />
					</div>
				</div>
			</Card>

			<!-- Active Rentals -->
			<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
				<div class="flex items-start justify-between">
					<div>
						<p
							class="mb-1 text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase"
						>
							Penyewaan Aktif Cabang
						</p>
						<h3 class="font-heading text-2xl font-bold text-[var(--color-earth)]">
							{kasirData.activeRentalsCount} Unit
						</h3>
						<p class="mt-2 text-[10px] text-[var(--color-stone)]">
							Fisik unit tenda/alat sedang dibawa pelanggan
						</p>
					</div>
					<div class="rounded-lg bg-[var(--color-amber)]/10 p-2 text-[var(--color-amber)]">
						<Tent size={20} />
					</div>
				</div>
			</Card>
		</div>

		<!-- Kasir Quick Action Panel -->
		<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
			<h3 class="mb-4 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase">
				🚀 Akses Menu Cepat
			</h3>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<a
					href="/pos"
					class="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-forest)]/5 p-4 text-[var(--color-forest)] shadow-sm transition-all duration-200 hover:border-[var(--color-forest)]/30 hover:bg-[var(--color-forest)]/10 active:scale-[0.99]"
				>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-[var(--color-forest)]/10 p-2"><Plus size={20} /></div>
						<div class="text-left">
							<p class="text-sm font-bold">Mulai Transaksi Baru (POS)</p>
							<p class="mt-0.5 text-[10px] text-[var(--color-stone)]">
								Input order penyewaan baru atau pembelian retail
							</p>
						</div>
					</div>
					<ArrowRight size={18} />
				</a>

				<a
					href="/returns"
					class="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-earth)]/20 bg-[var(--color-earth)]/5 p-4 text-[var(--color-earth)] shadow-sm transition-all duration-200 hover:border-[var(--color-earth)]/30 hover:bg-[var(--color-earth)]/10 active:scale-[0.99]"
				>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-[var(--color-earth)]/10 p-2">
							<ClipboardCheck size={20} />
						</div>
						<div class="text-left">
							<p class="text-sm font-bold">Proses Pengembalian Barang</p>
							<p class="mt-0.5 text-[10px] text-[var(--color-stone)]">
								Terima barang sewa kembali, cek kerusakan & denda
							</p>
						</div>
					</div>
					<ArrowRight size={18} />
				</a>
			</div>
		</Card>

		<!-- Operational Pickup & Return Lists -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Pickups Today -->
			<Card
				padding="none"
				class="flex min-h-[300px] flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
					>
						<h3
							class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							<ClipboardList size={16} class="text-[var(--color-forest)]" /> Pengambilan Barang (Hari
							Ini)
						</h3>
						<Badge variant="info" class="text-[10px]">{kasirData.todaysPickups.length}</Badge>
					</div>
					<div class="max-h-[300px] divide-y divide-[var(--color-border-light)] overflow-y-auto">
						{#if kasirData.todaysPickups.length === 0}
							<div
								class="flex flex-col items-center justify-center gap-2 p-8 text-center text-xs text-[var(--color-stone)] italic"
							>
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada pengambilan terjadwal untuk hari ini.</span>
							</div>
						{:else}
							{#each kasirData.todaysPickups as item}
								<div
									class="flex items-center justify-between p-4 transition-colors hover:bg-[var(--color-sand-lightest)]/30"
								>
									<div>
										<p class="text-sm font-bold text-[var(--color-earth)]">{item.item_name}</p>
										<p class="mt-0.5 text-xs text-[var(--color-stone)]">
											Penyewa: {item.transaction?.customer?.full_name || 'Umum'} ({item.transaction
												?.customer?.phone || '-'})
										</p>
									</div>
									<div class="text-right">
										<span
											class="inline-block rounded bg-[var(--color-forest)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-forest)]"
											>Ambil</span
										>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4 text-center">
					<!-- eslint-disable-next-line -->
					<a
						href="/booking"
						class="flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Buka Kalender Booking <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Returns Due Today -->
			<Card
				padding="none"
				class="flex min-h-[300px] flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
					>
						<h3
							class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							<ShieldAlert size={16} class="text-[var(--color-error)]" /> Pengembalian Jatuh Tempo (Hari
							Ini / Terlambat)
						</h3>
						<Badge variant="error" class="border-red-200 bg-red-100 text-[10px] text-red-800"
							>{kasirData.todaysReturnsDue.length}</Badge
						>
					</div>
					<div class="max-h-[300px] divide-y divide-[var(--color-border-light)] overflow-y-auto">
						{#if kasirData.todaysReturnsDue.length === 0}
							<div
								class="flex flex-col items-center justify-center gap-2 p-8 text-center text-xs text-[var(--color-stone)] italic"
							>
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Semua barang sewa jatuh tempo hari ini sudah kembali.</span>
							</div>
						{:else}
							{#each kasirData.todaysReturnsDue as item}
								{@const isOverdue =
									new Date(item.rental_end_date) < new Date(new Date().setHours(0, 0, 0, 0))}
								<div
									class="flex items-center justify-between p-4 transition-colors hover:bg-[var(--color-sand-lightest)]/30"
								>
									<div>
										<p class="text-sm font-bold text-[var(--color-earth)]">{item.item_name}</p>
										<p class="mt-0.5 text-xs text-[var(--color-stone)]">
											Penyewa: {item.transaction?.customer?.full_name || 'Umum'} ({item.transaction
												?.customer?.phone || '-'})
										</p>
									</div>
									<div class="flex flex-col items-end gap-1 text-right">
										<span class="text-[10px] text-[var(--color-stone)]"
											>Batas: {formatDate(item.rental_end_date, {
												day: '2-digit',
												month: 'short'
											})}</span
										>
										{#if isOverdue}
											<span
												class="inline-block animate-pulse rounded bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800"
												>TELAT</span
											>
										{:else}
											<span
												class="inline-block rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800"
												>HARI INI</span
											>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4 text-center">
					<!-- eslint-disable-next-line -->
					<a
						href="/returns"
						class="flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Proses Pengembalian Barang <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>

		<!-- ================== 3. GUDANG LAYOUT ================== -->
	{:else if role === 'gudang' && gudangData}
		<!-- Gudang Stats Grid (Asset count cards) -->
		<Card padding="md" class="border border-[var(--color-border)] bg-white shadow-sm">
			<h3
				class="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-[var(--color-earth)] uppercase"
			>
				<PackageCheck size={18} /> Status Aset Fisik (Gudang)
			</h3>
			<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<!-- Ready -->
				<div
					class="flex min-w-0 items-center justify-between rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-3 sm:p-4"
				>
					<div class="flex min-w-0 items-center gap-1.5 text-[var(--color-success)]">
						<div class="shrink-0 rounded-lg bg-[var(--color-success)]/20 p-1.5">
							<Tent size={16} />
						</div>
						<span class="truncate text-[11px] font-bold sm:text-xs">Siap Sewa</span>
					</div>
					<span
						class="ml-1 shrink-0 font-heading text-xl font-bold text-[var(--color-success)] sm:text-2xl"
						>{assetStats.ready}</span
					>
				</div>

				<!-- Rented -->
				<div
					class="flex min-w-0 items-center justify-between rounded-xl border border-[var(--color-info)]/20 bg-[var(--color-info)]/5 p-3 sm:p-4"
				>
					<div class="flex min-w-0 items-center gap-1.5 text-[var(--color-info)]">
						<div class="shrink-0 rounded-lg bg-[var(--color-info)]/20 p-1.5">
							<Activity size={16} />
						</div>
						<span class="truncate text-[11px] font-bold sm:text-xs">Disewa</span>
					</div>
					<span
						class="ml-1 shrink-0 font-heading text-xl font-bold text-[var(--color-info)] sm:text-2xl"
						>{assetStats.rented}</span
					>
				</div>

				<!-- Washing -->
				<div
					class="flex min-w-0 items-center justify-between rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 p-3 sm:p-4"
				>
					<div class="flex min-w-0 items-center gap-1.5 text-[var(--color-warning)]">
						<div class="shrink-0 rounded-lg bg-[var(--color-warning)]/20 p-1.5">
							<Droplets size={16} />
						</div>
						<span class="truncate text-[11px] font-bold sm:text-xs">Dicuci</span>
					</div>
					<span
						class="ml-1 shrink-0 font-heading text-xl font-bold text-[var(--color-warning)] sm:text-2xl"
						>{assetStats.washing}</span
					>
				</div>

				<!-- Maintenance -->
				<div
					class="flex min-w-0 items-center justify-between rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-3 sm:p-4"
				>
					<div class="flex min-w-0 items-center gap-1.5 text-[var(--color-error)]">
						<div class="shrink-0 rounded-lg bg-[var(--color-error)]/20 p-1.5">
							<Wrench size={16} />
						</div>
						<span class="truncate text-[11px] font-bold sm:text-xs">Servis</span>
					</div>
					<span
						class="ml-1 shrink-0 font-heading text-xl font-bold text-[var(--color-error)] sm:text-2xl"
						>{assetStats.maintenance}</span
					>
				</div>
			</div>
		</Card>

		<!-- Gudang lists -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Washing List -->
			<Card
				padding="none"
				class="flex min-h-[300px] flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
					>
						<h3
							class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							<Droplets size={16} class="text-[var(--color-warning)]" /> Antrean Pembersihan / Cuci
						</h3>
						<Badge variant="warning" class="text-[10px]">{gudangData.washingAssets.length}</Badge>
					</div>
					<div class="max-h-[300px] divide-y divide-[var(--color-border-light)] overflow-y-auto">
						{#if gudangData.washingAssets.length === 0}
							<div
								class="flex flex-col items-center justify-center gap-2 p-8 text-center text-xs text-[var(--color-stone)] italic"
							>
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Semua aset bersih & siap disewa.</span>
							</div>
						{:else}
							{#each gudangData.washingAssets as asset}
								<div class="p-3.5 transition-colors hover:bg-[var(--color-sand-lightest)]/30">
									<div class="flex items-start justify-between">
										<p class="text-xs font-bold text-[var(--color-earth)]">
											{asset.item?.name || 'Aset'}
										</p>
										<span
											class="rounded bg-[var(--color-sand)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-earth)]"
											>{asset.asset_code}</span
										>
									</div>
									<p class="mt-1 text-[10px] text-[var(--color-stone)]">
										Masuk antrean: {formatDate(asset.last_status_change, {
											day: '2-digit',
											month: 'short',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4">
					<!-- eslint-disable-next-line -->
					<a
						href="/asset-status"
						class="flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Update Status Aset <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Maintenance List -->
			<Card
				padding="none"
				class="flex min-h-[300px] flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
					>
						<h3
							class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							<Wrench size={16} class="text-[var(--color-error)]" /> Antrean Servis / Perbaikan
						</h3>
						<Badge variant="error" class="border-red-200 bg-red-100 text-[10px] text-red-800"
							>{gudangData.maintenanceAssets.length}</Badge
						>
					</div>
					<div class="max-h-[300px] divide-y divide-[var(--color-border-light)] overflow-y-auto">
						{#if gudangData.maintenanceAssets.length === 0}
							<div
								class="flex flex-col items-center justify-center gap-2 p-8 text-center text-xs text-[var(--color-stone)] italic"
							>
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada aset dalam perbaikan.</span>
							</div>
						{:else}
							{#each gudangData.maintenanceAssets as asset}
								<div class="p-3.5 transition-colors hover:bg-[var(--color-sand-lightest)]/30">
									<div class="flex items-start justify-between">
										<p class="text-xs font-bold text-[var(--color-earth)]">
											{asset.item?.name || 'Aset'}
										</p>
										<span
											class="rounded bg-[var(--color-sand)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-earth)]"
											>{asset.asset_code}</span
										>
									</div>
									<p class="mt-1 text-[10px] text-[var(--color-stone)]">
										Masuk servis: {formatDate(asset.last_status_change, {
											day: '2-digit',
											month: 'short',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4">
					<!-- eslint-disable-next-line -->
					<a
						href="/asset-status"
						class="flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Update Status Aset <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Shipments List -->
			<Card
				padding="none"
				class="flex min-h-[300px] flex-col justify-between overflow-hidden border border-[var(--color-border)] bg-white shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
					>
						<h3
							class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[var(--color-earth)] uppercase"
						>
							<ClipboardList size={16} class="text-[var(--color-forest)]" /> Persiapan Kirim / Ambil (Hari
							Ini)
						</h3>
						<Badge variant="info" class="text-[10px]">{gudangData.todaysShipments.length}</Badge>
					</div>
					<div class="max-h-[300px] divide-y divide-[var(--color-border-light)] overflow-y-auto">
						{#if gudangData.todaysShipments.length === 0}
							<div
								class="flex flex-col items-center justify-center gap-2 p-8 text-center text-xs text-[var(--color-stone)] italic"
							>
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada pengiriman keluar hari ini.</span>
							</div>
						{:else}
							{#each gudangData.todaysShipments as shipment}
								<div class="p-3.5 transition-colors hover:bg-[var(--color-sand-lightest)]/30">
									<div class="flex items-start justify-between">
										<p class="text-xs font-bold text-[var(--color-earth)]">{shipment.item_name}</p>
										<span
											class="inline-block rounded bg-[var(--color-forest)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-forest)]"
											>Kirim</span
										>
									</div>
									<p class="mt-1 text-[10px] text-[var(--color-stone)]">
										Penyewa: {shipment.transaction?.customer?.full_name || 'Umum'}
									</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="border-t border-[var(--color-border-light)] p-4">
					<!-- eslint-disable-next-line -->
					<a
						href="/booking"
						class="flex items-center justify-center gap-1 text-xs font-bold text-[var(--color-forest)] hover:underline"
					>
						Lihat Jadwal Booking <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>
	{/if}
</div>
