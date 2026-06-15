<script>
	import { onMount } from 'svelte';
	import {
		Search,
		ShoppingCart,
		Trash2,
		Package,
		Boxes,
		CreditCard,
		CalendarClock,
		Minus,
		Plus,
		Camera
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import { isMobileApp, scanBarcodeFromMobile } from '$lib/utils/mobileBridge';

	let { data } = $props();
	let items = $derived(data.items);
	let packages = $derived(data.packages);
	let categories = $derived(data.categories);

	let isMobile = $state(false);

	onMount(() => {
		isMobile = isMobileApp();
	});

	async function handleMobileScan() {
		const scannedCode = await scanBarcodeFromMobile();
		if (scannedCode) {
			toast.success(`Scan berhasil: ${scannedCode}`);
			processBarcode(scannedCode);
		}
	}

	// --- BARCODE SCANNER LOGIC ---
	let barcodeBuffer = '';
	/** @type {any} */
	let barcodeTimeout;

	/** @param {any} e */
	function handleKeydown(e) {
		// Abaikan jika fokus sedang ada di dalam input teks/textarea
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

		// Scanner barcode biasanya menekan tombol dengan sangat cepat dan diakhiri dengan 'Enter'
		if (e.key === 'Enter') {
			if (barcodeBuffer.length > 0) {
				processBarcode(barcodeBuffer);
				barcodeBuffer = '';
			}
		} else if (e.key.length === 1) {
			barcodeBuffer += e.key;
			clearTimeout(barcodeTimeout);
			barcodeTimeout = setTimeout(() => {
				barcodeBuffer = ''; // Reset jika ketikan terlalu lambat (berarti diketik manual, bukan scanner)
			}, 50);
		}
	}

	/** @param {any} code */
	function processBarcode(code) {
		const foundItem = items.find((/** @type {any} */ i) => i.barcode === code);
		if (foundItem) {
			addToCart(foundItem, foundItem.category.type);
		}
	}

	// --- STATE MANAGEMENT ---
	let activeTab = $state('all'); // 'all', 'sewa', 'retail', 'package'
	let searchQuery = $state('');

	// Keranjang: array of { id, type, name, price, quantity, maxQty, rawData }
	// type: 'retail', 'rental', 'package'
	/** @type {any[]} */
	let cart = $state([]);

	// --- DERIVED VALUES ---
	/** @type {any} */
	let displayItems = $derived(() => {
		/** @type {any[]} */
		let list = [];
		if (activeTab === 'package' || activeTab === 'all') {
			packages.forEach((/** @type {any} */ p) => list.push({ ...p, __displayType: 'package' }));
		}
		if (activeTab !== 'package') {
			items.forEach((/** @type {any} */ i) => {
				if (activeTab === 'all' || activeTab === i.category.type) {
					list.push({ ...i, __displayType: i.category.type });
				}
			});
		}

		// Filter pencarian
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(/** @type {any} */ item) =>
					item.name.toLowerCase().includes(q) ||
					(item.barcode && item.barcode.toLowerCase().includes(q))
			);
		}
		return list;
	});

	let cartHasRental = $derived(
		cart.some((/** @type {any} */ c) => c.type === 'rental' || c.type === 'package')
	);
	let cartTotal = $derived(
		cart.reduce(
			(/** @type {number} */ acc, /** @type {any} */ curr) => acc + curr.price * curr.quantity,
			0
		)
	);

	// --- ACTIONS ---
	/**
	 * @param {any} item
	 * @param {any} type
	 */
	function addToCart(item, type) {
		if (type === 'sewa') type = 'rental'; // Normalize 'sewa' to 'rental'
		const id = item.id;
		const existingIdx = cart.findIndex((/** @type {any} */ c) => c.id === id && c.type === type);

		let price =
			type === 'retail'
				? item.sell_price
				: type === 'package'
					? item.package_price
					: item.rental_price_per_day;
		let maxQty = type === 'package' ? 999 : item.stock_available; // Asumsi paket tidak limitasi realtime UI dulu

		if (maxQty <= 0) {
			toast.error('Stok barang habis!', {
				description: `${item.name} tidak tersedia saat ini.`
			});
			return;
		}

		if (existingIdx >= 0) {
			if (cart[existingIdx].quantity < maxQty) {
				cart[existingIdx].quantity += 1;
			}
		} else {
			cart = [
				...cart,
				{
					id: item.id,
					type: type, // 'retail', 'rental', 'package'
					name: item.name,
					price: price,
					quantity: 1,
					maxQty: maxQty,
					rawData: item
				}
			];
		}
	}

	/**
	 * @param {any} index
	 * @param {any} change
	 */
	function updateCartQty(index, change) {
		const item = cart[index];
		const newQty = item.quantity + change;
		if (newQty > 0 && newQty <= item.maxQty) {
			cart[index].quantity = newQty;
		} else if (newQty === 0) {
			cart = cart.filter((_, i) => i !== index);
		}
	}

	function checkout() {
		if (cart.length === 0) return;
		// Simpan keranjang di sessionStorage agar bisa diproses di halaman checkout
		sessionStorage.setItem('botani_cart', JSON.stringify(cart));
		window.location.href = '/pos/checkout';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if !data.currentBranchId}
	<div
		class="z-20 -mx-8 -mt-6 flex h-[calc(100vh-4rem)] w-[calc(100%+4rem)] flex-col items-center justify-center bg-[var(--color-sand-lightest)] p-6 text-center"
	>
		<div
			class="flex max-w-md flex-col items-center rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-xl"
		>
			<div
				class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
			>
				<ShoppingCart size={32} />
			</div>
			<h2 class="mb-3 font-heading text-2xl font-bold text-[var(--color-earth)]">
				Pilih Cabang Terlebih Dahulu
			</h2>
			<p class="mb-6 text-sm leading-relaxed text-[var(--color-stone)]">
				Anda saat ini berada di tampilan <strong>Semua Cabang</strong>. Transaksi penjualan (POS)
				hanya dapat dilakukan pada cabang tertentu. Silakan pilih salah satu cabang aktif pada menu
				dropdown <strong>Cabang</strong> di bagian atas (TopBar) untuk memulai transaksi.
			</p>
		</div>
	</div>
{:else}
	<div class="-mx-8 -mt-6 flex h-[calc(100vh-4rem)] overflow-hidden">
		<!-- BAGIAN KIRI: KATALOG BARANG (70%) -->
		<div
			class="relative flex w-[65%] flex-col border-r border-[var(--color-border)] bg-[var(--color-sand-lightest)]"
		>
			<!-- Top Bar Katalog -->
			<div class="z-10 flex flex-col gap-4 border-b border-[var(--color-border)] bg-white p-4">
				<div class="flex items-center justify-between">
					<h1 class="font-heading text-2xl font-bold text-[var(--color-earth)]">Point of Sales</h1>
					<Input bind:value={searchQuery} placeholder="Cari atau scan barcode..." class="w-64">
						{#snippet iconLeft()}
							<Search size={18} />
						{/snippet}
						{#snippet iconRight()}
							{#if isMobile}
								<button
									type="button"
									class="flex items-center justify-center p-1 text-[var(--color-forest)] transition-colors hover:text-[var(--color-forest-light)]"
									onclick={handleMobileScan}
									title="Pindai Barcode via Kamera"
								>
									<Camera size={18} />
								</button>
							{/if}
						{/snippet}
					</Input>
				</div>

				<!-- Filter Tabs -->
				<div class="flex gap-2">
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'all'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'all')}>Semua</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'sewa'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'sewa')}>Sewa Alat</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'package'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'package')}>Paket Bundling</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'retail'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'retail')}>Retail / Jual</button
					>
				</div>
			</div>

			<!-- Grid Produk (Scrollable) -->
			<div class="flex-1 overflow-y-auto p-4 sm:p-6">
				{#if displayItems().length === 0}
					<div
						class="flex h-full flex-col items-center justify-center text-[var(--color-stone)] opacity-50"
					>
						<Package size={64} class="mb-4" />
						<p class="text-lg">Tidak ada barang ditemukan</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
						{#each displayItems() as item (item.id + item.__displayType)}
							<button
								class="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white text-left shadow-sm transition-all hover:border-[var(--color-forest)]/50 hover:shadow-md"
								onclick={() => addToCart(item, item.__displayType)}
							>
								<div class="relative h-32 overflow-hidden bg-[var(--color-sand)]">
									{#if item.image_url}
										<img
											src={item.image_url}
											alt={item.name}
											class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
									{:else}
										<div
											class="absolute inset-0 flex items-center justify-center text-[var(--color-stone)] opacity-30"
										>
											{#if item.__displayType === 'package'}
												<Boxes size={40} />
											{:else}
												<Package size={40} />
											{/if}
										</div>
									{/if}

									<!-- Badge Tipe -->
									<div class="absolute top-2 left-2">
										{#if item.__displayType === 'sewa'}
											<Badge variant="info" class="px-1.5 py-0 text-[10px]">Sewa</Badge>
										{:else if item.__displayType === 'retail'}
											<Badge variant="warning" class="px-1.5 py-0 text-[10px]">Jual</Badge>
										{:else if item.__displayType === 'package'}
											<Badge variant="success" class="px-1.5 py-0 text-[10px]">Paket</Badge>
										{/if}
									</div>
									<!-- Stok -->
									{#if item.__displayType !== 'package'}
										<div
											class="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur"
										>
											{item.stock_available}
										</div>
									{/if}
								</div>
								<div class="flex flex-1 flex-col p-3">
									<h3
										class="mb-1 line-clamp-2 text-sm font-bold text-[var(--color-earth)] transition-colors group-hover:text-[var(--color-forest)]"
									>
										{item.name}
									</h3>
									<div class="mt-auto pt-2">
										{#if item.__displayType === 'sewa'}
											<span class="font-bold text-[var(--color-forest)]"
												>{formatCurrency(item.rental_price_per_day)}<span
													class="text-[10px] font-normal text-[var(--color-stone)]">/siklus</span
												></span
											>
										{:else if item.__displayType === 'retail'}
											<span class="font-bold text-[var(--color-terracotta)]"
												>{formatCurrency(item.sell_price)}</span
											>
										{:else}
											<span class="font-bold text-[var(--color-forest)]"
												>{formatCurrency(item.package_price)}<span
													class="text-[10px] font-normal text-[var(--color-stone)]">/siklus</span
												></span
											>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- BAGIAN KANAN: KERANJANG (35%) -->
		<div
			class="relative z-20 flex h-full w-[35%] flex-col bg-white shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)]"
		>
			<!-- Cart Header -->
			<div
				class="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)]/30 p-4"
			>
				<div class="flex items-center gap-2 text-[var(--color-earth)]">
					<ShoppingCart size={20} />
					<h2 class="font-heading text-lg font-bold">Keranjang</h2>
				</div>
				<Badge variant="neutral" class="bg-[var(--color-sand)]">{cart.length} Item</Badge>
			</div>

			<!-- Cart Items List (Scrollable) -->
			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if cart.length === 0}
					<div
						class="flex h-full flex-col items-center justify-center text-[var(--color-stone)] opacity-50"
					>
						<ShoppingCart size={48} class="mb-3" />
						<p class="text-sm">Keranjang masih kosong</p>
						<p class="mt-1 max-w-[200px] text-center text-[10px]">
							Pilih barang di sebelah kiri atau scan barcode.
						</p>
					</div>
				{:else}
					{#each cart as item, i}
						<div
							class="group relative flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-3"
						>
							<!-- Hapus -->
							<button
								class="absolute top-2 right-2 text-[var(--color-stone)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--color-error)]"
								onclick={() => {
									cart = cart.filter((_, idx) => idx !== i);
								}}
							>
								<Trash2 size={14} />
							</button>

							<div>
								<h4 class="pr-6 text-sm leading-tight font-bold text-[var(--color-earth)]">
									{item.name}
								</h4>
								<div class="mt-1 flex items-center gap-2">
									{#if item.type === 'rental'}
										<span
											class="rounded bg-[var(--color-info)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-info)]"
											>Sewa</span
										>
									{:else if item.type === 'retail'}
										<span
											class="rounded bg-[var(--color-warning)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-warning)]"
											>Jual</span
										>
									{:else}
										<span
											class="rounded bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-success)]"
											>Paket</span
										>
									{/if}
									<span class="text-sm font-semibold text-[var(--color-forest)]"
										>{formatCurrency(item.price)}</span
									>
								</div>
							</div>

							<div class="mt-1 flex items-center justify-between">
								<span class="text-xs font-bold text-[var(--color-earth)]"
									>{formatCurrency(item.price * item.quantity)}</span
								>

								<!-- Qty Controls -->
								<div
									class="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-white"
								>
									<button
										class="px-2 py-1 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)]"
										onclick={() => updateCartQty(i, -1)}
									>
										<Minus size={14} />
									</button>
									<span class="w-8 text-center text-sm font-bold text-[var(--color-earth)]"
										>{item.quantity}</span
									>
									<button
										class="px-2 py-1 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)]"
										onclick={() => updateCartQty(i, 1)}
									>
										<Plus size={14} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Cart Footer / Summary -->
			<div
				class="z-10 flex flex-col gap-4 border-t border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]"
			>
				{#if cartHasRental}
					<div
						class="flex items-center gap-2 rounded-lg bg-[var(--color-info)]/10 p-2 text-xs font-medium text-[var(--color-info)]"
					>
						<CalendarClock size={16} class="shrink-0" />
						<span
							>Keranjang ini memiliki item sewa. Tanggal booking akan ditentukan di tahap
							selanjutnya.</span
						>
					</div>
				{/if}

				<div class="flex items-end justify-between">
					<span class="text-sm font-medium text-[var(--color-stone)]">Subtotal</span>
					<span class="font-heading text-2xl font-bold text-[var(--color-forest)]"
						>{formatCurrency(cartTotal)}</span
					>
				</div>

				<Button class="w-full py-4 text-base" disabled={cart.length === 0} onclick={checkout}>
					<CreditCard size={20} class="mr-2" /> Lanjut ke Pembayaran
				</Button>
			</div>
		</div>
	</div>
{/if}
