<script>
	import { enhance } from '$app/forms';
	import { 
		ArrowLeft, 
		Save, 
		Plus, 
		Minus, 
		Search, 
		Camera, 
		PiggyBank, 
		Tent, 
		Bed, 
		X, 
		Package 
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { data, form } = $props();
	let availableItems = $derived(data.availableItems);

	let loading = $state(false);
	
	// State for form inputs and selected items in the package
	let packageName = $state('Paket Gunung Premium');
	let packageDescription = $state('');
	let packagePriceInput = $state('200000');
	
	/** @type {any[]} */
	let selectedItems = $state([]);
	let searchQuery = $state('');
	
	// Available items filtered by search query and excluding already selected items
	let filteredAvailable = $derived(
		availableItems.filter((/** @type {any} */ item) => {
			const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
			const notSelected = !selectedItems.find((/** @type {any} */ s) => s.id === item.id);
			return matchesSearch && notSelected;
		})
	);

	// Computations
	let packagePrice = $derived(Number(packagePriceInput) || 0);
	let totalPriceNormal = $derived(
		selectedItems.reduce((/** @type {number} */ acc, /** @type {any} */ curr) => acc + (curr.rental_price_per_day * curr.quantity), 0)
	);
	let savingAmount = $derived(totalPriceNormal - packagePrice);
	let savingPercentage = $derived(
		totalPriceNormal > 0 && savingAmount > 0 
			? Math.round((savingAmount / totalPriceNormal) * 100) 
			: 0
	);

	/** @param {any} item */
	function addItem(item) {
		selectedItems = [...selectedItems, { ...item, quantity: 1 }];
	}

	/** @param {any} id */
	function removeItem(id) {
		selectedItems = selectedItems.filter((/** @type {any} */ s) => s.id !== id);
	}

	/**
	 * @param {any} id
	 * @param {number} qty
	 */
	function updateQuantity(id, qty) {
		if (qty < 1) return;
		selectedItems = selectedItems.map((/** @type {any} */ s) => s.id === id ? { ...s, quantity: qty } : s);
	}

	/** @type {string | null} */
	let imagePreview = $state(null);
	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleImageChange(e) {
		const file = e.currentTarget.files?.[0];
		if (file) {
			imagePreview = URL.createObjectURL(file);
		} else {
			imagePreview = null;
		}
	}

	/** @param {string} name */
	function getItemIcon(name) {
		const lower = name.toLowerCase();
		if (lower.includes('tenda')) return Tent;
		if (lower.includes('sleeping bag') || lower.includes('polar') || lower.includes('kasur') || lower.includes('matras') || lower.includes('bed')) return Bed;
		return Package;
	}
</script>

<div class="space-y-6 pb-12 animate-fade-in">
	<!-- Top Breadcrumb / Nav -->
	<div class="flex items-center justify-between border-b border-[var(--color-border-light)] pb-4">
		<div class="flex items-center gap-3">
			<a href="/packages" class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-lg transition-colors">
				<ArrowLeft size={20} />
			</a>
			<nav class="flex text-sm text-[var(--color-stone)] font-medium">
				<a href="/inventory" class="hover:text-[var(--color-earth)]">Gudang</a>
				<span class="mx-2 text-[var(--color-stone)]/50">/</span>
				<a href="/packages" class="hover:text-[var(--color-earth)]">Paket Bundling</a>
				<span class="mx-2 text-[var(--color-stone)]/50">/</span>
				<span class="text-[var(--color-earth)] font-bold">Buat Paket Baru</span>
			</nav>
		</div>
	</div>

	<!-- Title Header -->
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Buat Paket Bundling Baru</h2>
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium text-sm">
			{form.error}
		</div>
	{/if}

	<form 
		method="POST" 
		enctype="multipart/form-data"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="space-y-6"
	>
		<!-- Hidden input for selected items JSON -->
		<input type="hidden" name="items_json" value={JSON.stringify(selectedItems.map(s => ({ id: s.id, quantity: s.quantity })))} />

		<div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
			<!-- LEFT COLUMN (40% / 4-cols) -->
			<div class="lg:col-span-4 flex flex-col gap-6">
				<section class="bg-white p-6 rounded-xl border border-[var(--color-border-light)] shadow-sm space-y-5">
					<h3 class="font-heading font-bold text-[var(--color-forest)] border-b border-[var(--color-border-light)] pb-3 mb-4">Detail Paket</h3>
					
					<!-- Image Upload -->
					<div>
						<label class="block text-[13px] font-semibold text-[var(--color-stone)] mb-2" for="package-image">Foto Paket</label>
						<div class="relative border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-cream)] flex flex-col items-center justify-center p-8 hover:bg-[var(--color-sand)]/20 transition-colors cursor-pointer group min-h-[200px]">
							{#if imagePreview}
								<img src={imagePreview} alt="Preview" class="absolute inset-0 w-full h-full object-cover rounded-xl" />
								<div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
									<Camera class="text-white mb-2" size={28} />
									<span class="text-white font-medium text-xs">Ubah Foto</span>
								</div>
							{:else}
								<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[var(--color-stone)] group-hover:text-[var(--color-forest)] mb-3 transition-colors">
									<Camera size={24} />
								</div>
								<p class="text-sm font-bold text-[var(--color-stone)] group-hover:text-[var(--color-forest)] transition-colors">Upload Foto Produk</p>
								<p class="text-[11px] text-[var(--color-stone)]/70 mt-1">Drag & drop atau klik untuk browse</p>
							{/if}
							<input 
								id="package-image"
								type="file" 
								name="image" 
								accept="image/png, image/jpeg, image/webp" 
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								onchange={handleImageChange}
							>
						</div>
					</div>

					<!-- Inputs -->
					<div class="space-y-4">
						<div>
							<label class="block text-[13px] font-semibold text-[var(--color-earth)] mb-1.5" for="name">Nama Paket <span class="text-[var(--color-error)]">*</span></label>
							<input 
								id="name"
								type="text" 
								name="name" 
								bind:value={packageName}
								required
								class="w-full h-11 px-4 bg-white border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent text-sm font-medium outline-none transition-all"
							>
						</div>
						<div>
							<label class="block text-[13px] font-semibold text-[var(--color-earth)] mb-1.5" for="description">Deskripsi</label>
							<textarea 
								id="description"
								name="description" 
								bind:value={packageDescription}
								placeholder="Contoh: Paket lengkap untuk pendakian gunung 4 orang..."
								rows="3"
								class="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent text-sm font-medium outline-none transition-all resize-none"
							></textarea>
						</div>
						<div>
							<label class="block text-[13px] font-semibold text-[var(--color-earth)] mb-1.5" for="package_price">Harga Paket <span class="text-[var(--color-error)]">*</span></label>
							<div class="relative">
								<span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-[var(--color-stone)]">Rp</span>
								<input 
									id="package_price"
									type="text" 
									name="package_price" 
									bind:value={packagePriceInput}
									required
									class="w-full h-11 pl-11 pr-4 bg-white border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent text-sm font-bold font-mono outline-none transition-all"
								>
							</div>
						</div>
					</div>

					<!-- Comparison Card -->
					<div class="bg-[var(--color-sand)] p-5 rounded-xl border border-[var(--color-border)] relative overflow-hidden">
						<div class="absolute -right-4 -top-4 opacity-10 text-[var(--color-stone)]">
							<PiggyBank size={80} />
						</div>
						<div class="relative z-10 space-y-2">
							<div class="flex justify-between items-start">
								<p class="text-xs font-semibold text-[var(--color-stone)] uppercase tracking-wider">Perbandingan Harga</p>
								{#if savingPercentage > 0}
									<span class="px-2.5 py-0.5 bg-[var(--color-forest)] text-white text-[10px] font-bold rounded-full shadow-sm">
										HEMAT {savingPercentage}%
									</span>
								{/if}
							</div>
							<div>
								<p class="text-xs text-[var(--color-stone)] line-through font-mono">
									{formatCurrency(totalPriceNormal)}
								</p>
								<p class="text-xl font-bold text-[var(--color-forest)] font-mono">
									{formatCurrency(packagePrice)}
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- RIGHT COLUMN (60% / 6-cols) -->
			<div class="lg:col-span-6 flex flex-col gap-6">
				<section class="bg-white rounded-xl border border-[var(--color-border-light)] shadow-sm overflow-hidden flex flex-col">
					<!-- Search Header -->
					<div class="p-6 border-b border-[var(--color-border-light)] bg-white">
						<h3 class="font-heading font-bold text-[var(--color-forest)] mb-4">Pilih Barang dalam Paket</h3>
						<div class="relative">
							<Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
							<input 
								type="text" 
								placeholder="Cari barang sewa..." 
								bind:value={searchQuery}
								class="w-full h-12 pl-12 pr-4 bg-[var(--color-cream)]/50 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent text-sm outline-none transition-all"
							>
						</div>
					</div>

					<div class="flex-grow flex flex-col min-h-[400px]">
						<!-- Available Items -->
						<div class="p-6">
							<h4 class="text-[11px] font-bold text-[var(--color-stone)] uppercase tracking-widest mb-4">Barang Tersedia</h4>
							{#if filteredAvailable.length === 0}
								<p class="text-sm text-[var(--color-stone)] italic text-center py-4 bg-[var(--color-cream)]/30 rounded-xl">
									Tidak ada barang tersedia yang cocok dengan pencarian.
								</p>
							{:else}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto custom-scrollbar p-1">
									{#each filteredAvailable as item (item.id)}
										{@const IconComp = getItemIcon(item.name)}
										<div class="flex items-center gap-3 p-3 bg-white border border-[var(--color-border-light)] rounded-xl hover:border-[var(--color-sage)] hover:bg-[var(--color-cream)]/30 transition-all group">
											<div class="w-10 h-10 bg-[var(--color-sand)]/50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 text-[var(--color-forest)]">
												<IconComp size={20} />
											</div>
											<div class="flex-1 min-w-0">
												<p class="text-xs font-bold text-[var(--color-earth)] truncate">{item.name}</p>
												<p class="text-[11px] font-bold text-[var(--color-forest)] font-mono">{formatCurrency(item.rental_price_per_day)}</p>
											</div>
											<button 
												type="button"
												onclick={() => addItem(item)}
												class="px-2.5 py-1 border border-[var(--color-forest)] text-[var(--color-forest)] rounded-lg text-xs font-bold hover:bg-[var(--color-forest)] hover:text-white transition-all"
											>
												+ Tambah
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Selected Items -->
						<div class="px-6 py-5 bg-[var(--color-cream)] border-t border-[var(--color-border-light)] flex-grow flex flex-col justify-between">
							<div>
								<div class="flex items-center justify-between mb-4">
									<h4 class="text-[11px] font-bold text-[var(--color-stone)] uppercase tracking-widest">
										Barang dalam Paket ({selectedItems.length})
									</h4>
									<span class="text-xs font-bold text-[var(--color-forest)]">
										Total Harga Satuan: {formatCurrency(totalPriceNormal)}
									</span>
								</div>

								{#if selectedItems.length === 0}
									<div class="text-center py-12 text-[var(--color-stone)] border border-dashed border-[var(--color-border)] rounded-xl bg-white/50">
										<Package class="mx-auto mb-2 opacity-30" size={32} />
										<p class="text-xs font-medium">Belum ada barang ditambahkan ke paket</p>
									</div>
								{:else}
									<div class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
										{#each selectedItems as item (item.id)}
											{@const IconComp = getItemIcon(item.name)}
											<div class="flex items-center gap-4 p-4 bg-white border border-[var(--color-border-light)] rounded-xl shadow-sm">
												<div class="w-12 h-12 bg-[var(--color-sand)]/30 rounded-lg flex items-center justify-center shrink-0 text-[var(--color-forest)]">
													<IconComp size={22} />
												</div>
												<div class="flex-1 min-w-0">
													<p class="text-xs font-bold text-[var(--color-earth)] truncate">{item.name}</p>
													<p class="text-[11px] font-bold text-[var(--color-forest)] font-mono">
														{formatCurrency(item.rental_price_per_day)} 
														{#if item.quantity > 1}
															<span class="text-[10px] text-[var(--color-stone)] font-normal font-sans">({item.quantity}x)</span>
														{/if}
													</p>
												</div>
												
												<!-- Quantity control adjusters -->
												<div class="flex items-center bg-[var(--color-sand)]/40 p-0.5 rounded-lg border border-[var(--color-border-light)]">
													<button 
														type="button"
														onclick={() => updateQuantity(item.id, item.quantity - 1)}
														class="w-7 h-7 flex items-center justify-center text-[var(--color-stone)] hover:bg-white rounded-md transition-all"
													>
														<Minus size={14} />
													</button>
													<span class="w-8 text-center font-bold font-mono text-xs">{item.quantity}</span>
													<button 
														type="button"
														onclick={() => updateQuantity(item.id, item.quantity + 1)}
														class="w-7 h-7 flex items-center justify-center text-[var(--color-stone)] hover:bg-white rounded-md transition-all"
													>
														<Plus size={14} />
													</button>
												</div>

												<!-- Total line price -->
												<div class="w-20 text-right">
													<p class="text-xs font-bold font-mono text-[var(--color-earth)]">
														{formatCurrency(item.rental_price_per_day * item.quantity)}
													</p>
												</div>

												<!-- Remove button -->
												<button 
													type="button"
													onclick={() => removeItem(item.id)}
													class="text-[var(--color-stone)] hover:text-[var(--color-error)] transition-colors"
												>
													<X size={18} />
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>

		<!-- Footer Actions -->
		<div class="flex items-center justify-end gap-3 pt-6 border-t border-[var(--color-border-light)]">
			<a href="/packages">
				<Button type="button" variant="outline" size="lg" class="h-11 px-8 rounded-lg">
					Batal
				</Button>
			</a>
			
			<Button 
				type="submit" 
				disabled={loading || selectedItems.length === 0} 
				size="lg" 
				class="h-11 px-10 rounded-lg bg-[var(--color-forest)] hover:bg-[var(--color-forest)]/90 text-white font-bold flex items-center gap-2 shadow-lg shadow-[var(--color-forest)]/10"
			>
				{#if loading}
					Menyimpan...
				{:else}
					<Save size={16} /> Simpan Paket
				{/if}
			</Button>
		</div>
	</form>
</div>
