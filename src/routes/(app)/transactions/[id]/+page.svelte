<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Printer, CheckCircle, Leaf, QrCode } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { isMobileApp, printReceiptFromMobile } from '$lib/utils/mobileBridge';

	let { data } = $props();
	let transaction = $derived(data.transaction);
	let branch = $derived(data.branch);
	let isSuccess = $derived(data.isSuccess);

	let showModal = $state(false);
	let pollingInterval = /** @type {any} */ (null);

	let qrData = $derived(() => {
		if (!transaction || !transaction.midtrans_snap_token) return null;
		try {
			return JSON.parse(transaction.midtrans_snap_token);
		} catch (e) {
			return null;
		}
	});

	onMount(() => {
		if (isSuccess) {
			// Slight delay for smooth modal animation
			setTimeout(() => {
				showModal = true;
			}, 100);
		}

		// Polling status jika transaksi masih pending dan metodenya QRIS
		if (
			transaction &&
			transaction.payment_status === 'pending' &&
			transaction.payment_method === 'qris'
		) {
			pollingInterval = setInterval(async () => {
				try {
					const res = await fetch(`/api/midtrans/status/${transaction.id}`);
					if (res.ok) {
						const statusData = await res.json();
						if (statusData.payment_status === 'paid') {
							clearInterval(pollingInterval);
							window.location.reload();
						}
					}
				} catch (e) {
					console.error('Gagal memeriksa status pembayaran:', e);
				}
			}, 4000);
		}
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});

	async function handlePrint() {
		if (isMobileApp()) {
			const receiptPayload = {
				branch_name: branch?.name || 'BotaniRent',
				branch_address: branch?.address || '',
				branch_phone: branch?.phone || '',
				transaction_code: transaction.transaction_code,
				created_at: transaction.created_at,
				cashier_name: transaction.cashier?.full_name || '-',
				transaction_type: transaction.type,
				customer_name: transaction.customer?.full_name || null,
				subtotal: transaction.subtotal,
				discount_amount: transaction.discount_amount || 0,
				total_amount: transaction.total_amount,
				paid_amount: transaction.paid_amount,
				change_amount: transaction.change_amount,
				payment_method: transaction.payment_method,
				items: transaction.items.map((/** @type {any} */ item) => ({
					item_name: item.item_name,
					quantity: item.quantity,
					unit_price: item.unit_price,
					subtotal: item.subtotal,
					rental_days: item.rental_days,
					rental_start_date: item.rental_start_date,
					rental_end_date: item.rental_end_date,
					type: item.type
				}))
			};
			await printReceiptFromMobile(receiptPayload);
		} else {
			window.print();
		}
	}

	function closeModal() {
		showModal = false;
		// Update URL tanpa reload
		const url = new URL(window.location.href);
		url.searchParams.delete('success');
		history.replaceState({}, '', url.toString());
	}

	/**
	 * Format tanggal pendek untuk struk (DD/MM/YYYY HH:mm)
	 * @param {string | Date} dateStr
	 */
	function formatReceiptDate(dateStr) {
		if (!dateStr) return '-';
		const d = new Date(dateStr);
		const dd = String(d.getDate()).padStart(2, '0');
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const yyyy = d.getFullYear();
		const hh = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
	}

	/**
	 * Format tanggal sewa singkat (DD Mon)
	 * @param {string | Date} dateStr
	 */
	function formatShortDate(dateStr) {
		if (!dateStr) return '-';
		return formatDate(dateStr, { day: '2-digit', month: 'short' });
	}

	/** Payment method label */
	function paymentLabel(/** @type {string} */ method) {
		const labels = /** @type {Record<string, string>} */ ({
			cash: 'Tunai',
			transfer: 'Transfer',
			qris: 'QRIS'
		});
		return labels[method] || method;
	}

	/** Transaction type label */
	function typeLabel(/** @type {string} */ type) {
		const labels = /** @type {Record<string, string>} */ ({
			rental: 'Sewa Alat',
			retail: 'Penjualan',
			hybrid: 'Sewa + Jual'
		});
		return labels[type] || type;
	}

	const DASHES = '- - - - - - - - - - - - - - - - - - - -';
