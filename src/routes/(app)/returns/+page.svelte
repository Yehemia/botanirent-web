<script>
	import { enhance } from '$app/forms';
	import { ArrowDownToLine, AlertTriangle, CheckCircle, Search, User, Calendar } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data, form } = $props();
	let { transactions } = data;

	let searchQuery = $state('');
	let selectedTrx = $state(null);
	
	// Form state per item inside selectedTrx
	let returnData = $state({}); 
	// { itemId: { condition: 'good', actualReturnDate: 'YYYY-MM-DD' } }
	
	let loading = $state(false);
	let successMsg = $state('');

	let filteredTransactions = $derived(
		transactions.filter(t => 
			t.transaction_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function selectTransaction(trx) {
		selectedTrx = trx;
		const today = new Date().toISOString().split('T')[0];
		
		// Initialize form data
		let initData = {};
		trx.items.forEach(item => {
			initData[item.id] = {
				condition: 'good',
				actualReturnDate: today
			};
		});
		returnData = initData;
	}

	function calculateLateDays(expectedEndStr, actualReturnStr) {
		const expected = new Date(expectedEndStr);
		const actual = new Date(actualReturnStr);
		
		// Reset jam untuk perbandingan hari yang adil
		expected.setHours(0,0,0,0);
		actual.setHours(0,0,0,0);
		
		const diffTime = actual - expected;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		return diffDays > 0 ? diffDays : 0;
	}

	function calculatePenalty(item) {
		const rData = returnData[item.id];
		if (!rData) return { lateDays: 0, penalty: 0, desc: '' };

		let penalty = 0;
		let desc = [];

		// 1. Denda Hilang (Ambil alih dari denda telat)
		if (rData.condition === 'lost') {
			const sellPrice = item.item?.sell_price || 0;
			return { 
				lateDays: 0, 
				penalty: sellPrice, 
				desc: `Barang Hilang (Ganti Harga Beli: ${formatCurrency(sellPrice)})`
			};
		}

		// 2. Denda Telat (Rp 10.000 / hari)
		const lateDays = calculateLateDays(item.rental_end_date, rData.actualReturnDate);
		if (lateDays > 0) {
			const latePenalty = lateDays * 10000;
			penalty += latePenalty;
			desc.push(`Telat ${lateDays} hari (${formatCurrency(latePenalty)})`);
		}

		return { lateDays, penalty, desc: desc.join(' + ') };
	}

	let totalPenalty = $derived(() => {
		if (!selectedTrx) return 0;
		return selectedTrx.items.reduce((acc, item) => acc + calculatePenalty(item).penalty, 0);
	});

	let payloadStr = $derived(() => {
		if (!selectedTrx) return '';
		const payload = selectedTrx.items.map(item => {
			const calc = calculatePenalty(item);
			return {
				id: item.id,
				asset_id: item.rental_asset_id,
				condition: returnData[item.id].condition,
				actual_return_date: returnData[item.id].actualReturnDate,
				late_days: calc.lateDays,
				penalty_amount: calc.penalty
			};
		});
		return JSON.stringify(payload);
	});

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
	}
	
	function formatDate(dateStr) {
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(dateStr));
	}
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-12">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)] flex items-center gap-2">
			<ArrowDownToLine size={28} /> Pengembalian Barang
		</h1>
		<p class="text-[var(--color-stone)] mt-1">Terima pengembalian alat, cek kondisi, dan hitung denda otomatis.</p>
	</div>

	{#if form?.success}
		<div class="bg-[var(--color-success)]/10 text-[var(--color-success)] p-4 rounded-xl border border-[var(--color-success)]/20 font-medium flex items-center gap-2">
			<CheckCircle size={20} /> 
			Berhasil memproses pengembalian! Total denda yang harus ditagih: {formatCurrency(form.totalPenalty)}.
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		<!-- Daftar Transaksi Aktif -->
		<div class="lg:col-span-1 space-y-4">
			<Card padding="md">
				<div class="relative mb-4">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
						<Search size={18} />
					</div>
					<input 
						type="text" 
						bind:value={searchQuery} 
						placeholder="Cari transaksi..." 
						class="w-full pl-10 pr-4 py-2 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] transition-all"
					>
				</div>

				<div class="space-y-2 max-h-[600px] overflow-y-auto pr-2">
					{#if filteredTransactions.length === 0}
						<div class="text-center p-6 text-[var(--color-stone)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
							Tidak ada barang yang sedang disewa.
						</div>
					{:else}
						{#each filteredTransactions as trx (trx.transaction_id)}
							<button 
								class="w-full text-left p-4 rounded-xl border transition-all {selectedTrx?.transaction_id === trx.transaction_id ? 'border-[var(--color-forest)] bg-[var(--color-sand-light)] shadow-sm' : 'border-[var(--color-border)] bg-white hover:border-[var(--color-forest)]/50'}"
								onclick={() => selectTransaction(trx)}
							>
								<div class="font-mono font-bold text-[var(--color-earth)] text-sm mb-1">{trx.transaction_code}</div>
								<div class="flex items-center gap-1.5 text-sm text-[var(--color-stone)] mb-1">
									<User size={14} /> <span class="truncate">{trx.customer_name}</span>
								</div>
								<Badge variant="info" class="mt-2 text-[10px]">{trx.items.length} Barang</Badge>
							</button>
						{/each}
					{/if}
				</div>
			</Card>
		</div>

		<!-- Detail Pengembalian -->
		<div class="lg:col-span-2">
			{#if selectedTrx}
				<Card padding="md" class="border-2 border-[var(--color-forest)]/20 shadow-md">
					<div class="border-b border-[var(--color-border)] pb-4 mb-4">
						<h2 class="text-xl font-bold font-heading text-[var(--color-earth)]">Detail Pengembalian</h2>
						<p class="text-sm text-[var(--color-stone)]">Kode Transaksi: <span class="font-mono font-bold">{selectedTrx.transaction_code}</span></p>
					</div>

					<form 
						method="POST" 
						action="?/processReturn"
						use:enhance={() => {
							loading = true;
							return async ({ update, result }) => {
								await update();
								loading = false;
								if (result.type === 'success') {
									selectedTrx = null; // reset selection
								}
							};
						}}
					>
						<input type="hidden" name="payload" value={payloadStr()} />

						<div class="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
							{#each selectedTrx.items as item (item.id)}
								<div class="bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl p-4">
									<div class="flex justify-between items-start mb-3">
										<div>
											<h4 class="font-bold text-[var(--color-earth)]">{item.item_name}</h4>
											<div class="flex gap-4 mt-1 text-xs text-[var(--color-stone)]">
												<span class="flex items-center gap-1"><Calendar size={12}/> Ambil: {formatDate(item.rental_start_date)}</span>
												<span class="flex items-center gap-1"><Calendar size={12}/> Tenggat: {formatDate(item.rental_end_date)}</span>
											</div>
										</div>
									</div>

									<!-- Form Interaktif per Item -->
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-white rounded-lg border border-[var(--color-border-light)]">
										<div>
											<label class="block text-xs font-semibold text-[var(--color-earth)] mb-1">Tanggal Kembali Aktual</label>
											<input 
												type="date" 
												bind:value={returnData[item.id].actualReturnDate}
												class="w-full px-3 py-1.5 text-sm bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-forest)]"
											>
										</div>
										<div>
											<label class="block text-xs font-semibold text-[var(--color-earth)] mb-1">Kondisi Barang</label>
											<select 
												bind:value={returnData[item.id].condition}
												class="w-full px-3 py-1.5 text-sm bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-forest)]"
											>
												<option value="good">Baik / Layak Pakai</option>
												<option value="minor_damage">Rusak Ringan</option>
												<option value="major_damage">Rusak Berat</option>
												<option value="lost">Hilang</option>
											</select>
										</div>
									</div>

									<!-- Info Denda -->
									{@const penaltyInfo = calculatePenalty(item)}
									{#if penaltyInfo.penalty > 0}
										<div class="mt-3 flex items-start gap-2 p-2 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-lg text-sm border border-[var(--color-error)]/20">
											<AlertTriangle size={16} class="shrink-0 mt-0.5" />
											<div>
												<p class="font-bold">Denda: {formatCurrency(penaltyInfo.penalty)}</p>
												<p class="text-xs opacity-90">{penaltyInfo.desc}</p>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Footer Submit -->
						<div class="border-t border-[var(--color-border)] pt-4 flex items-center justify-between">
							<div>
								<p class="text-sm text-[var(--color-stone)]">Total Tagihan Denda</p>
								<p class="text-2xl font-bold font-heading text-[var(--color-error)]">{formatCurrency(totalPenalty())}</p>
							</div>
							<Button type="submit" disabled={loading} class="px-8 py-3">
								{loading ? 'Memproses...' : 'Proses Pengembalian'}
							</Button>
						</div>
					</form>

				</Card>
			{:else}
				<div class="h-[400px] flex flex-col items-center justify-center text-[var(--color-stone)] opacity-50 bg-[var(--color-sand-lightest)]/50 rounded-2xl border-2 border-dashed border-[var(--color-border)]">
					<ArrowDownToLine size={64} class="mb-4" />
					<p class="text-lg">Pilih transaksi di sebelah kiri untuk mulai.</p>
				</div>
			{/if}
		</div>

	</div>
</div>
