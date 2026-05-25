<script>
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { ArrowLeft, CreditCard, User, CalendarClock, ShoppingCart, CheckCircle, Banknote, QrCode, Landmark, Wallet, Package, Minus, Plus, Sparkles } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data, form } = $props();
	let customers = $derived(data.customers);
	let rentalSettings = $derived(data.rentalSettings);
	let defaultRentalDuration = $derived(rentalSettings?.default_rental_duration_days || 4);

	/** @type {any[]} */
	let cart = $state([]);
	let hasRental = $state(false);
	let isMounted = $state(false);

	// Form State
	let customerMode = $state('new'); // 'new' or 'existing'
	let customerId = $state('');
	let customerName = $state('');
	let customerPhone = $state('');
	
	let startDate = $state('');
	
	let paidAmount = $state('');
	let paymentMethod = $state('cash');

	let loading = $state(false);

	// Animation states
	let showChangeAnimation = $state(false);

	onMount(() => {
		const savedCart = sessionStorage.getItem('botani_cart');
		if (savedCart) {
			cart = JSON.parse(savedCart);
			if (cart.length === 0) {
				window.location.href = '/pos';
				return;
			}
			
			hasRental = cart.some((/** @type {any} */ c) => c.type === 'rental' || c.type === 'package');
			
			if (hasRental) {
				const today = new Date();
				// Format to YYYY-MM-DD local time
				startDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
			}
			isMounted = true;
		} else {
			window.location.href = '/pos';
		}
	});

	// Automatically calculate endDate based on startDate and default duration
	let endDate = $derived(() => {
		if (!startDate) return '';
		const start = new Date(startDate);
		const end = new Date(start);
		end.setDate(end.getDate() + defaultRentalDuration);
		return new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
	});

	let subtotal = $derived(() => {
		return cart.reduce((/** @type {number} */ acc, /** @type {any} */ curr) => {
			return acc + (curr.price * curr.quantity);
		}, 0);
	});

	let changeAmount = $derived(() => {
		const paid = parseFloat(paidAmount) || 0;
		return paid > subtotal() ? paid - subtotal() : 0;
	});

	// Cash shortcut denominations
	let cashShortcuts = $derived(() => {
		const total = subtotal();
		/** @type {{ label: string; value: number }[]} */
		const shortcuts = [];
		
		// Uang Pas (exact amount)
		shortcuts.push({ label: 'Uang Pas', value: total });
		
		// Smart rounding shortcuts
		const roundups = [50000, 100000, 150000, 200000, 250000, 300000, 500000, 1000000];
		for (const r of roundups) {
			if (r > total) {
				shortcuts.push({ label: formatCurrency(r), value: r });
			}
			if (shortcuts.length >= 6) break;
		}
		
		return shortcuts;
	});

	/**
	 * @param {number} amount
	 */
	function selectCashAmount(amount) {
		paidAmount = String(amount);
		// Trigger change animation
		showChangeAnimation = false;
		setTimeout(() => { showChangeAnimation = true; }, 50);
	}

	let payloadStr = $derived(() => {
		const payload = {
			type: hasRental ? (cart.some(c => c.type === 'retail') ? 'hybrid' : 'rental') : 'retail',
			customer_id: customerMode === 'existing' ? customerId : null,
			customer_name: customerMode === 'new' ? customerName : null,
			customer_phone: customerMode === 'new' ? customerPhone : null,
			subtotal: subtotal(),
			discount_amount: 0,
			total_amount: subtotal(),
			paid_amount: parseFloat(paidAmount) || 0,
			change_amount: changeAmount(),
			payment_method: paymentMethod,
			rental_start_date: hasRental ? startDate : null,
			rental_end_date: hasRental ? endDate() : null,
			rental_days: hasRental ? defaultRentalDuration : null,
			cart: cart.map(c => ({
				type: c.type,
				item_id: c.type !== 'package' ? c.id : null,
				package_id: c.type === 'package' ? c.id : null,
				item_name: c.name,
				quantity: c.quantity,
				unit_price: c.price,
				subtotal: (c.price * c.quantity)
			}))
		};
		return JSON.stringify(payload);
	});

	function handleSuccess() {
		// Clear cart after successful submission
		sessionStorage.removeItem('botani_cart');
	}

	// Steps
	let currentStep = $derived(() => {
		if (hasRental && !startDate) return 1;
		if (hasRental) return 2;
		return 2;
	});

	const paymentMethods = [
		{ id: 'cash', label: 'Tunai', sublabel: 'Bayar dengan uang cash', icon: Banknote, color: 'var(--color-forest)' },
		{ id: 'transfer', label: 'Transfer', sublabel: 'BCA / Mandiri', icon: Landmark, color: 'var(--color-info)' },
		{ id: 'qris', label: 'QRIS', sublabel: 'Scan QR Midtrans', icon: QrCode, color: '#7C3AED' },
	];
