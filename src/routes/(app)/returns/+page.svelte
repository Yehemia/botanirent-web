<script>
	import { enhance } from '$app/forms';
	import {
		ArrowDownToLine,
		AlertTriangle,
		CheckCircle,
		Search,
		User,
		Calendar
	} from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';

	let { data, form } = $props();
	let transactions = $derived(data.transactions);
	let penaltyRules = $derived(data.penaltyRules);
	let rentalSettings = $derived(data.rentalSettings);

	let searchQuery = $state('');
	/** @type {any} */
	let selectedTrx = $state(null);

	// Form state per item inside selectedTrx
	/** @type {Record<string, any>} */
	let returnData = $state({});
	// { itemId: { condition: 'good', actualReturnDate: 'YYYY-MM-DD', damagePenaltyOverride: null, notes: '' } }

	let loading = $state(false);

	// Global penalty state
	/** @type {number | null} */
	let latePenaltyOverride = $state(null);
	let paymentStatus = $state('paid');
	let paymentMethod = $state('Tunai');
	let globalNotes = $state('');

	let filteredTransactions = $derived(
		transactions.filter(
			(/** @type {any} */ t) =>
				t.transaction_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	/** @param {any} trx */
	function selectTransaction(trx) {
		selectedTrx = trx;
		const today = new Date().toISOString().split('T')[0];

		// Initialize form data
		/** @type {Record<string, any>} */
		let initData = {};
		trx.items.forEach((/** @type {any} */ item) => {
			initData[item.id] = {
				condition: 'good',
				actualReturnDate: today,
				damagePenaltyOverride: null,
				notes: ''
			};
		});
		returnData = initData;

		// Reset global overrides
		latePenaltyOverride = null;
		paymentStatus = 'paid';
		paymentMethod = 'Tunai';
		globalNotes = '';
	}

	/**
	 * @param {string} expectedEndStr
	 * @param {string} actualReturnStr
	 */
	function calculateLateDays(expectedEndStr, actualReturnStr) {
		const expected = new Date(expectedEndStr);
		const actual = new Date(actualReturnStr);

		// Reset jam untuk perbandingan hari yang adil
		expected.setHours(0, 0, 0, 0);
		actual.setHours(0, 0, 0, 0);

		const diffTime = actual.getTime() - expected.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return diffDays > 0 ? diffDays : 0;
	}

	/** @param {any} item */
	function getCalculatedDamagePenalty(item) {
		const rData = returnData[item.id];
		if (!rData || rData.condition === 'good') return 0;

		const conditionRule = penaltyRules?.find((/** @type {any} */ r) => r.type === rData.condition);
		if (!conditionRule) return 0;

		const sellPrice = item.item?.sell_price || 0;
		const rate = parseFloat(conditionRule.amount);
		if (conditionRule.calculation_method === 'flat') {
			return rate;
		} else if (conditionRule.calculation_method === 'percentage') {
			return (rate / 100) * sellPrice;
		}
		return 0;
	}

	/** @param {any} item */
	function getItemDamagePenalty(item) {
		const rData = returnData[item.id];
		if (!rData) return 0;
		return rData.damagePenaltyOverride !== null
			? rData.damagePenaltyOverride
			: getCalculatedDamagePenalty(item);
	}

	// Hitung hari keterlambatan terlama untuk seluruh transaksi
	let calculatedLateDays = $derived(() => {
		if (!selectedTrx) return 0;
		let maxDays = 0;
		selectedTrx.items.forEach((/** @type {any} */ item) => {
			const rData = returnData[item.id];
			if (rData && rData.condition !== 'lost') {
				const days = calculateLateDays(item.rental_end_date, rData.actualReturnDate);
				if (days > maxDays) maxDays = days;
			}
		});
		return maxDays;
	});

	// Denda keterlambatan per transaksi flat (default)
	let calculatedLatePenalty = $derived(() => {
		const rate = rentalSettings?.late_fee_per_day_per_transaction || 10000;
		return calculatedLateDays() * rate;
	});

	// Denda keterlambatan terhitung (setelah override)
	let currentLatePenalty = $derived(
		latePenaltyOverride !== null ? latePenaltyOverride : calculatedLatePenalty()
	);

	let totalPenalty = $derived(() => {
		if (!selectedTrx) return 0;
		const damageTotal = selectedTrx.items.reduce(
			(/** @type {number} */ acc, /** @type {any} */ item) => acc + getItemDamagePenalty(item),
			0
		);
		return damageTotal + currentLatePenalty;
	});

	let payloadStr = $derived(() => {
		if (!selectedTrx) return '';

		const lateDaysVal = calculatedLateDays();
		const latePenaltyVal = currentLatePenalty;
		let latePenaltyApplied = false;

		const payloadItems = selectedTrx.items.map((/** @type {any} */ item) => {
			const cond = returnData[item.id]?.condition || 'good';
			const actReturnDate =
				returnData[item.id]?.actualReturnDate || new Date().toISOString().split('T')[0];
			const damagePenalty = getItemDamagePenalty(item);
			const itemNotes = returnData[item.id]?.notes || '';

			let itemLateDays = 0;
			let itemLatePenalty = 0;

			// Konsolidasikan denda keterlambatan transaksi ke item pertama yang bukan lost
			if (cond !== 'lost' && !latePenaltyApplied && lateDaysVal > 0) {
				itemLateDays = lateDaysVal;
				itemLatePenalty = latePenaltyVal;
				latePenaltyApplied = true;
			}

			return {
				id: item.id,
				asset_id: item.rental_asset_id,
				condition: cond,
				actual_return_date: actReturnDate,
				late_days: itemLateDays,
				damage_penalty_amount: damagePenalty,
				notes: itemNotes
			};
		});

		return JSON.stringify({
			items: payloadItems,
			payment_status: paymentStatus,
			payment_method: paymentMethod,
			global_notes: globalNotes,
			total_late_penalty: latePenaltyVal
		});
	});
</script>

<div class="mx-auto max-w-7xl space-y-6 pb-12">
	<!-- Header -->
	<div>
		<h1 class="flex items-center gap-2 font-heading text-3xl font-bold text-[var(--color-earth)]">
			<ArrowDownToLine size={28} /> Pengembalian Barang
		</h1>
		<p class="mt-1 text-[var(--color-stone)]">
			Terima pengembalian alat, cek kondisi, dan hitung denda otomatis.
		</p>
	</div>

	{#if form?.success}
		<div
			class="flex items-center gap-2 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 p-4 font-medium text-[var(--color-success)]"
		>
			<CheckCircle size={20} />
			Berhasil memproses pengembalian! Total denda yang harus ditagih: {formatCurrency(
				form.totalPenalty
			)}.
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Daftar Transaksi Aktif -->
		<div class="space-y-4 lg:col-span-1">
			<Card padding="md">
				<Input bind:value={searchQuery} placeholder="Cari transaksi..." class="mb-4">
					{#snippet iconLeft()}
						<Search size={18} />
					{/snippet}
				</Input>

				<div class="max-h-[600px] space-y-2 overflow-y-auto pr-2">
					{#if filteredTransactions.length === 0}
						<div
							class="rounded-xl border-2 border-dashed border-[var(--color-border)] p-6 text-center text-[var(--color-stone)]"
						>
							Tidak ada barang yang sedang disewa.
						</div>
					{:else}
						{#each filteredTransactions as trx (trx.transaction_id)}
							<button
								class="w-full rounded-xl border p-4 text-left transition-all {selectedTrx?.transaction_id ===
								trx.transaction_id
									? 'border-[var(--color-forest)] bg-[var(--color-sand-light)] shadow-sm'
									: 'border-[var(--color-border)] bg-white hover:border-[var(--color-forest)]/50'}"
								onclick={() => selectTransaction(trx)}
							>
								<div class="mb-1 font-mono text-sm font-bold text-[var(--color-earth)]">
									{trx.transaction_code}
								</div>
								<div class="mb-1 flex items-center gap-1.5 text-sm text-[var(--color-stone)]">
									<User size={14} /> <span class="truncate">{trx.customer_name}</span>
								</div>
								<div class="mt-2 flex items-center gap-1.5">
									<Badge variant="info" class="text-[10px]">{trx.items.length} Barang Sewa</Badge>
									{#if trx.transaction_type === 'hybrid'}
										<Badge
											variant="neutral"
											class="bg-[var(--color-sand)] text-[10px] text-[var(--color-earth)]"
											>Hybrid</Badge
										>
									{/if}
								</div>
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
					<div class="mb-4 border-b border-[var(--color-border)] pb-4">
						<h2 class="font-heading text-xl font-bold text-[var(--color-earth)]">
							Detail Pengembalian
						</h2>
						<p class="text-sm text-[var(--color-stone)]">
							Kode Transaksi: <span class="font-mono font-bold">{selectedTrx.transaction_code}</span
							>
							{#if selectedTrx.transaction_type === 'hybrid'}
								<span class="ml-2"
									><Badge variant="neutral" class="bg-[var(--color-sand)] text-[var(--color-earth)]"
										>Sewa + Retail (Hybrid)</Badge
									></span
								>
							{/if}
						</p>
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

						<div class="mb-6 max-h-[500px] space-y-4 overflow-y-auto pr-2">
							{#each selectedTrx.items as item (item.id)}
								{@const calculatedDamagePenalty = getCalculatedDamagePenalty(item)}
								{@const currentDamagePenalty = getItemDamagePenalty(item)}
								<div
									class="rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4"
								>
									<div class="mb-3 flex items-start justify-between">
										<div>
											<h4 class="font-bold text-[var(--color-earth)]">{item.item_name}</h4>
											<div class="mt-1 flex gap-4 text-xs text-[var(--color-stone)]">
												<span class="flex items-center gap-1"
													><Calendar size={12} /> Ambil: {formatDate(item.rental_start_date, {
														day: '2-digit',
														month: 'short',
														year: 'numeric'
													})}</span
												>
												<span class="flex items-center gap-1"
													><Calendar size={12} /> Tenggat: {formatDate(item.rental_end_date, {
														day: '2-digit',
														month: 'short',
														year: 'numeric'
													})}</span
												>
											</div>
										</div>
									</div>

									<!-- Form Interaktif per Item -->
									<div
										class="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-[var(--color-border-light)] bg-white p-3 md:grid-cols-2"
									>
										<Input
											type="date"
											label="Tanggal Kembali Aktual"
											bind:value={returnData[item.id].actualReturnDate}
											size="md"
										/>
										<Select label="Kondisi Barang" bind:value={returnData[item.id].condition}>
											<option value="good">Baik / Layak Pakai</option>
											<option value="minor_damage">Rusak Ringan</option>
											<option value="major_damage">Rusak Berat</option>
											<option value="lost">Hilang</option>
										</Select>
									</div>

									<!-- Input Manual Denda & Catatan Kerusakan jika tidak Baik -->
									{#if returnData[item.id].condition !== 'good'}
										<div
											class="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-[var(--color-error)]/10 bg-[var(--color-error)]/5 p-3 md:grid-cols-2"
										>
											<div>
												<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
													Denda Kerusakan (Rp)
													<input
														type="number"
														class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
														value={currentDamagePenalty}
														oninput={(e) => {
															const val = e.currentTarget.value;
															returnData[item.id].damagePenaltyOverride =
																val === '' ? null : parseFloat(val);
														}}
														placeholder="Masukkan nominal denda"
													/>
												</label>
												<span class="mt-0.5 block text-[10px] text-[var(--color-stone)]">
													Default aturan: {formatCurrency(calculatedDamagePenalty)}
													{#if returnData[item.id].damagePenaltyOverride !== null}
														<button
															type="button"
															class="ml-1 font-semibold text-[var(--color-forest)] hover:underline"
															onclick={() => (returnData[item.id].damagePenaltyOverride = null)}
														>
															(Reset)
														</button>
													{/if}
												</span>
											</div>
											<div>
												<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
													Catatan Kerusakan
													<input
														type="text"
														class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
														bind:value={returnData[item.id].notes}
														placeholder="Misal: frame patah 1 ruas, kain robek"
													/>
												</label>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Info & Kustomisasi Denda Keterlambatan Transaksi -->
						{#if calculatedLatePenalty() > 0 || latePenaltyOverride !== null}
							<div
								class="mb-6 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-error)]/5 p-4 text-[var(--color-earth)]"
							>
								<div class="flex items-start gap-2.5">
									<AlertTriangle size={20} class="mt-0.5 shrink-0 text-[var(--color-error)]" />
									<div class="flex-1">
										<p class="text-base font-bold text-[var(--color-error)]">
											Denda Keterlambatan Transaksi
										</p>
										<p class="mt-0.5 text-xs text-[var(--color-stone)]">
											Terlambat {calculatedLateDays()} hari x {formatCurrency(
												rentalSettings?.late_fee_per_day_per_transaction || 10000
											)}/hari (Dihitung sekali per penyewaan).
										</p>

										<div class="mt-3 grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
													Nominal Denda Keterlambatan (Rp)
													<input
														type="number"
														class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
														value={currentLatePenalty}
														oninput={(e) => {
															const val = e.currentTarget.value;
															latePenaltyOverride = val === '' ? null : parseFloat(val);
														}}
														placeholder="Nominal denda keterlambatan"
													/>
												</label>
												<span class="mt-0.5 block text-[10px] text-[var(--color-stone)]">
													Default aturan: {formatCurrency(calculatedLatePenalty())}
													{#if latePenaltyOverride !== null}
														<button
															type="button"
															class="ml-1 font-semibold text-[var(--color-forest)] hover:underline"
															onclick={() => (latePenaltyOverride = null)}
														>
															(Reset)
														</button>
													{/if}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}

						<!-- Seksi Pembayaran Denda (Jika ada denda) -->
						{#if totalPenalty() > 0}
							<div
								class="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-light)] p-4"
							>
								<h3
									class="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--color-earth)]"
								>
									💳 Pembayaran Denda
								</h3>
								<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div>
										<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
											Status Pembayaran Denda
											<select
												class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
												bind:value={paymentStatus}
											>
												<option value="paid">Lunas (Bayar Sekarang)</option>
												<option value="unpaid">Belum Lunas (Bayar Nanti)</option>
											</select>
										</label>
									</div>

									{#if paymentStatus === 'paid'}
										<div>
											<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
												Metode Pembayaran
												<select
													class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
													bind:value={paymentMethod}
												>
													<option value="Tunai">Tunai / Cash</option>
													<option value="QRIS">QRIS</option>
													<option value="Transfer">Transfer Bank</option>
												</select>
											</label>
										</div>
									{/if}

									<div class={paymentStatus === 'paid' ? 'col-span-1' : 'col-span-2'}>
										<label class="mb-1 block text-xs font-bold text-[var(--color-earth)]">
											Catatan Tambahan
											<input
												type="text"
												class="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-normal focus:border-[var(--color-forest)] focus:outline-none"
												bind:value={globalNotes}
												placeholder="Misal: Diberi keringanan denda..."
											/>
										</label>
									</div>
								</div>
							</div>
						{/if}

						<!-- Footer Submit -->
						<div
							class="flex items-center justify-between border-t border-[var(--color-border)] pt-4"
						>
							<div>
								<p class="text-sm text-[var(--color-stone)]">Total Tagihan Denda</p>
								<p class="font-heading text-2xl font-bold text-[var(--color-error)]">
									{formatCurrency(totalPenalty())}
								</p>
							</div>
							<Button type="submit" disabled={loading} class="px-8 py-3">
								{loading ? 'Memproses...' : 'Proses Pengembalian'}
							</Button>
						</div>
					</form>
				</Card>
			{:else}
				<div
					class="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-sand-lightest)]/50 text-[var(--color-stone)] opacity-50"
				>
					<ArrowDownToLine size={64} class="mb-4" />
					<p class="text-lg">Pilih transaksi di sebelah kiri untuk mulai.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
