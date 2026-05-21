<script>
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { ArrowLeft, CreditCard, User, CalendarClock, ShoppingCart, CheckCircle } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	let { customers } = data;

	let cart = $state([]);
	let hasRental = $state(false);
	let isMounted = $state(false);

	// Form State
	let customerMode = $state('new'); // 'new' or 'existing'
	let customerId = $state('');
	let customerName = $state('');
	let customerPhone = $state('');
	
	let startDate = $state('');
	let endDate = $state('');
	
	let paidAmount = $state('');
	let paymentMethod = $state('cash');

	let loading = $state(false);

	onMount(() => {
		const savedCart = sessionStorage.getItem('botani_cart');
		if (savedCart) {
			cart = JSON.parse(savedCart);
			if (cart.length === 0) {
				window.location.href = '/pos';
				return;
			}
			
			hasRental = cart.some(c => c.type === 'rental' || c.type === 'package');
			
			if (hasRental) {
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				// Format to YYYY-MM-DD local time
				startDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
				endDate = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
			}
			isMounted = true;
		} else {
			window.location.href = '/pos';
		}
	});

	let rentalDays = $derived(() => {
		if (!hasRental || !startDate || !endDate) return 1;
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = end - start;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 1;
	});

	let subtotal = $derived(() => {
		return cart.reduce((acc, curr) => {
			if (curr.type === 'rental' || curr.type === 'package') {
				return acc + (curr.price * curr.quantity * rentalDays());
			}
			return acc + (curr.price * curr.quantity); // retail
		}, 0);
	});

	let changeAmount = $derived(() => {
		const paid = parseFloat(paidAmount) || 0;
		return paid > subtotal() ? paid - subtotal() : 0;
	});

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
			rental_end_date: hasRental ? endDate : null,
			rental_days: rentalDays(),
			cart: cart.map(c => ({
				type: c.type,
				item_id: c.type !== 'package' ? c.id : null,
				package_id: c.type === 'package' ? c.id : null,
				item_name: c.name,
				quantity: c.quantity,
				unit_price: c.price,
				subtotal: (c.type === 'rental' || c.type === 'package') ? (c.price * c.quantity * rentalDays()) : (c.price * c.quantity)
			}))
		};
		return JSON.stringify(payload);
	});

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
	}

	function handleSuccess() {
		// Clear cart after successful submission
		sessionStorage.removeItem('botani_cart');
	}
</script>

