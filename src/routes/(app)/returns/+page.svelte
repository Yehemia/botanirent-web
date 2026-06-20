<script>
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		ArrowDownToLine,
		AlertTriangle,
		CheckCircle,
		Search,
		User,
		Calendar,
		QrCode
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

	// QRIS Modal States
	let showQrisModal = $state(false);
	let qrUrl = $state('');
	let qrisTxnId = $state('');
	let qrisTxnCode = $state('');
	let pollingInterval = $state(/** @type {any} */ (null));
	let timerInterval = $state(/** @type {any} */ (null));
	let timerMinutes = $state(5);
	let timerSeconds = $state(0);
	let paymentStatusMsg = $state('Menunggu pembayaran denda...');
	let paymentSuccess = $state(false);

	/**
	 * @param {string} orderId
	 */
	function startStatusPolling(orderId) {
		if (pollingInterval) clearInterval(pollingInterval);
		paymentStatusMsg = 'Menunggu pembayaran denda...';
		paymentSuccess = false;

		pollingInterval = setInterval(async () => {
			try {
				const response = await fetch(`/api/midtrans/status/${orderId}`);
				if (response.ok) {
					const data = await response.json();
					if (data.payment_status === 'paid') {
						clearInterval(pollingInterval);
						clearInterval(timerInterval);
						paymentStatusMsg = 'Pembayaran denda berhasil dikonfirmasi!';
						paymentSuccess = true;

						setTimeout(async () => {
							showQrisModal = false;
							await invalidateAll();
							selectedTrx = null; // reset selection
						}, 2000);
					} else if (data.payment_status === 'failed' || data.payment_status === 'expired') {
						clearInterval(pollingInterval);
						clearInterval(timerInterval);
						paymentStatusMsg = 'Pembayaran denda gagal atau kedaluwarsa.';
					}
				}
			} catch (e) {
				console.error('Gagal memeriksa status pembayaran denda:', e);
			}
		}, 3000);
	}

	function startTimer() {
		timerMinutes = 5;
		timerSeconds = 0;
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			if (timerSeconds === 0) {
				if (timerMinutes === 0) {
					clearInterval(timerInterval);
					clearInterval(pollingInterval);
					paymentStatusMsg = 'Waktu pembayaran habis (kedaluwarsa).';
					return;
				}
				timerMinutes -= 1;
				timerSeconds = 59;
			} else {
				timerSeconds -= 1;
			}
		}, 1000);
	}

	async function closeQrisModal() {
		if (pollingInterval) clearInterval(pollingInterval);
		if (timerInterval) clearInterval(timerInterval);
		showQrisModal = false;
		await invalidateAll();
		if (paymentSuccess) {
			selectedTrx = null;
		}
	}

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
		if (timerInterval) clearInterval(timerInterval);
	});

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
							console.log('[use:enhance] Processing return...');
							return async ({ update, result }) => {
								loading = false;
								console.log('[use:enhance] Result received:', result);
								if (
									result.type === 'success' &&
									result.data?.payment_method === 'qris' &&
									result.data?.qr_url
								) {
									const resData = /** @type {any} */ (result.data);
									qrUrl = resData.qr_url;
									qrisTxnId = resData.order_id;
									qrisTxnCode = resData.order_id;
									showQrisModal = true;
									startStatusPolling(resData.order_id);
									startTimer();
								} else {
									if (result.type === 'failure' || result.type === 'error') {
										console.error('[use:enhance] Error detail:', result);
										alert('Gagal memproses pengembalian: ' + (result.data?.error || result.error?.message || 'Error tidak diketahui'));
									}
									await update();
									if (result.type === 'success') {
										selectedTrx = null; // reset selection
									}
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

<!-- MODAL QRIS INTERAKTIF -->
{#if showQrisModal}
	<div class="qris-overlay" role="dialog" aria-modal="true">
		<div class="qris-modal">
			<div class="qris-modal-header">
				<div class="qris-modal-icon-bg">
					<QrCode size={20} class="text-purple-600" />
				</div>
				<div>
					<h3 class="qris-modal-title">Pembayaran Denda QRIS</h3>
					<p class="qris-modal-subtitle">Scan kode QR menggunakan e-wallet atau mobile banking</p>
				</div>
			</div>

			<div class="qris-modal-content">
				<div class="qris-qr-wrapper">
					{#if qrUrl}
						<img src={qrUrl} alt="QRIS Code" class="qris-qr-image" />
					{:else}
						<div class="qris-qr-placeholder">
							<div class="checkout-spinner border-t-purple-600"></div>
							<p class="mt-2 text-xs text-[var(--color-stone)]">Membangkitkan QRIS...</p>
						</div>
					{/if}
				</div>

				<div class="qris-details">
					<div class="qris-detail-row">
						<span>Total Denda:</span>
						<span class="qris-amount">{formatCurrency(totalPenalty())}</span>
					</div>
					<div class="qris-detail-row">
						<span>Order ID:</span>
						<span class="font-mono font-bold text-[var(--color-earth)]">{qrisTxnCode}</span>
					</div>
				</div>

				<div class="qris-status-box" class:success-bg={paymentSuccess}>
					<div class="flex items-center gap-3">
						{#if paymentSuccess}
							<div class="qris-success-icon-wrapper text-emerald-600">
								<CheckCircle size={18} />
							</div>
						{:else}
							<div class="checkout-spinner border-t-[var(--color-forest)]"></div>
						{/if}
						<span class="qris-status-text" class:success-text={paymentSuccess}>
							{paymentStatusMsg}
						</span>
					</div>
				</div>

				{#if !paymentSuccess}
					<div class="qris-timer">
						<span>Batas Waktu Pembayaran:</span>
						<span class="qris-timer-countdown">
							{String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
						</span>
					</div>
				{/if}
			</div>

			<div class="qris-modal-footer">
				<button type="button" class="qris-close-btn" onclick={closeQrisModal}>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ─── QRIS Dynamic Modal Styles ─── */
	.qris-overlay {
		position: fixed;
		inset: 0;
		z-index: 150;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(26, 26, 26, 0.55);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.qris-modal {
		background: white;
		border-radius: 24px;
		width: 100%;
		max-width: 440px;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 1px solid var(--color-border-light);
		overflow: hidden;
		animation: modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes modalFadeIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.qris-modal-header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 24px;
		border-bottom: 1px solid var(--color-border-light);
		background: linear-gradient(180deg, var(--color-sand) 0%, transparent 100%);
	}

	.qris-modal-icon-bg {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(124, 58, 237, 0.1);
	}

	.qris-modal-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-earth);
		font-family: var(--font-heading);
	}

	.qris-modal-subtitle {
		font-size: 12px;
		color: var(--color-stone);
		margin-top: 2px;
	}

	.qris-modal-content {
		padding: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.qris-qr-wrapper {
		width: 200px;
		height: 200px;
		border-radius: 16px;
		border: 2px dashed var(--color-border);
		padding: 10px;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
	}

	.qris-qr-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.qris-qr-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.qris-details {
		width: 100%;
		background: var(--color-sand);
		border-radius: 16px;
		padding: 14px 16px;
		border: 1px solid var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.qris-detail-row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: var(--color-stone);
	}

	.qris-amount {
		font-size: 15px;
		font-weight: 800;
		color: var(--color-forest);
	}

	.qris-status-box {
		width: 100%;
		padding: 12px;
		border-radius: 14px;
		background: rgba(44, 110, 73, 0.05);
		border: 1.5px solid rgba(44, 110, 73, 0.15);
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.qris-status-box.success-bg {
		background: var(--color-success-bg);
		border-color: rgba(16, 185, 129, 0.2);
	}

	.qris-status-text {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-forest);
	}

	.qris-status-text.success-text {
		color: var(--color-success);
	}

	.qris-success-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qris-timer {
		font-size: 12px;
		color: var(--color-stone);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.qris-timer-countdown {
		font-weight: 700;
		color: var(--color-error);
		font-family: var(--font-mono);
	}

	.qris-modal-footer {
		padding: 16px 24px;
		background: var(--color-sand);
		border-top: 1px solid var(--color-border-light);
		display: flex;
		justify-content: center;
		width: 100%;
		box-sizing: border-box;
	}

	.qris-close-btn {
		width: 100%;
		padding: 12px;
		border-radius: 12px;
		border: 1.5px solid var(--color-border);
		background: white;
		color: var(--color-earth);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.qris-close-btn:hover {
		background: var(--color-sand-light);
		color: var(--color-earth);
		border-color: var(--color-stone);
	}

	.checkout-spinner {
		width: 18px;
		height: 18px;
		border: 2.5px solid rgba(0, 0, 0, 0.1);
		border-top-color: inherit;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