</script>

<svelte:head>
	<title>Checkout - BotaniRent</title>
	<meta name="description" content="Checkout transaksi pembayaran BotaniRent" />
</svelte:head>

{#if !isMounted}
	<!-- Skeleton Loading -->
	<div class="max-w-6xl mx-auto pb-12">
		<div class="flex items-center gap-4 mb-8">
			<div class="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
			<div class="space-y-2">
				<div class="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
				<div class="h-4 w-72 bg-gray-200 rounded-lg animate-pulse"></div>
			</div>
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
			<div class="lg:col-span-3 space-y-6">
				<div class="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
				<div class="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
			</div>
			<div class="lg:col-span-2 space-y-6">
				<div class="h-80 bg-gray-200 rounded-2xl animate-pulse"></div>
			</div>
		</div>
	</div>
{:else}
	<div class="max-w-6xl mx-auto pb-16">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-8">
			<!-- eslint-disable-next-line -->
			<a href="/pos" class="checkout-back-btn group">
				<ArrowLeft size={20} class="transition-transform duration-200 group-hover:-translate-x-0.5" />
			</a>
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold font-heading text-[var(--color-earth)] tracking-tight">Checkout Pembayaran</h1>
				<p class="text-sm text-[var(--color-stone)] mt-1">Lengkapi informasi untuk menyelesaikan transaksi</p>
			</div>
		</div>

		{#if form?.error}
			<div class="checkout-error-banner mb-6">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
					</div>
					<p class="text-sm font-medium">{form.error}</p>
				</div>
			</div>
		{/if}

		<form 
			method="POST" 
			use:enhance={() => {
				loading = true;
				return async ({ update, result }) => {
					await update();
					loading = false;
					if (result.type === 'redirect') {
						handleSuccess();
					}
				};
			}}
		>
			<input type="hidden" name="payload" value={payloadStr()} />

			<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
				
				<!-- Left Column: Form -->
				<div class="lg:col-span-3 space-y-6">
					
					<!-- 1. Jadwal Sewa -->
					{#if hasRental}
						<div class="checkout-card">
							<div class="checkout-card-header">
								<div class="checkout-card-icon bg-amber-50 text-amber-600">
									<CalendarClock size={20} />
								</div>
								<div>
									<h3 class="checkout-card-title">Jadwal Sewa</h3>
									<p class="checkout-card-subtitle">Atur periode sewa untuk barang rental</p>
								</div>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Input 
									type="date" 
									id="startDate"
									label="Tanggal Mulai (Ambil)"
									bind:value={startDate}
									required
								/>
								<div>
									<Input 
										type="date" 
										id="endDate"
										label="Tanggal Selesai"
										value={endDate()}
										readonly
										class="opacity-70"
									/>
								</div>
							</div>
							<div class="checkout-info-banner mt-4">
								<Sparkles size={14} class="text-amber-500 shrink-0 mt-0.5" />
								<span>
									Siklus sewa: <strong class="text-[var(--color-forest)]">{defaultRentalDuration} Hari</strong>. Keterlambatan dikenakan denda harian.
								</span>
							</div>
						</div>
					{/if}

					<!-- 2. Data Pelanggan -->
					<div class="checkout-card">
						<div class="checkout-card-header">
							<div class="checkout-card-icon bg-blue-50 text-blue-600">
								<User size={20} />
							</div>
							<div class="flex-1">
								<h3 class="checkout-card-title">Data Pelanggan</h3>
								<p class="checkout-card-subtitle">Informasi penyewa untuk tracing aset</p>
							</div>
							<!-- Toggle -->
							<div class="checkout-toggle">
								<button type="button" class="checkout-toggle-btn {customerMode === 'new' ? 'active' : ''}" onclick={() => customerMode = 'new'}>Baru</button>
								<button type="button" class="checkout-toggle-btn {customerMode === 'existing' ? 'active' : ''}" onclick={() => customerMode = 'existing'}>Database</button>
							</div>
						</div>

						{#if customerMode === 'new'}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Input id="customerName" label="Nama Lengkap" bind:value={customerName} placeholder="misal: Budi Santoso" />
								<Input id="customerPhone" label="Nomor HP/WA" bind:value={customerPhone} placeholder="misal: 081234567890" />
							</div>
						{:else}
							<Select 
								id="customerId" 
								label="Pilih Pelanggan"
								bind:value={customerId}
							>
								<option value="" disabled selected>-- Cari pelanggan terdaftar --</option>
								{#each customers as cust}
									<option value={cust.id}>{cust.full_name} ({cust.phone || '-'})</option>
								{/each}
							</Select>
						{/if}
					</div>

					<!-- 3. Metode Pembayaran -->
					<div class="checkout-card">
						<div class="checkout-card-header">
							<div class="checkout-card-icon bg-emerald-50 text-emerald-600">
								<Wallet size={20} />
							</div>
							<div>
								<h3 class="checkout-card-title">Metode Pembayaran</h3>
								<p class="checkout-card-subtitle">Pilih cara pembayaran pelanggan</p>
							</div>
						</div>

						<!-- Payment Method Cards -->
						<div class="grid grid-cols-3 gap-3">
							{#each paymentMethods as pm}
								<button 
									type="button"
									onclick={() => {
										paymentMethod = pm.id;
										if (pm.id === 'qris') paidAmount = String(subtotal());
									}}
									class="payment-method-card {paymentMethod === pm.id ? 'active' : ''}"
									style="--pm-color: {pm.color}"
								>
									<div class="payment-method-icon {paymentMethod === pm.id ? 'active' : ''}">
										<pm.icon size={22} />
									</div>
									<span class="payment-method-label">{pm.label}</span>
									<span class="payment-method-sublabel hidden sm:block">{pm.sublabel}</span>
								</button>
							{/each}
						</div>

						<!-- Cash Input & Shortcuts -->
						{#if paymentMethod === 'cash' || paymentMethod === 'transfer'}
							<div class="mt-5 space-y-4">
								<div class="relative">
									<label for="paidAmountInput" class="text-[13px] font-medium text-[var(--color-earth)] mb-1.5 block">
										Jumlah Uang Diterima
									</label>
									<div class="relative">
										<span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)] font-semibold text-sm pointer-events-none">Rp</span>
										<input 
											id="paidAmountInput"
											type="number" 
											bind:value={paidAmount}
											placeholder="0"
											min={subtotal()}
											required
											class="cash-input"
										/>
									</div>
								</div>

								<!-- Cash Shortcuts -->
								{#if paymentMethod === 'cash'}
									<div>
										<p class="text-xs font-semibold text-[var(--color-stone)] mb-2 uppercase tracking-wider">Pilih Cepat</p>
										<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
											{#each cashShortcuts() as shortcut}
												<button 
													type="button"
													onclick={() => selectCashAmount(shortcut.value)}
													class="cash-shortcut-btn {parseFloat(paidAmount) === shortcut.value ? 'active' : ''}"
												>
													{shortcut.label}
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Change Display -->
								{#if changeAmount() > 0}
									<div class="change-display {showChangeAnimation ? 'animate' : ''}">
										<div class="change-display-inner">
											<div class="flex items-center gap-2">
												<div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
													<Banknote size={16} class="text-amber-600" />
												</div>
												<div>
													<p class="text-xs font-semibold text-amber-700/80 uppercase tracking-wider">Kembalian</p>
													<p class="text-xl sm:text-2xl font-bold font-heading text-amber-700">{formatCurrency(changeAmount())}</p>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="mt-4 checkout-info-banner">
								<QrCode size={14} class="text-purple-500 shrink-0 mt-0.5" />
								<span>Pelanggan akan diarahkan ke halaman pembayaran QRIS Midtrans setelah submit.</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column: Summary & Submit -->
				<div class="lg:col-span-2">
					<div class="lg:sticky lg:top-24 space-y-6">
						<!-- Cart Summary -->
						<div class="checkout-summary-card">
							<div class="checkout-summary-header">
								<ShoppingCart size={18} />
								<span>Ringkasan Pesanan</span>
								<span class="checkout-item-count">{cart.length}</span>
							</div>
							
							<ul class="checkout-item-list">
								{#each cart as item, idx}
									<li class="checkout-item" style="animation-delay: {idx * 50}ms">
										<div class="checkout-item-icon">
											{#if item.type === 'package'}
												<Package size={16} />
											{:else}
												<ShoppingCart size={14} />
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-semibold text-[var(--color-earth)] truncate">{item.name}</p>
											<p class="text-xs text-[var(--color-stone)] mt-0.5">
												{item.quantity}× {formatCurrency(item.price)}
												{#if item.type === 'rental' || item.type === 'package'}
													<span class="text-[var(--color-forest)] font-medium">/siklus</span>
												{/if}
											</p>
										</div>
										<div class="text-sm font-bold text-[var(--color-earth)] tabular-nums whitespace-nowrap">
											{formatCurrency(item.price * item.quantity)}
										</div>
									</li>
								{/each}
							</ul>

							<!-- Subtotal -->
							<div class="checkout-subtotal">
								<div class="flex justify-between items-center text-sm text-[var(--color-stone)]">
									<span>Subtotal ({cart.length} item)</span>
									<span class="font-semibold tabular-nums">{formatCurrency(subtotal())}</span>
								</div>
								<div class="flex justify-between items-center text-sm text-[var(--color-stone)]">
									<span>Diskon</span>
									<span class="font-semibold">-</span>
								</div>
							</div>

							<!-- Total -->
							<div class="checkout-total">
								<span class="text-sm font-semibold text-[var(--color-earth)]">Total Tagihan</span>
								<span class="text-2xl font-bold font-heading text-[var(--color-forest)] tabular-nums">
									{formatCurrency(subtotal())}
								</span>
							</div>

							<!-- Payment Info Summary -->
							{#if parseFloat(paidAmount) > 0 && paymentMethod !== 'qris'}
								<div class="checkout-payment-info">
									<div class="flex justify-between text-sm">
										<span class="text-[var(--color-stone)]">Dibayar ({paymentMethod === 'cash' ? 'Tunai' : 'Transfer'})</span>
										<span class="font-semibold text-[var(--color-earth)] tabular-nums">{formatCurrency(parseFloat(paidAmount))}</span>
									</div>
									{#if changeAmount() > 0}
										<div class="flex justify-between text-sm">
											<span class="text-amber-600">Kembalian</span>
											<span class="font-bold text-amber-600 tabular-nums">{formatCurrency(changeAmount())}</span>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Submit Button -->
							<div class="p-5 pt-0">
								<button
									type="submit"
									disabled={loading || (paymentMethod !== 'qris' && (parseFloat(paidAmount)||0) < subtotal()) || (hasRental && !startDate)}
									class="checkout-submit-btn"
								>
									{#if loading}
										<div class="checkout-spinner"></div>
										<span>Memproses Transaksi...</span>
									{:else}
										<CheckCircle size={20} />
										<span>{paymentMethod === 'qris' ? 'Lanjut ke Pembayaran QRIS' : 'Selesaikan Transaksi'}</span>
									{/if}
								</button>
								<p class="text-[11px] text-center text-[var(--color-stone)] mt-3">
									Dengan menyelesaikan transaksi, struk akan otomatis tercetak.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
{/if}

<style>
	/* ─── Back Button ─── */
	.checkout-back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 14px;
		color: var(--color-stone);
		background: white;
		border: 1.5px solid var(--color-border-light);
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.checkout-back-btn:hover {
		background: var(--color-sand);
		color: var(--color-earth);
		border-color: var(--color-border);
	}

	/* ─── Error Banner ─── */
	.checkout-error-banner {
		background: linear-gradient(135deg, rgba(220, 38, 38, 0.04), rgba(220, 38, 38, 0.08));
		color: var(--color-error);
		padding: 14px 18px;
		border-radius: 16px;
		border: 1px solid rgba(220, 38, 38, 0.15);
	}

	/* ─── Card Base ─── */
	.checkout-card {
		background: white;
		border: 1px solid var(--color-border-light);
		border-radius: 20px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.02);
		transition: box-shadow 0.3s ease;
	}
	.checkout-card:hover {
		box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03);
	}

	.checkout-card-header {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		margin-bottom: 20px;
	}

	.checkout-card-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.checkout-card-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-earth);
		font-family: var(--font-heading);
		line-height: 1.3;
	}

	.checkout-card-subtitle {
		font-size: 13px;
		color: var(--color-stone);
		margin-top: 2px;
	}

	/* ─── Toggle Switch ─── */
	.checkout-toggle {
		display: flex;
		background: var(--color-sand);
		border-radius: 10px;
		padding: 3px;
		flex-shrink: 0;
	}
	.checkout-toggle-btn {
		padding: 6px 14px;
		font-size: 12px;
		font-weight: 600;
		border-radius: 8px;
		color: var(--color-stone);
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		background: transparent;
		white-space: nowrap;
	}
	.checkout-toggle-btn.active {
		background: white;
		color: var(--color-earth);
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	/* ─── Info Banner ─── */
	.checkout-info-banner {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 12px;
		background: var(--color-sand);
		font-size: 13px;
		color: var(--color-stone);
		line-height: 1.5;
		border: 1px solid var(--color-border-light);
	}

	/* ─── Payment Method Cards ─── */
	.payment-method-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 8px;
		border-radius: 16px;
		border: 2px solid var(--color-border-light);
		background: white;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: center;
	}
	.payment-method-card:hover {
		border-color: var(--color-border);
		background: var(--color-sand);
	}
	.payment-method-card.active {
		border-color: var(--pm-color);
		background: color-mix(in srgb, var(--pm-color) 5%, white);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--pm-color) 12%, transparent);
	}

	.payment-method-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-sand);
		color: var(--color-stone);
		transition: all 0.25s ease;
	}
	.payment-method-icon.active {
		background: color-mix(in srgb, var(--pm-color) 12%, white);
		color: var(--pm-color);
	}

	.payment-method-label {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-earth);
		line-height: 1;
	}
	.payment-method-sublabel {
		font-size: 11px;
		color: var(--color-stone);
		line-height: 1.2;
	}

	/* ─── Cash Input ─── */
	.cash-input {
		width: 100%;
		height: 52px;
		padding: 0 16px 0 40px;
		border: 2px solid var(--color-border);
		border-radius: 14px;
		font-size: 20px;
		font-weight: 700;
		color: var(--color-earth);
		font-family: var(--font-heading);
		transition: all 0.2s ease;
		outline: none;
		background: white;
	}
	.cash-input:focus {
		border-color: var(--color-forest);
		box-shadow: 0 0 0 4px var(--color-sage-20);
	}
	.cash-input::placeholder {
		color: var(--color-muted);
		font-weight: 400;
	}
	/* Hide number input spinners */
	.cash-input::-webkit-outer-spin-button,
	.cash-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.cash-input[type=number] {
		-moz-appearance: textfield;
	}

	/* ─── Cash Shortcut Buttons ─── */
	.cash-shortcut-btn {
		padding: 8px 4px;
		border-radius: 10px;
		border: 1.5px solid var(--color-border-light);
		background: white;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-stone);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
		white-space: nowrap;
	}
	.cash-shortcut-btn:hover {
		border-color: var(--color-forest);
		color: var(--color-forest);
		background: var(--color-sage-10);
	}
	.cash-shortcut-btn.active {
		border-color: var(--color-forest);
		background: var(--color-sage-10);
		color: var(--color-forest);
		box-shadow: 0 0 0 2px var(--color-sage-20);
	}

	/* ─── Change Display ─── */
	.change-display {
		border-radius: 16px;
		overflow: hidden;
		transition: all 0.3s ease;
	}
	.change-display-inner {
		padding: 16px;
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.12));
		border: 1.5px solid rgba(245, 158, 11, 0.2);
		border-radius: 16px;
	}
	.change-display.animate .change-display-inner {
		animation: changePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes changePopIn {
		0% { transform: scale(0.95); opacity: 0.5; }
		100% { transform: scale(1); opacity: 1; }
	}

	/* ─── Summary Card ─── */
	.checkout-summary-card {
		background: white;
		border: 1.5px solid var(--color-border-light);
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
	}

	.checkout-summary-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 18px 20px;
		font-size: 15px;
		font-weight: 700;
		color: var(--color-earth);
		font-family: var(--font-heading);
		border-bottom: 1px solid var(--color-border-light);
		background: linear-gradient(180deg, var(--color-sand) 0%, transparent 100%);
	}

	.checkout-item-count {
		margin-left: auto;
		background: var(--color-forest);
		color: white;
		font-size: 11px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 20px;
		min-width: 24px;
		text-align: center;
	}

	.checkout-item-list {
		padding: 12px 20px;
		max-height: 280px;
		overflow-y: auto;
	}

	.checkout-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--color-border-light);
		animation: itemFadeIn 0.3s ease both;
	}
	.checkout-item:last-child {
		border-bottom: none;
	}

	@keyframes itemFadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.checkout-item-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--color-sage-10);
		color: var(--color-forest);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.checkout-subtotal {
		padding: 14px 20px;
		border-top: 1px solid var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--color-sand);
	}

	.checkout-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		background: linear-gradient(135deg, rgba(44, 110, 73, 0.04), rgba(44, 110, 73, 0.08));
		border-top: 1.5px solid rgba(44, 110, 73, 0.1);
	}

	.checkout-payment-info {
		padding: 12px 20px;
		border-top: 1px solid var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* ─── Submit Button ─── */
	.checkout-submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		padding: 14px 24px;
		border-radius: 14px;
		border: none;
		background: linear-gradient(135deg, var(--color-forest), var(--color-forest-light));
		color: white;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.25s ease;
		box-shadow: 0 2px 8px rgba(44, 110, 73, 0.25), 0 1px 2px rgba(44, 110, 73, 0.15);
		margin: 20px 20px 0 20px;
		width: calc(100% - 40px);
	}
	.checkout-submit-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 16px rgba(44, 110, 73, 0.3), 0 2px 4px rgba(44, 110, 73, 0.2);
	}
	.checkout-submit-btn:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
	}
	.checkout-submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--color-stone);
		box-shadow: none;
	}

	.checkout-spinner {
		width: 18px;
		height: 18px;
		border: 2.5px solid rgba(255,255,255,0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ─── Scrollbar for item list ─── */
	.checkout-item-list::-webkit-scrollbar {
		width: 4px;
	}
	.checkout-item-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.checkout-item-list::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 4px;
	}

	/* ─── Tabular numbers for prices ─── */
	:global(.tabular-nums) {
		font-variant-numeric: tabular-nums;
	}
</style>
