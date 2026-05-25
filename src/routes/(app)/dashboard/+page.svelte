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
	let profile = $derived(data.profile);
	let assetStats = $derived(data.assetStats);
	let recentTransactions = $derived(data.recentTransactions);
	let ownerData = $derived(data.ownerData);
	let kasirData = $derived(data.kasirData);
	let gudangData = $derived(data.gudangData);

	// Owner targets
	let monthlyTarget = $derived(ownerData?.revenueData?.monthlyRevenueTarget || 20000000);
	let targetProgress = $derived(
		ownerData ? Math.min(Math.round((ownerData.revenueData.totalRevenueMonth / monthlyTarget) * 100), 100) : 0
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
			x: { stacked: true },
			y: {
				stacked: true,
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

<div class="space-y-6 max-w-7xl mx-auto pb-12">
	
	<!-- Modern Welcome Banner Card -->
	<div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#182C0D] to-[#2E5519] text-white p-6 md:p-8 shadow-md border border-white/5">
		<div class="relative z-10 max-w-2xl space-y-2">
			<span class="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-amber-300">
				{role === 'owner' ? 'Owner Access' : role === 'kasir' ? 'Kasir Access' : 'Gudang Access'}
			</span>
			<h1 class="text-2xl md:text-4xl font-bold font-heading text-white">
				Selamat Datang Kembali, {profile?.full_name || 'User'}!
			</h1>
			<p class="text-white/80 text-sm md:text-base leading-relaxed">
				{#if role === 'owner'}
					Pantau metrik penjualan, tren denda, performa seluruh cabang, dan log aktivitas secara real-time dari satu tempat.
				{:else}
					Semoga aktivitas pelayanan operasional dan pengelolaan aset hari ini berjalan dengan lancar dan tertib.
				{/if}
			</p>
		</div>
		<!-- Geometric background accent -->
		<div class="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
		<div class="absolute bottom-0 right-0 translate-y-12 translate-x-4 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>
	</div>

	<!-- ================== 1. OWNER LAYOUT ================== -->
	{#if role === 'owner' && ownerData}
		
		<!-- target pencapaian & KPI overview -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Target progress -->
			<Card padding="md" class="lg:col-span-1 border border-[var(--color-border)] shadow-sm bg-white flex flex-col justify-between">
				<div>
					<h3 class="font-bold text-[var(--color-earth)] text-sm uppercase tracking-wider mb-2">Target Pendapatan Bulan Ini</h3>
					<div class="flex justify-between items-baseline mb-1">
						<span class="text-3xl font-extrabold text-[var(--color-earth)] font-heading">{targetProgress}%</span>
						<span class="text-xs text-[var(--color-stone)]">{formatCurrency(ownerData.revenueData.totalRevenueMonth)} / {formatCurrency(monthlyTarget)}</span>
					</div>
					<!-- Progress bar -->
					<div class="w-full bg-[var(--color-sand)] rounded-full h-3 overflow-hidden mt-3 shadow-inner">
						<div class="bg-[var(--color-forest)] h-3 rounded-full transition-all duration-500" style="width: {targetProgress}%;"></div>
					</div>
				</div>
				<p class="text-[11px] text-[var(--color-stone)] mt-4">
					Batas aman target bulanan. Tingkatkan penyewaan barang dan penawaran paket bundling untuk mempercepat pencapaian target.
				</p>
			</Card>

			<!-- KPI Cards Grid -->
			<div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
				<!-- Total Revenue -->
				<div class="bg-gradient-to-br from-[var(--color-forest)] to-[#1E3710] text-white p-5 rounded-lg shadow-[var(--shadow-sm)] flex flex-col justify-between border-none">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-white/85 text-xs font-semibold uppercase tracking-wider mb-1">Pendapatan Bulan Ini</p>
							<h3 class="text-2xl font-bold font-heading text-white">{formatCurrency(ownerData.revenueData.totalRevenueMonth)}</h3>
						</div>
						<div class="p-2 bg-white/10 rounded-lg text-amber-300"><TrendingUp size={20} /></div>
					</div>
					<div class="text-[10px] text-white/80 border-t border-white/10 pt-2 mt-4 space-y-0.5">
						<div class="flex justify-between"><span>Sewa & Retail:</span> <span class="font-bold text-white">{formatCurrency(ownerData.revenueData.totalTxRevenueMonth)}</span></div>
						<div class="flex justify-between"><span>Denda Lunas:</span> <span class="font-bold text-amber-300">{formatCurrency(ownerData.revenueData.totalPenaltyRevenueMonth)}</span></div>
					</div>
				</div>

				<!-- Transactions -->
				<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white flex flex-col justify-between">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-[var(--color-stone)] text-xs font-semibold uppercase tracking-wider mb-1">Transaksi Sukses</p>
							<h3 class="text-2xl font-bold font-heading text-[var(--color-earth)]">{ownerData.revenueData.successfulTrxCountMonth}</h3>
						</div>
						<div class="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg"><Activity size={20} /></div>
					</div>
					<p class="text-xs text-[var(--color-stone)] mt-4">Transaksi berstatus lunas yang sukses dicatat pada bulan berjalan.</p>
				</Card>

				<!-- Business Size -->
				<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white flex flex-col justify-between">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-[var(--color-stone)] text-xs font-semibold uppercase tracking-wider mb-1">Ekosistem Bisnis</p>
							<h3 class="text-2xl font-bold font-heading text-[var(--color-earth)]">{ownerData.customerCount}</h3>
						</div>
						<div class="p-2 bg-[var(--color-amber)]/10 text-[var(--color-amber)] rounded-lg"><Users size={20} /></div>
					</div>
					<div class="text-[10px] text-[var(--color-stone)] border-t border-[var(--color-border-light)] pt-2 mt-4 flex justify-between">
						<span>Penyewa: <strong>{ownerData.customerCount}</strong></span>
						<span>Staff: <strong>{ownerData.staffCount}</strong></span>
						<span>Cabang: <strong>{ownerData.branchCount}</strong></span>
					</div>
				</Card>
			</div>
		</div>

		<!-- Trend Chart -->
		{#if chartConfig()}
			<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
				<h3 class="font-bold text-[var(--color-earth)] mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
					<TrendingUp size={18} /> Tren Pendapatan Harian (7 Hari Terakhir)
				</h3>
				<div class="h-[300px] w-full">
					<Bar data={chartConfig()} options={chartOptions} />
				</div>
			</Card>
		{/if}

		<!-- Log & Recent Transactions -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Activity Log Feed -->
			<Card padding="md" class="lg:col-span-1 border border-[var(--color-border)] shadow-sm bg-white flex flex-col justify-between">
				<div>
					<h3 class="font-bold text-[var(--color-earth)] mb-4 text-sm uppercase tracking-wider flex items-center gap-1.5">
						<History size={16} /> Log Aktivitas Terbaru
					</h3>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[350px] overflow-y-auto pr-1">
						{#if ownerData.recentLogs.length === 0}
							<p class="text-center py-8 text-[var(--color-stone)] italic text-xs">Belum ada aktivitas tercatat.</p>
						{:else}
							{#each ownerData.recentLogs as log}
								<div class="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
									<div class="flex justify-between items-start gap-2">
										<span class="text-xs font-semibold text-[var(--color-earth)] truncate">{log.profile?.full_name || 'System'}</span>
										<span class="text-[10px] text-[var(--color-stone)] whitespace-nowrap">{formatDate(log.created_at, { hour: '2-digit', minute: '2-digit' })}</span>
									</div>
									<div class="flex items-center justify-between gap-1.5 mt-0.5">
										<p class="text-[11px] text-[var(--color-stone)] truncate">{getActionLabel(log.action)}</p>
										<span class="px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider whitespace-nowrap {getLogBadgeColor(log.action)}">
											{log.profile?.role || 'SYSTEM'}
										</span>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<!-- eslint-disable-next-line -->
				<a href="/activity-log" class="text-xs font-bold text-[var(--color-forest)] hover:underline mt-4 flex items-center gap-1">
					Buka Log Aktivitas Lengkap <ArrowRight size={12} />
				</a>
			</Card>

			<!-- Recent Transactions Table -->
			<Card padding="none" class="lg:col-span-2 border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
						<h3 class="font-bold text-[var(--color-earth)] text-sm uppercase tracking-wider flex items-center gap-1.5">
							💳 Transaksi Terbaru
						</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs whitespace-nowrap">
							<thead class="bg-[var(--color-sand-light)] text-[var(--color-earth)] font-semibold border-b border-[var(--color-border)]">
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
										<td colspan="5" class="px-4 py-8 text-center text-[var(--color-stone)] italic">Belum ada transaksi terbaru.</td>
									</tr>
								{:else}
									{#each recentTransactions as trx}
										<tr class="hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
											<td class="px-4 py-3 font-mono font-bold text-[var(--color-earth)]">
												<a href="/transactions/{trx.id}" class="hover:text-[var(--color-forest)]">{trx.transaction_code}</a>
											</td>
											<td class="px-4 py-3 text-[var(--color-stone)]">{formatDate(trx.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
											<td class="px-4 py-3 font-medium truncate max-w-[120px]">{trx.customer?.full_name || 'Umum'}</td>
											<td class="px-4 py-3 text-right font-bold text-[var(--color-forest)]">{formatCurrency(trx.total_amount)}</td>
											<td class="px-4 py-3 text-center">
												{#if trx.payment_status === 'paid'}
													<span class="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-semibold text-[10px]">
														<CheckCircle size={10} /> Lunas
													</span>
												{:else}
													<span class="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-semibold text-[10px]">
														<Clock size={10} /> {trx.payment_status}
													</span>
												{/if}
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)]">
					<!-- eslint-disable-next-line -->
					<a href="/transactions" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center gap-1">
						Buka Riwayat Transaksi <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>

	<!-- ================== 2. KASIR LAYOUT ================== -->
	{:else if role === 'kasir' && kasirData}
		
		<!-- Kasir Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Today sales -->
			<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
				<div class="flex justify-between items-start">
					<div>
						<p class="text-[var(--color-stone)] text-xs font-semibold uppercase tracking-wider mb-1">Pendapatan Cabang (Hari Ini)</p>
						<h3 class="text-2xl font-bold font-heading text-[var(--color-forest)]">{formatCurrency(kasirData.todayRevenue)}</h3>
						<p class="text-[10px] text-[var(--color-stone)] mt-2">Total pembayaran lunas di cabang ini sejak tadi pagi</p>
					</div>
					<div class="p-2 bg-[var(--color-forest)]/10 text-[var(--color-forest)] rounded-lg"><Coins size={20} /></div>
				</div>
			</Card>

			<!-- Today Trx -->
			<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
				<div class="flex justify-between items-start">
					<div>
						<p class="text-[var(--color-stone)] text-xs font-semibold uppercase tracking-wider mb-1">Transaksi Cabang (Hari Ini)</p>
						<h3 class="text-2xl font-bold font-heading text-[var(--color-earth)]">{kasirData.todayTrxCount} Transaksi</h3>
						<p class="text-[10px] text-[var(--color-stone)] mt-2">Volume penjualan lunas hari ini</p>
					</div>
					<div class="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg"><Activity size={20} /></div>
				</div>
			</Card>

			<!-- Active Rentals -->
			<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
				<div class="flex justify-between items-start">
					<div>
						<p class="text-[var(--color-stone)] text-xs font-semibold uppercase tracking-wider mb-1">Penyewaan Aktif Cabang</p>
						<h3 class="text-2xl font-bold font-heading text-[var(--color-earth)]">{kasirData.activeRentalsCount} Unit</h3>
						<p class="text-[10px] text-[var(--color-stone)] mt-2">Fisik unit tenda/alat sedang dibawa pelanggan</p>
					</div>
					<div class="p-2 bg-[var(--color-amber)]/10 text-[var(--color-amber)] rounded-lg"><Tent size={20} /></div>
				</div>
			</Card>
		</div>

		<!-- Kasir Quick Action Panel -->
		<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
			<h3 class="font-bold text-[var(--color-earth)] text-sm uppercase tracking-wider mb-4">🚀 Akses Menu Cepat</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<a 
					href="/pos" 
					class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-forest)]/20 bg-[var(--color-forest)]/5 text-[var(--color-forest)] hover:bg-[var(--color-forest)]/10 hover:border-[var(--color-forest)]/30 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
				>
					<div class="flex items-center gap-3">
						<div class="p-2 bg-[var(--color-forest)]/10 rounded-lg"><Plus size={20} /></div>
						<div class="text-left">
							<p class="font-bold text-sm">Mulai Transaksi Baru (POS)</p>
							<p class="text-[10px] text-[var(--color-stone)] mt-0.5">Input order penyewaan baru atau pembelian retail</p>
						</div>
					</div>
					<ArrowRight size={18} />
				</a>

				<a 
					href="/returns" 
					class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-earth)]/20 bg-[var(--color-earth)]/5 text-[var(--color-earth)] hover:bg-[var(--color-earth)]/10 hover:border-[var(--color-earth)]/30 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
				>
					<div class="flex items-center gap-3">
						<div class="p-2 bg-[var(--color-earth)]/10 rounded-lg"><ClipboardCheck size={20} /></div>
						<div class="text-left">
							<p class="font-bold text-sm">Proses Pengembalian Barang</p>
							<p class="text-[10px] text-[var(--color-stone)] mt-0.5">Terima barang sewa kembali, cek kerusakan & denda</p>
						</div>
					</div>
					<ArrowRight size={18} />
				</a>
			</div>
		</Card>

		<!-- Operational Pickup & Return Lists -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Pickups Today -->
			<Card padding="none" class="border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[300px]">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] flex items-center justify-between">
						<h3 class="font-bold text-[var(--color-earth)] text-xs uppercase tracking-wider flex items-center gap-1.5">
							<ClipboardList size={16} class="text-[var(--color-forest)]" /> Pengambilan Barang (Hari Ini)
						</h3>
						<Badge variant="info" class="text-[10px]">{kasirData.todaysPickups.length}</Badge>
					</div>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
						{#if kasirData.todaysPickups.length === 0}
							<div class="p-8 text-center text-[var(--color-stone)] italic text-xs flex flex-col items-center justify-center gap-2">
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada pengambilan terjadwal untuk hari ini.</span>
							</div>
						{:else}
							{#each kasirData.todaysPickups as item}
								<div class="p-4 flex justify-between items-center hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
									<div>
										<p class="font-bold text-sm text-[var(--color-earth)]">{item.item_name}</p>
										<p class="text-xs text-[var(--color-stone)] mt-0.5">Penyewa: {item.transaction?.customer?.full_name || 'Umum'} ({item.transaction?.customer?.phone || '-'})</p>
									</div>
									<div class="text-right">
										<span class="inline-block px-2 py-0.5 bg-[var(--color-forest)]/10 text-[var(--color-forest)] text-[10px] font-bold rounded">Ambil</span>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)] text-center">
					<!-- eslint-disable-next-line -->
					<a href="/booking" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center justify-center gap-1">
						Buka Kalender Booking <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Returns Due Today -->
			<Card padding="none" class="border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[300px]">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] flex items-center justify-between">
						<h3 class="font-bold text-[var(--color-earth)] text-xs uppercase tracking-wider flex items-center gap-1.5">
							<ShieldAlert size={16} class="text-[var(--color-error)]" /> Pengembalian Jatuh Tempo (Hari Ini / Terlambat)
						</h3>
						<Badge variant="error" class="text-[10px] bg-red-100 text-red-800 border-red-200">{kasirData.todaysReturnsDue.length}</Badge>
					</div>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
						{#if kasirData.todaysReturnsDue.length === 0}
							<div class="p-8 text-center text-[var(--color-stone)] italic text-xs flex flex-col items-center justify-center gap-2">
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Semua barang sewa jatuh tempo hari ini sudah kembali.</span>
							</div>
						{:else}
							{#each kasirData.todaysReturnsDue as item}
								{@const isOverdue = new Date(item.rental_end_date) < new Date(new Date().setHours(0,0,0,0))}
								<div class="p-4 flex justify-between items-center hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
									<div>
										<p class="font-bold text-sm text-[var(--color-earth)]">{item.item_name}</p>
										<p class="text-xs text-[var(--color-stone)] mt-0.5">Penyewa: {item.transaction?.customer?.full_name || 'Umum'} ({item.transaction?.customer?.phone || '-'})</p>
									</div>
									<div class="text-right flex flex-col items-end gap-1">
										<span class="text-[10px] text-[var(--color-stone)]">Batas: {formatDate(item.rental_end_date, { day: '2-digit', month: 'short' })}</span>
										{#if isOverdue}
											<span class="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-bold rounded animate-pulse">TELAT</span>
										{:else}
											<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">HARI INI</span>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)] text-center">
					<!-- eslint-disable-next-line -->
					<a href="/returns" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center justify-center gap-1">
						Proses Pengembalian Barang <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>

	<!-- ================== 3. GUDANG LAYOUT ================== -->
	{:else if role === 'gudang' && gudangData}
		
		<!-- Gudang Stats Grid (Asset count cards) -->
		<Card padding="md" class="border border-[var(--color-border)] shadow-sm bg-white">
			<h3 class="font-bold text-[var(--color-earth)] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
				<PackageCheck size={18} /> Status Aset Fisik (Gudang)
			</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<!-- Ready -->
				<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5">
					<div class="flex items-center gap-2 text-[var(--color-success)]">
						<div class="p-2 bg-[var(--color-success)]/20 rounded-lg"><Tent size={18} /></div>
						<span class="font-bold text-xs">Siap Sewa</span>
					</div>
					<span class="text-2xl font-bold font-heading text-[var(--color-success)]">{assetStats.ready}</span>
				</div>

				<!-- Rented -->
				<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-info)]/20 bg-[var(--color-info)]/5">
					<div class="flex items-center gap-2 text-[var(--color-info)]">
						<div class="p-2 bg-[var(--color-info)]/20 rounded-lg"><Activity size={18} /></div>
						<span class="font-bold text-xs">Sedang Disewa</span>
					</div>
					<span class="text-2xl font-bold font-heading text-[var(--color-info)]">{assetStats.rented}</span>
				</div>

				<!-- Washing -->
				<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5">
					<div class="flex items-center gap-2 text-[var(--color-warning)]">
						<div class="p-2 bg-[var(--color-warning)]/20 rounded-lg"><Droplets size={18} /></div>
						<span class="font-bold text-xs">Sedang Dicuci</span>
					</div>
					<span class="text-2xl font-bold font-heading text-[var(--color-warning)]">{assetStats.washing}</span>
				</div>

				<!-- Maintenance -->
				<div class="flex items-center justify-between p-4 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5">
					<div class="flex items-center gap-2 text-[var(--color-error)]">
						<div class="p-2 bg-[var(--color-error)]/20 rounded-lg"><Wrench size={18} /></div>
						<span class="font-bold text-xs">Dalam Perbaikan</span>
					</div>
					<span class="text-2xl font-bold font-heading text-[var(--color-error)]">{assetStats.maintenance}</span>
				</div>
			</div>
		</Card>

		<!-- Gudang lists -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Washing List -->
			<Card padding="none" class="border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[300px]">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] flex items-center justify-between">
						<h3 class="font-bold text-[var(--color-earth)] text-xs uppercase tracking-wider flex items-center gap-1.5">
							<Droplets size={16} class="text-[var(--color-warning)]" /> Antrean Pembersihan / Cuci
						</h3>
						<Badge variant="warning" class="text-[10px]">{gudangData.washingAssets.length}</Badge>
					</div>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
						{#if gudangData.washingAssets.length === 0}
							<div class="p-8 text-center text-[var(--color-stone)] italic text-xs flex flex-col items-center justify-center gap-2">
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Semua aset bersih & siap disewa.</span>
							</div>
						{:else}
							{#each gudangData.washingAssets as asset}
								<div class="p-3.5 hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
									<div class="flex justify-between items-start">
										<p class="font-bold text-xs text-[var(--color-earth)]">{asset.item?.name || 'Aset'}</p>
										<span class="font-mono text-[10px] font-bold bg-[var(--color-sand)] px-1.5 py-0.5 rounded text-[var(--color-earth)]">{asset.asset_code}</span>
									</div>
									<p class="text-[10px] text-[var(--color-stone)] mt-1">Masuk antrean: {formatDate(asset.last_status_change, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)]">
					<!-- eslint-disable-next-line -->
					<a href="/asset-status" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center justify-center gap-1">
						Update Status Aset <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Maintenance List -->
			<Card padding="none" class="border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[300px]">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] flex items-center justify-between">
						<h3 class="font-bold text-[var(--color-earth)] text-xs uppercase tracking-wider flex items-center gap-1.5">
							<Wrench size={16} class="text-[var(--color-error)]" /> Antrean Servis / Perbaikan
						</h3>
						<Badge variant="error" class="text-[10px] bg-red-100 text-red-800 border-red-200">{gudangData.maintenanceAssets.length}</Badge>
					</div>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
						{#if gudangData.maintenanceAssets.length === 0}
							<div class="p-8 text-center text-[var(--color-stone)] italic text-xs flex flex-col items-center justify-center gap-2">
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada aset dalam perbaikan.</span>
							</div>
						{:else}
							{#each gudangData.maintenanceAssets as asset}
								<div class="p-3.5 hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
									<div class="flex justify-between items-start">
										<p class="font-bold text-xs text-[var(--color-earth)]">{asset.item?.name || 'Aset'}</p>
										<span class="font-mono text-[10px] font-bold bg-[var(--color-sand)] px-1.5 py-0.5 rounded text-[var(--color-earth)]">{asset.asset_code}</span>
									</div>
									<p class="text-[10px] text-[var(--color-stone)] mt-1">Masuk servis: {formatDate(asset.last_status_change, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)]">
					<!-- eslint-disable-next-line -->
					<a href="/asset-status" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center justify-center gap-1">
						Update Status Aset <ArrowRight size={12} />
					</a>
				</div>
			</Card>

			<!-- Shipments List -->
			<Card padding="none" class="border border-[var(--color-border)] shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[300px]">
				<div>
					<div class="p-4 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)] flex items-center justify-between">
						<h3 class="font-bold text-[var(--color-earth)] text-xs uppercase tracking-wider flex items-center gap-1.5">
							<ClipboardList size={16} class="text-[var(--color-forest)]" /> Persiapan Kirim / Ambil (Hari Ini)
						</h3>
						<Badge variant="info" class="text-[10px]">{gudangData.todaysShipments.length}</Badge>
					</div>
					<div class="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
						{#if gudangData.todaysShipments.length === 0}
							<div class="p-8 text-center text-[var(--color-stone)] italic text-xs flex flex-col items-center justify-center gap-2">
								<CheckCircle size={32} class="text-[var(--color-success)] opacity-40" />
								<span>Tidak ada pengiriman keluar hari ini.</span>
							</div>
						{:else}
							{#each gudangData.todaysShipments as shipment}
								<div class="p-3.5 hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
									<div class="flex justify-between items-start">
										<p class="font-bold text-xs text-[var(--color-earth)]">{shipment.item_name}</p>
										<span class="inline-block px-1.5 py-0.5 bg-[var(--color-forest)]/10 text-[var(--color-forest)] text-[9px] font-bold rounded">Kirim</span>
									</div>
									<p class="text-[10px] text-[var(--color-stone)] mt-1">Penyewa: {shipment.transaction?.customer?.full_name || 'Umum'}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="p-4 border-t border-[var(--color-border-light)]">
					<!-- eslint-disable-next-line -->
					<a href="/booking" class="text-xs font-bold text-[var(--color-forest)] hover:underline flex items-center justify-center gap-1">
						Lihat Jadwal Booking <ArrowRight size={12} />
					</a>
				</div>
			</Card>
		</div>

	{/if}
</div>