{#if !isMounted}
	<div class="h-64 flex items-center justify-center text-[var(--color-stone)]">Memuat keranjang...</div>
{:else}
	<div class="space-y-6 max-w-5xl mx-auto pb-12">
		<!-- Header -->
		<div class="flex items-center gap-4">
			<!-- eslint-disable-next-line -->
			<a href="/pos" class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-lg transition-colors">
				<ArrowLeft size={24} />
			</a>
			<div>
				<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Checkout Transaksi</h1>
				<p class="text-[var(--color-stone)] mt-1">Lengkapi data pelanggan dan pembayaran untuk mencetak struk.</p>
			</div>
		</div>

		{#if form?.error}
			<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium">
				{form.error}
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
			<input type="hidden" name="payload" value={payloadStr} />

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				<!-- Kolom Kiri: Form Data -->
				<div class="lg:col-span-2 space-y-6">
					
					<!-- 1. Jadwal Sewa (Hanya muncul jika ada barang sewa) -->
					{#if hasRental}
						<Card padding="md">
							<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-4 flex items-center gap-2">
								<CalendarClock size={20} class="text-[var(--color-forest)]" /> Jadwal Sewa
							</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label for="startDate" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Tanggal Mulai (Ambil)</label>
									<input 
										type="date" 
										id="startDate"
										bind:value={startDate}
										class="w-full px-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
										required
									>
								</div>
								<div>
									<label for="endDate" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Tanggal Selesai (Kembali)</label>
									<input 
										type="date" 
										id="endDate"
										bind:value={endDate}
										min={startDate}
										class="w-full px-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
										required
									>
								</div>
							</div>
							<div class="mt-3 text-sm text-[var(--color-stone)] bg-[var(--color-sand)]/50 p-3 rounded-lg border border-[var(--color-border-light)]">
								Total durasi sewa: <strong class="text-[var(--color-forest)]">{rentalDays()} Hari</strong>
							</div>
						</Card>
					{/if}

					<!-- 2. Data Pelanggan -->
					<Card padding="md">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] flex items-center gap-2">
								<User size={20} class="text-[var(--color-forest)]" /> Data Pelanggan
							</h3>
							<!-- Toggle Baru / Lama -->
							<div class="flex bg-[var(--color-sand)] rounded-lg p-1">
								<button type="button" class="px-3 py-1 text-sm font-medium rounded-md transition-colors {customerMode === 'new' ? 'bg-white text-[var(--color-earth)] shadow-sm' : 'text-[var(--color-stone)]'}" onclick={() => customerMode = 'new'}>Pelanggan Baru</button>
								<button type="button" class="px-3 py-1 text-sm font-medium rounded-md transition-colors {customerMode === 'existing' ? 'bg-white text-[var(--color-earth)] shadow-sm' : 'text-[var(--color-stone)]'}" onclick={() => customerMode = 'existing'}>Pilih dari Database</button>
							</div>
						</div>

						{#if customerMode === 'new'}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Input id="customerName" label="Nama Lengkap" bind:value={customerName} placeholder="misal: Budi Santoso" />
								<Input id="customerPhone" label="Nomor HP/WA" bind:value={customerPhone} placeholder="misal: 081234567890" />
							</div>
						{:else}
							<div>
								<label for="customerId" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Pilih Pelanggan</label>
								<select 
									id="customerId" 
									bind:value={customerId}
									class="w-full px-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
								>
									<option value="" disabled selected>-- Pilih Pelanggan --</option>
									{#each customers as cust}
										<option value={cust.id}>{cust.full_name} ({cust.phone || '-'})</option>
									{/each}
								</select>
							</div>
						{/if}
						<p class="text-xs text-[var(--color-stone)] mt-3">Data pelanggan wajib diisi untuk transaksi yang mengandung barang sewa sebagai jaminan tracing.</p>
					</Card>

				</div>

				<!-- Kolom Kanan: Summary & Payment -->
				<div class="lg:col-span-1 space-y-6">
					<!-- Rincian Keranjang -->
					<Card padding="md" class="bg-[var(--color-sand-lightest)]/50">
						<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-3 flex items-center gap-2">
							<ShoppingCart size={18} /> Ringkasan
						</h3>
						<ul class="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
							{#each cart as item}
								<li class="flex justify-between items-start text-sm">
									<div class="flex-1 pr-2">
										<p class="font-bold text-[var(--color-earth)] leading-tight">{item.name}</p>
										<p class="text-xs text-[var(--color-stone)] mt-0.5">
											{item.quantity}x {formatCurrency(item.price)}
											{#if item.type === 'rental' || item.type === 'package'}
												<span class="text-[var(--color-forest)] ml-1">x {rentalDays()} hr</span>
											{/if}
										</p>
									</div>
									<div class="font-bold text-[var(--color-earth)]">
										{#if item.type === 'rental' || item.type === 'package'}
											{formatCurrency(item.price * item.quantity * rentalDays())}
										{:else}
											{formatCurrency(item.price * item.quantity)}
										{/if}
									</div>
								</li>
							{/each}
						</ul>
						<div class="border-t border-[var(--color-border)] pt-3 flex justify-between items-end">
							<span class="text-[var(--color-stone)] font-medium">Total Tagihan</span>
							<span class="text-2xl font-bold font-heading text-[var(--color-forest)]">{formatCurrency(subtotal())}</span>
						</div>
					</Card>

					<!-- Pembayaran -->
					<Card padding="md" class="border-2 border-[var(--color-forest)]/20 shadow-md">
						<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-4 flex items-center gap-2">
							<CreditCard size={20} class="text-[var(--color-forest)]" /> Pembayaran
						</h3>

						<div class="space-y-4">
							<div>
								<label for="paymentMethod" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Metode Pembayaran</label>
								<select 
									id="paymentMethod" 
									bind:value={paymentMethod}
									class="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
								>
									<option value="cash">Tunai (Cash)</option>
									<option value="transfer">Transfer Manual (BCA/Mandiri)</option>
									<!-- Midtrans/QRIS akan diaktifkan di Sprint 4 -->
									<option value="qris" disabled>QRIS (Coming Soon)</option>
								</select>
							</div>

							<div>
								<label for="paidAmount" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Jumlah Uang Diterima (Rp)</label>
								<input 
									type="number" 
									id="paidAmount"
									bind:value={paidAmount}
									placeholder="misal: 150000"
									min={subtotal()}
									class="w-full px-4 py-3 text-lg font-bold bg-white border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
									required
								>
							</div>

							{#if changeAmount() > 0}
								<div class="bg-[var(--color-warning)]/10 text-[var(--color-warning)] p-3 rounded-lg border border-[var(--color-warning)]/20 text-center">
									<p class="text-xs font-semibold mb-1 uppercase tracking-wider">Uang Kembalian</p>
									<p class="text-2xl font-bold font-heading">{formatCurrency(changeAmount())}</p>
								</div>
							{/if}

							<Button type="submit" disabled={loading || (parseFloat(paidAmount)||0) < subtotal() || (hasRental && (!startDate || !endDate))} class="w-full py-4 text-lg">
								{#if loading}
									Memproses...
								{:else}
									<CheckCircle size={20} class="mr-2" /> Selesaikan Transaksi
								{/if}
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</form>
	</div>
{/if}
