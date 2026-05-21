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
		Plus
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();
	let { items, packages, categories } = data;

	// --- BARCODE SCANNER LOGIC ---
	let barcodeBuffer = '';
	let barcodeTimeout;

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

	function processBarcode(code) {
		const foundItem = items.find(i => i.barcode === code);
		if (foundItem) {
			addToCart(foundItem, foundItem.category.type);
		}
	}

	// --- STATE MANAGEMENT ---
	let activeTab = $state('all'); // 'all', 'sewa', 'retail', 'package'
	let searchQuery = $state('');

	// Keranjang: array of { id, type, name, price, quantity, maxQty, rawData }
	// type: 'retail', 'rental', 'package'
	let cart = $state([]);

	// --- DERIVED VALUES ---
	let displayItems = $derived(() => {
		let list = [];
		if (activeTab === 'package' || activeTab === 'all') {
			packages.forEach(p => list.push({ ...p, __displayType: 'package' }));
		}
		if (activeTab !== 'package') {
			items.forEach(i => {
				if (activeTab === 'all' || activeTab === i.category.type) {
					list.push({ ...i, __displayType: i.category.type });
				}
			});
		}

		// Filter pencarian
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(item => 
				item.name.toLowerCase().includes(q) || 
				(item.barcode && item.barcode.toLowerCase().includes(q))
			);
		}
		return list;
	});

	let cartHasRental = $derived(cart.some(c => c.type === 'rental' || c.type === 'package'));
	let cartTotal = $derived(cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0));
	
	// --- ACTIONS ---
	function addToCart(item, type) {
		const id = item.id;
		const existingIdx = cart.findIndex(c => c.id === id && c.type === type);
		
		let price = type === 'retail' ? item.sell_price : (type === 'package' ? item.package_price : item.rental_price_per_day);
		let maxQty = type === 'package' ? 999 : item.stock_available; // Asumsi paket tidak limitasi realtime UI dulu
		
		if (maxQty <= 0) {
			alert('Stok barang habis!');
			return;
		}

		if (existingIdx >= 0) {
			if (cart[existingIdx].quantity < maxQty) {
				cart[existingIdx].quantity += 1;
			}
		} else {
			cart = [...cart, {
				id: item.id,
				type: type, // 'retail', 'rental', 'package'
				name: item.name,
				price: price,
				quantity: 1,
				maxQty: maxQty,
				rawData: item
			}];
		}
	}

	function updateCartQty(index, change) {
		const item = cart[index];
		const newQty = item.quantity + change;
		if (newQty > 0 && newQty <= item.maxQty) {
			cart[index].quantity = newQty;
		} else if (newQty === 0) {
			cart = cart.filter((_, i) => i !== index);
		}
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
	}

	function checkout() {
		if (cart.length === 0) return;
		// Simpan keranjang di sessionStorage agar bisa diproses di halaman checkout
		sessionStorage.setItem('botani_cart', JSON.stringify(cart));
		window.location.href = '/pos/checkout';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="h-[calc(100vh-4rem)] -mt-6 -mx-8 flex overflow-hidden">
	
	<!-- BAGIAN KIRI: KATALOG BARANG (70%) -->
	<div class="w-[65%] flex flex-col bg-[var(--color-sand-lightest)] border-r border-[var(--color-border)] relative">
		
		<!-- Top Bar Katalog -->
		<div class="bg-white p-4 border-b border-[var(--color-border)] flex flex-col gap-4 z-10">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Point of Sales</h1>
				<div class="relative w-64">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
						<Search size={18} />
					</div>
					<input 
						type="text" 
						bind:value={searchQuery} 
						placeholder="Cari atau scan barcode..." 
						class="w-full pl-10 pr-4 py-2 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
					>
				</div>
			</div>

			<!-- Filter Tabs -->
			<div class="flex gap-2">
				<button class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {activeTab === 'all' ? 'bg-[var(--color-earth)] text-white' : 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}" onclick={() => activeTab = 'all'}>Semua</button>
				<button class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {activeTab === 'sewa' ? 'bg-[var(--color-earth)] text-white' : 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}" onclick={() => activeTab = 'sewa'}>Sewa Alat</button>
				<button class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {activeTab === 'package' ? 'bg-[var(--color-earth)] text-white' : 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}" onclick={() => activeTab = 'package'}>Paket Bundling</button>
				<button class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {activeTab === 'retail' ? 'bg-[var(--color-earth)] text-white' : 'bg-[var(--color-sand)] text-[var(--color-stone)] hover:text-[var(--color-earth)]'}" onclick={() => activeTab = 'retail'}>Retail / Jual</button>
			</div>
		</div>

		<!-- Grid Produk (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-4 sm:p-6">
			{#if displayItems().length === 0}
				<div class="h-full flex flex-col items-center justify-center text-[var(--color-stone)] opacity-50">
					<Package size={64} class="mb-4" />
					<p class="text-lg">Tidak ada barang ditemukan</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each displayItems() as item (item.id + item.__displayType)}
						<button 
							class="text-left bg-white rounded-2xl border border-[var(--color-border-light)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--color-forest)]/50 transition-all group flex flex-col h-full"
							onclick={() => addToCart(item, item.__displayType)}
						>
							<div class="h-32 bg-[var(--color-sand)] relative overflow-hidden">
								{#if item.image_url}
									<img src={item.image_url} alt={item.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
								{:else}
									<div class="absolute inset-0 flex items-center justify-center text-[var(--color-stone)] opacity-30">
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
										<Badge variant="info" class="text-[10px] px-1.5 py-0">Sewa</Badge>
									{:else if item.__displayType === 'retail'}
										<Badge variant="warning" class="text-[10px] px-1.5 py-0">Jual</Badge>
									{:else if item.__displayType === 'package'}
										<Badge variant="success" class="text-[10px] px-1.5 py-0">Paket</Badge>
									{/if}
								</div>
								<!-- Stok -->
								{#if item.__displayType !== 'package'}
									<div class="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
										{item.stock_available}
									</div>
								{/if}
							</div>
							<div class="p-3 flex-1 flex flex-col">
								<h3 class="font-bold text-[var(--color-earth)] text-sm line-clamp-2 mb-1 group-hover:text-[var(--color-forest)] transition-colors">{item.name}</h3>
								<div class="mt-auto pt-2">
									{#if item.__displayType === 'sewa'}
										<span class="font-bold text-[var(--color-forest)]">{formatCurrency(item.rental_price_per_day)}<span class="text-[10px] text-[var(--color-stone)] font-normal">/hr</span></span>
									{:else if item.__displayType === 'retail'}
										<span class="font-bold text-[var(--color-terracotta)]">{formatCurrency(item.sell_price)}</span>
									{:else}
										<span class="font-bold text-[var(--color-forest)]">{formatCurrency(item.package_price)}<span class="text-[10px] text-[var(--color-stone)] font-normal">/hr</span></span>
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
	<div class="w-[35%] bg-white flex flex-col h-full shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] relative z-20">
		<!-- Cart Header -->
		<div class="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-sand-lightest)]/30">
			<div class="flex items-center gap-2 text-[var(--color-earth)]">
				<ShoppingCart size={20} />
				<h2 class="font-bold font-heading text-lg">Keranjang</h2>
			</div>
			<Badge variant="default" class="bg-[var(--color-sand)]">{cart.length} Item</Badge>
		</div>

		<!-- Cart Items List (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-4 space-y-3">
			{#if cart.length === 0}
				<div class="h-full flex flex-col items-center justify-center text-[var(--color-stone)] opacity-50">
					<ShoppingCart size={48} class="mb-3" />
					<p class="text-sm">Keranjang masih kosong</p>
					<p class="text-[10px] mt-1 text-center max-w-[200px]">Pilih barang di sebelah kiri atau scan barcode.</p>
				</div>
			{:else}
				{#each cart as item, i}
					<div class="bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl p-3 flex flex-col gap-2 relative group">
						<!-- Hapus -->
						<button 
							class="absolute top-2 right-2 text-[var(--color-stone)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
							onclick={() => { cart = cart.filter((_, idx) => idx !== i) }}
						>
							<Trash2 size={14} />
						</button>
						
						<div>
							<h4 class="font-bold text-[var(--color-earth)] text-sm pr-6 leading-tight">{item.name}</h4>
							<div class="flex items-center gap-2 mt-1">
								{#if item.type === 'sewa'}
									<span class="text-[10px] bg-[var(--color-info)]/10 text-[var(--color-info)] px-1.5 py-0.5 rounded font-medium">Sewa</span>
								{:else if item.type === 'retail'}
									<span class="text-[10px] bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-1.5 py-0.5 rounded font-medium">Jual</span>
								{:else}
									<span class="text-[10px] bg-[var(--color-success)]/10 text-[var(--color-success)] px-1.5 py-0.5 rounded font-medium">Paket</span>
								{/if}
								<span class="font-semibold text-[var(--color-forest)] text-sm">{formatCurrency(item.price)}</span>
							</div>
						</div>

						<div class="flex items-center justify-between mt-1">
							<span class="text-xs font-bold text-[var(--color-earth)]">{formatCurrency(item.price * item.quantity)}</span>
							
							<!-- Qty Controls -->
							<div class="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-white">
								<button class="px-2 py-1 hover:bg-[var(--color-sand)] text-[var(--color-stone)] transition-colors" onclick={() => updateCartQty(i, -1)}>
									<Minus size={14} />
								</button>
								<span class="w-8 text-center text-sm font-bold text-[var(--color-earth)]">{item.quantity}</span>
								<button class="px-2 py-1 hover:bg-[var(--color-sand)] text-[var(--color-stone)] transition-colors" onclick={() => updateCartQty(i, 1)}>
									<Plus size={14} />
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Cart Footer / Summary -->
		<div class="border-t border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4 flex flex-col gap-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
			{#if cartHasRental}
				<div class="flex items-center gap-2 text-xs text-[var(--color-info)] bg-[var(--color-info)]/10 p-2 rounded-lg font-medium">
					<CalendarClock size={16} class="shrink-0" />
					<span>Keranjang ini memiliki item sewa. Tanggal booking akan ditentukan di tahap selanjutnya.</span>
				</div>
			{/if}
			
			<div class="flex justify-between items-end">
				<span class="text-[var(--color-stone)] text-sm font-medium">Subtotal</span>
				<span class="text-2xl font-bold font-heading text-[var(--color-forest)]">{formatCurrency(cartTotal)}</span>
			</div>
			
			<Button 
				class="w-full py-4 text-base" 
				disabled={cart.length === 0}
				onclick={checkout}
			>
				<CreditCard size={20} class="mr-2" /> Lanjut ke Pembayaran
			</Button>
		</div>
	</div>
</div>
