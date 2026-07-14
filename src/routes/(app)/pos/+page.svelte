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
		Camera,
		Info
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import { isMobileApp, scanBarcodeFromMobile } from '$lib/utils/mobileBridge';
	import { getOptimizedImageUrl } from '$lib/utils/image';

	let { data } = $props();
	let items = $derived(data.items);
	let packages = $derived(data.packages);
	let categories = $derived(data.categories);

	let isMobile = $state(false);

	/** @type {any} */
	let selectedDetailPackage = $state(null);
	let isDetailModalOpen = $state(false);

	/** @param {any} pkg */
	function showPackageDetail(pkg) {
		selectedDetailPackage = pkg;
		isDetailModalOpen = true;
	}

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
					<Input bind:value={searchQuery} placeholder="Cari item..." class="w-64">
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
									aria-label="Pindai barcode via kamera"
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
							: 'bg-[var(--color-sand)] text-[var(--color-earth)]/75 hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'all')}>Semua</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'sewa'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-earth)]/75 hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'sewa')}>Sewa Alat</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'package'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-earth)]/75 hover:text-[var(--color-earth)]'}"
						onclick={() => (activeTab = 'package')}>Paket Bundling</button
					>
					<button
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'retail'
							? 'bg-[var(--color-earth)] text-white'
							: 'bg-[var(--color-sand)] text-[var(--color-earth)]/75 hover:text-[var(--color-earth)]'}"
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
						{#each displayItems() as item, i (item.id + item.__displayType)}
							<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
							<div
								class="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white text-left shadow-sm transition-all hover:border-[var(--color-forest)]/50 hover:shadow-md cursor-pointer"
								onclick={() => addToCart(item, item.__displayType)}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										addToCart(item, item.__displayType);
									}
								}}
							>
								<div class="relative h-32 overflow-hidden bg-[var(--color-sand)]">
									{#if item.image_url}
										<img
											src={getOptimizedImageUrl(item.image_url, { width: 300 })}
											alt={item.name}
											class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
											loading={i < 4 ? 'eager' : 'lazy'}
											fetchpriority={i < 4 ? 'high' : 'low'}
											onerror={(e) => {
												const img = /** @type {HTMLImageElement} */ (e.currentTarget);
												if (img.src !== item.image_url) {
													img.src = item.image_url;
												}
											}}
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
									{:else}
										<button
											type="button"
											class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[var(--color-stone)] hover:bg-white hover:text-[var(--color-forest)] transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
											onclick={(e) => {
												e.stopPropagation();
												showPackageDetail(item);
											}}
											title="Lihat isi paket"
										>
											<Info size={13} />
										</button>
									{/if}
								</div>
								<div class="flex flex-1 flex-col p-3">
									<span
										class="mb-1 line-clamp-2 text-sm font-bold text-[var(--color-earth)] transition-colors group-hover:text-[var(--color-forest)]"
									>
										{item.name}
									</span>
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
							</div>
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
						class="flex h-full flex-col items-center justify-center"
					>
						<ShoppingCart size={48} class="mb-3 text-[var(--color-earth)]/40" />
						<p class="text-sm font-bold text-[var(--color-earth)]/80">Keranjang masih kosong</p>
						<p class="mt-1 max-w-[200px] text-center text-[10px] text-[var(--color-earth)]/70">
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
								aria-label="Hapus {item.name} dari keranjang"
							>
								<Trash2 size={14} />
							</button>

							<div>
								<span class="pr-6 text-sm leading-tight font-bold text-[var(--color-earth)] block">
									{item.name}
								</span>
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

<Modal bind:open={isDetailModalOpen} title="Detail Isi Paket">
	{#snippet children()}
		{#if selectedDetailPackage}
			<div class="space-y-4 py-2">
				<div class="flex items-center gap-3 border-b border-[var(--color-border-light)] pb-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-forest)]/10 text-[var(--color-forest)]">
						<Boxes size={24} />
					</div>
					<div>
						<h4 class="font-heading text-lg font-bold text-[var(--color-earth)]">
							{selectedDetailPackage.name}
						</h4>
						<p class="text-xs text-[var(--color-stone)]">
							Harga Sewa: <span class="font-bold text-[var(--color-forest)]">{formatCurrency(selectedDetailPackage.package_price)}</span>/siklus
						</p>
					</div>
				</div>
				
				<div class="space-y-2">
					<h5 class="text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">Daftar Barang di Dalam Paket:</h5>
					<div class="divide-y divide-[var(--color-border-light)] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-sand-lightest)]/30">
						{#if selectedDetailPackage.resolved_items && selectedDetailPackage.resolved_items.length > 0}
							{#each selectedDetailPackage.resolved_items as pi}
								<div class="flex items-center justify-between px-4 py-3">
									<span class="font-medium text-[var(--color-earth)]">{pi.name}</span>
									<Badge variant="info" class="font-mono font-bold text-xs">x{pi.quantity}</Badge>
								</div>
							{/each}
						{:else}
							<div class="px-4 py-4 text-center text-sm text-[var(--color-stone)]">
								Tidak ada rincian barang untuk paket ini.
							</div>
						{/if}
					</div>
				</div>
				
				{#if selectedDetailPackage.description}
					<div class="space-y-1 pt-2">
						<h5 class="text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">Keterangan:</h5>
						<p class="text-sm leading-relaxed text-[var(--color-earth)]">
							{selectedDetailPackage.description}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<Button
			variant="ghost"
			onclick={() => {
				isDetailModalOpen = false;
			}}
		>
			Tutup
		</Button>
		<Button
			variant="primary"
			onclick={() => {
				if (selectedDetailPackage) {
					addToCart(selectedDetailPackage, 'package');
					isDetailModalOpen = false;
				}
			}}
		>
			Tambahkan ke Keranjang
		</Button>
	{/snippet}
</Modal>