</script>

<!-- ============================================================
     SUCCESS MODAL OVERLAY (Muncul saat redirect dari checkout)
     ============================================================ -->
{#if showModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="receipt-overlay"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
	>
		<div class="receipt-modal-container animate-modal-in">
			{@render receiptPaper()}

			<!-- Modal Actions -->
			<div class="receipt-modal-actions">
				<button class="receipt-btn receipt-btn-secondary" onclick={closeModal}> Tutup </button>
				<button class="receipt-btn receipt-btn-primary" onclick={handlePrint}>
					<Printer size={18} />
					Cetak Struk
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ============================================================
     HALAMAN DETAIL TRANSAKSI (Default view)
     ============================================================ -->
<div class="mx-auto max-w-5xl px-4 pb-12">
	<!-- Action Bar (Hidden on Print) -->
	<div
		class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center print:hidden"
	>
		<!-- eslint-disable-next-line -->
		<a
			href="/transactions"
			class="inline-flex items-center gap-2 font-medium text-[var(--color-stone)] transition-colors hover:text-[var(--color-earth)]"
		>
			<ArrowLeft size={18} /> Kembali ke Riwayat
		</a>
		<div class="flex items-center gap-3">
			{#if transaction.payment_status === 'paid'}
				<span class="receipt-status-badge receipt-status-paid">
					<CheckCircle size={14} /> LUNAS
				</span>
			{:else}
				<span class="receipt-status-badge receipt-status-pending text-xs">
					{transaction.payment_status?.toUpperCase()}
				</span>
			{/if}
			<Button
				onclick={handlePrint}
				variant="secondary"
				class="border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-forest)]/10"
			>
				<Printer size={18} class="mr-2" /> Cetak Struk
			</Button>
		</div>
	</div>

	<!-- Layout Grid -->
	<div
		class="grid grid-cols-1 {transaction.payment_status === 'pending' &&
		transaction.payment_method === 'qris' &&
		qrData()
			? 'lg:grid-cols-12'
			: ''} items-start gap-8"
	>
		<!-- Struk -->
		<div
			class={transaction.payment_status === 'pending' &&
			transaction.payment_method === 'qris' &&
			qrData()
				? 'lg:col-span-7'
				: 'mx-auto w-full max-w-md'}
		>
			<!-- Receipt Paper (Page view & Print view) -->
			<div class="receipt-page-wrapper print:border-none print:p-0 print:shadow-none">
				{@render receiptPaper()}
			</div>
		</div>

		<!-- QRIS Code Sidebar (Hanya untuk QRIS Pending & Desktop/Web View) -->
		{#if transaction.payment_status === 'pending' && transaction.payment_method === 'qris' && qrData()}
			<div
				class="flex flex-col items-center gap-5 rounded-2xl border border-[var(--color-border-light)] bg-white p-6 shadow-sm lg:col-span-5 print:hidden"
			>
				<div class="flex w-full items-center gap-3 border-b border-gray-100 pb-4">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
					>
						<QrCode size={20} />
					</div>
					<div>
						<h3 class="font-heading font-bold text-[var(--color-earth)]">Menunggu Pembayaran</h3>
						<p class="mt-0.5 text-xs text-[var(--color-stone)]">
							Scan QRIS di bawah untuk membayar
						</p>
					</div>
				</div>

				<div
					class="flex h-52 w-52 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-2"
				>
					<img src={qrData().qr_url} alt="QRIS Code" class="h-full w-full object-contain" />
				</div>

				<div
					class="w-full space-y-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-sand)] p-4"
				>
					<div class="flex justify-between text-sm">
						<span class="text-[var(--color-stone)]">Total Tagihan:</span>
						<span class="font-bold text-[var(--color-forest)]"
							>{formatCurrency(transaction.total_amount)}</span
						>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-[var(--color-stone)]">Metode:</span>
						<span class="font-semibold text-[var(--color-earth)]">QRIS Dinamis</span>
					</div>
				</div>

				<div
					class="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"
				>
					<div class="checkout-spinner h-4 w-4 border-t-amber-800"></div>
					<span>Menunggu notifikasi pembayaran otomatis...</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ============================================================
     RECEIPT PAPER SNIPPET (dipakai di modal & halaman)
     ============================================================ -->
{#snippet receiptPaper()}
	<div class="receipt-paper">
		<!-- ===== Header ===== -->
		<div class="receipt-header">
			<div class="receipt-logo">
				<Leaf size={24} strokeWidth={2.5} />
				<span class="receipt-brand">BOTANIRENT</span>
			</div>
			<p class="receipt-branch-name">{branch.name || 'BotaniRent'}</p>
			{#if branch.address}
				<p class="receipt-branch-info">{branch.address}</p>
			{/if}
			{#if branch.phone}
				<p class="receipt-branch-info">Telp: {branch.phone}</p>
			{/if}
		</div>

		<div class="receipt-dashes">{DASHES}</div>

		<!-- ===== Transaction Info ===== -->
		<div class="receipt-info-block">
			<div class="receipt-info-row">
				<span>No:</span>
				<span class="font-mono font-semibold">{transaction.transaction_code}</span>
			</div>
			<div class="receipt-info-row">
				<span>Tanggal:</span>
				<span>{formatReceiptDate(transaction.created_at)}</span>
			</div>
			<div class="receipt-info-row">
				<span>Kasir:</span>
				<span>{transaction.cashier?.full_name || '-'}</span>
			</div>
			<div class="receipt-info-row">
				<span>Tipe:</span>
				<span>{typeLabel(transaction.type)}</span>
			</div>
			{#if transaction.customer}
				<div class="receipt-info-row">
					<span>Pelanggan:</span>
					<span>{transaction.customer.full_name}</span>
				</div>
			{/if}
		</div>

		<div class="receipt-dashes">{DASHES}</div>

		<!-- ===== Item List ===== -->
		<div class="receipt-items">
			{#each transaction.items as item}
				<div class="receipt-item">
					<div class="receipt-item-row">
						<span class="receipt-item-name">{item.item_name}</span>
						<span class="receipt-item-subtotal"
							>{item.subtotal > 0 ? formatCurrency(item.subtotal) : '-'}</span
						>
					</div>
					{#if item.quantity > 1 && item.unit_price > 0}
						<span class="receipt-item-detail">
							{item.quantity}x {formatCurrency(item.unit_price)}
							{#if item.rental_days && item.rental_days > 0}
								x {item.rental_days} hari
							{/if}
						</span>
					{:else if item.rental_days && item.rental_days > 0 && item.unit_price > 0}
						<span class="receipt-item-detail">
							{formatCurrency(item.unit_price)} x {item.rental_days} hari
						</span>
					{/if}
					{#if (item.type === 'rental' || item.type === 'package') && item.rental_start_date}
						<span class="receipt-item-rental">
							{formatShortDate(item.rental_start_date)} - {formatShortDate(item.rental_end_date)}
							{#if item.rental_days}({item.rental_days} hari){/if}
						</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- ===== Denda Section (jika ada) ===== -->
		{@const penalties = transaction.items.flatMap(item => (item.penalties || []).map(p => ({ ...p, item_name: item.item_name })))}
		{#if penalties.length > 0}
			<div class="receipt-dashes">{DASHES}</div>
			<div class="receipt-info-block" style="gap: 6px;">
				<div class="font-bold text-[10px] tracking-wider uppercase text-[var(--color-stone)]">Denda / Biaya Tambahan:</div>
				{#each penalties as penalty}
					<div class="receipt-item">
						<div class="receipt-item-row" style="font-size: 12px;">
							<span class="receipt-item-name font-medium">
								Denda {penalty.type === 'late' ? 'Keterlambatan' : penalty.type === 'minor_damage' ? 'Rusak Ringan' : penalty.type === 'major_damage' ? 'Rusak Berat' : 'Kehilangan'}
								<span class="text-[10px] text-[var(--color-stone)]">({penalty.item_name})</span>
							</span>
							<span class="receipt-item-subtotal font-mono font-semibold">{formatCurrency(penalty.calculated_amount)}</span>
						</div>
						<div class="flex justify-between text-[10px] text-[var(--color-stone)] italic" style="padding-left: 0.5rem; margin-top: 1px;">
							<span>Status: {penalty.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}</span>
							{#if penalty.notes}
								<span class="truncate max-w-[200px]" title={penalty.notes}>{penalty.notes}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="receipt-dashes">{DASHES}</div>

		<!-- ===== Totals ===== -->
		<div class="receipt-totals">
			<div class="receipt-total-row">
				<span>Subtotal</span>
				<span>{formatCurrency(transaction.subtotal)}</span>
			</div>
			{#if transaction.discount_amount > 0}
				<div class="receipt-total-row receipt-discount">
					<span>Diskon</span>
					<span>-{formatCurrency(transaction.discount_amount)}</span>
				</div>
			{/if}
			<div class="receipt-total-row receipt-grand-total">
				<span>TOTAL</span>
				<span>{formatCurrency(transaction.total_amount)}</span>
			</div>
		</div>

		<!-- ===== Payment Info ===== -->
		<div class="receipt-payment">
			<div class="receipt-total-row">
				<span>Bayar: {paymentLabel(transaction.payment_method)}</span>
				<span>{formatCurrency(transaction.paid_amount)}</span>
			</div>
			{#if transaction.change_amount > 0}
				<div class="receipt-total-row">
					<span>Kembali:</span>
					<span>{formatCurrency(transaction.change_amount)}</span>
				</div>
			{/if}
		</div>

		<div class="receipt-dashes">{DASHES}</div>

		<!-- ===== Footer ===== -->
		<div class="receipt-footer">
			<p class="receipt-thankyou">"Terima kasih sudah berbelanja!"</p>

			<!-- Barcode Visual -->
			<div class="receipt-barcode" aria-label="Barcode"></div>
			<p class="receipt-barcode-label">{transaction.transaction_code?.replace(/-/g, '') || ''}</p>
		</div>
	</div>
{/snippet}

<!-- ============================================================
     STYLES
     ============================================================ -->
<style>
	/* ===== Overlay & Modal ===== */
	.receipt-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(26, 26, 26, 0.45);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.receipt-modal-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 380px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.receipt-modal-actions {
		display: flex;
		gap: 0.75rem;
		width: 100%;
	}

	.receipt-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-lg);
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		border: none;
	}
	.receipt-btn:active {
		transform: scale(0.97);
	}

	.receipt-btn-secondary {
		flex: 1;
		background: var(--color-sand);
		color: var(--color-earth);
		border: 1px solid var(--color-border);
	}
	.receipt-btn-secondary:hover {
		background: var(--color-sand-light);
	}

	.receipt-btn-primary {
		flex: 2;
		background: var(--color-forest);
		color: white;
		box-shadow: var(--shadow-sm);
	}
	.receipt-btn-primary:hover {
		background: var(--color-forest-dark);
	}

	/* ===== Page wrapper ===== */
	.receipt-page-wrapper {
		max-width: 420px;
		margin: 0 auto;
	}

	/* ===== Receipt Paper ===== */
	.receipt-paper {
		background: white;
		border-radius: 2px;
		box-shadow: var(--shadow-xl);
		padding: 1.5rem;
		position: relative;
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.4;
		color: var(--color-earth);
		border-top: 8px solid var(--color-forest);
	}

	/* ===== Header ===== */
	.receipt-header {
		text-align: center;
		margin-bottom: 0.75rem;
	}

	.receipt-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
		color: var(--color-forest);
	}

	.receipt-brand {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		color: var(--color-earth);
	}

	.receipt-branch-name {
		font-family: var(--font-body);
		font-size: 12px;
		color: var(--color-stone);
		margin: 0;
	}

	.receipt-branch-info {
		font-family: var(--font-body);
		font-size: 12px;
		color: var(--color-stone);
		margin: 0;
	}

	/* ===== Dashes ===== */
	.receipt-dashes {
		color: var(--color-border);
		font-size: 11px;
		letter-spacing: -0.5px;
		text-align: center;
		margin: 0.625rem 0;
		user-select: none;
		overflow: hidden;
		white-space: nowrap;
	}

	/* ===== Info Block ===== */
	.receipt-info-block {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 12px;
		line-height: 1.5;
	}

	.receipt-info-row {
		display: flex;
		justify-content: space-between;
	}

	/* ===== Items ===== */
	.receipt-items {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.receipt-item {
		display: flex;
		flex-direction: column;
	}

	.receipt-item-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 13px;
	}

	.receipt-item-name {
		flex: 1;
		font-weight: 500;
	}

	.receipt-item-subtotal {
		white-space: nowrap;
		text-align: right;
	}

	.receipt-item-detail {
		font-size: 11px;
		color: var(--color-stone);
		padding-left: 0.5rem;
	}

	.receipt-item-rental {
		font-size: 11px;
		color: var(--color-info);
		padding-left: 0.5rem;
		font-style: italic;
	}

	/* ===== Totals ===== */
	.receipt-totals {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 13px;
		margin-bottom: 0.5rem;
	}

	.receipt-total-row {
		display: flex;
		justify-content: space-between;
	}

	.receipt-discount {
		color: var(--color-stone);
	}

	.receipt-grand-total {
		font-weight: 700;
		font-size: 15px;
		margin-top: 0.25rem;
		padding-top: 0.25rem;
	}

	/* ===== Payment ===== */
	.receipt-payment {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 13px;
		margin-bottom: 0;
	}

	/* ===== Footer ===== */
	.receipt-footer {
		text-align: center;
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.receipt-thankyou {
		font-family: var(--font-body);
		font-style: italic;
		font-size: 13px;
		color: var(--color-earth);
		margin: 0 0 1rem 0;
	}

	.receipt-barcode {
		width: 100%;
		height: 48px;
		opacity: 0.8;
		background: repeating-linear-gradient(
			90deg,
			var(--color-earth) 0px,
			var(--color-earth) 2px,
			transparent 2px,
			transparent 4px,
			var(--color-earth) 4px,
			var(--color-earth) 5px,
			transparent 5px,
			transparent 8px,
			var(--color-earth) 8px,
			var(--color-earth) 11px,
			transparent 11px,
			transparent 12px
		);
	}

	.receipt-barcode-label {
		font-size: 10px;
		letter-spacing: 0.2em;
		color: var(--color-stone);
		margin-top: 0.25rem;
	}

	/* ===== Status Badge ===== */
	.receipt-status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.receipt-status-paid {
		background: var(--color-success-bg);
		color: var(--color-success);
	}

	.receipt-status-pending {
		background: var(--color-warning-bg);
		color: var(--color-warning);
	}

	/* ===== Print Styles ===== */
	@media print {
		:global(body) {
			background-color: white !important;
		}
		:global(nav),
		:global(aside),
		:global(header) {
			display: none !important;
		}
		:global(main) {
			padding: 0 !important;
			margin: 0 !important;
		}

		.receipt-overlay {
			display: none !important;
		}

		.receipt-paper {
			box-shadow: none;
			border-top: none;
			padding: 0;
			max-width: 80mm;
			margin: 0 auto;
			font-size: 11px;
		}

		.receipt-grand-total {
			font-size: 13px;
		}

		.receipt-barcode {
			height: 36px;
		}
	}

	/* ===== Responsive ===== */
	@media (max-width: 480px) {
		.receipt-modal-container {
			width: 100%;
			max-width: 380px;
		}
	}
</style>
