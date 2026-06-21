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
		selectedItems.reduce(
			(/** @type {number} */ acc, /** @type {any} */ curr) =>
				acc + curr.rental_price_per_day * curr.quantity,
			0
		)
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
		selectedItems = selectedItems.map((/** @type {any} */ s) =>
			s.id === id ? { ...s, quantity: qty } : s
		);
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
		if (
			lower.includes('sleeping bag') ||
			lower.includes('polar') ||
			lower.includes('kasur') ||
			lower.includes('matras') ||
			lower.includes('bed')
		)
			return Bed;
		return Package;
	}
</script>

<div class="animate-fade-in space-y-6 pb-12">
	<!-- Top Breadcrumb / Nav -->
	<div class="flex items-center justify-between border-b border-[var(--color-border-light)] pb-4">
		<div class="flex items-center gap-3">
			<a
				href="/packages"
				class="rounded-lg p-2 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)]"
			>
				<ArrowLeft size={20} />
			</a>
			<nav class="flex text-sm font-medium text-[var(--color-stone)]">
				<a href="/inventory" class="hover:text-[var(--color-earth)]">Gudang</a>
				<span class="mx-2 text-[var(--color-stone)]/50">/</span>
				<a href="/packages" class="hover:text-[var(--color-earth)]">Paket Bundling</a>
				<span class="mx-2 text-[var(--color-stone)]/50">/</span>
				<span class="font-bold text-[var(--color-earth)]">Buat Paket Baru</span>
			</nav>
		</div>
	</div>

	<!-- Title Header -->
	<div class="flex items-center justify-between">
		<h2 class="font-heading text-2xl font-bold text-[var(--color-earth)]">
			Buat Paket Bundling Baru
		</h2>
	</div>

	{#if form?.error}
		<div
			class="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm font-medium text-[var(--color-error)]"
		>
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
		<input
			type="hidden"
			name="items_json"
			value={JSON.stringify(selectedItems.map((s) => ({ id: s.id, quantity: s.quantity })))}
		/>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-10">
			<!-- LEFT COLUMN (40% / 4-cols) -->
			<div class="flex flex-col gap-6 lg:col-span-4">
				<section
					class="space-y-5 rounded-xl border border-[var(--color-border-light)] bg-white p-6 shadow-sm"
				>
					<h3
						class="mb-4 border-b border-[var(--color-border-light)] pb-3 font-heading font-bold text-[var(--color-forest)]"
					>
						Detail Paket
					</h3>

					<!-- Image Upload -->
					<div>
						<label
							class="mb-2 block text-[13px] font-semibold text-[var(--color-stone)]"
							for="package-image">Foto Paket</label
						>
						<div
							class="group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-cream)] p-8 transition-colors hover:bg-[var(--color-sand)]/20"
						>
							{#if imagePreview}
								<img
									src={imagePreview}
									alt="Preview"
									class="absolute inset-0 h-full w-full rounded-xl object-cover"
								/>
								<div
									class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<Camera class="mb-2 text-white" size={28} />
									<span class="text-xs font-medium text-white">Ubah Foto</span>
								</div>
							{:else}
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-stone)] shadow-sm transition-colors group-hover:text-[var(--color-forest)]"
								>
									<Camera size={24} />
								</div>
								<p
									class="text-sm font-bold text-[var(--color-stone)] transition-colors group-hover:text-[var(--color-forest)]"
								>
									Upload Foto Produk
								</p>
								<p class="mt-1 text-[11px] text-[var(--color-stone)]/70">
									Drag & drop atau klik untuk browse
								</p>
							{/if}
							<input
								id="package-image"
								type="file"
								name="image"
								accept="image/png, image/jpeg, image/webp"
								class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
								onchange={handleImageChange}
							/>
						</div>
					</div>

					<!-- Inputs -->
					<div class="space-y-4">
						<div>
							<label
								class="mb-1.5 block text-[13px] font-semibold text-[var(--color-earth)]"
								for="name">Nama Paket <span class="text-[var(--color-error)]">*</span></label
							>
							<input
								id="name"
								type="text"
								name="name"
								bind:value={packageName}
								required
								class="h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-medium transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-sage)]"
							/>
						</div>
						<div>
							<label
								class="mb-1.5 block text-[13px] font-semibold text-[var(--color-earth)]"
								for="description">Deskripsi</label
							>
							<textarea
								id="description"
								name="description"
								bind:value={packageDescription}
								placeholder="Contoh: Paket lengkap untuk pendakian gunung 4 orang..."
								rows="3"
								class="w-full resize-none rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-sage)]"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 block text-[13px] font-semibold text-[var(--color-earth)]"
								for="package_price"
								>Harga Paket <span class="text-[var(--color-error)]">*</span></label
							>
							<div class="relative">
								<span
									class="absolute top-1/2 left-4 -translate-y-1/2 font-mono font-bold text-[var(--color-stone)]"
									>Rp</span
								>
								<input
									id="package_price"
									type="text"
									name="package_price"
									bind:value={packagePriceInput}
									oninput={(e) => {
										let val = e.currentTarget.value.replace(/[^0-9]/g, '');
										if (val.length > 1 && val.startsWith('0')) {
											val = val.replace(/^0+/, '');
											if (val === '') val = '0';
										}
										packagePriceInput = val;
										e.currentTarget.value = val;
									}}
									required
									class="h-11 w-full rounded-lg border border-[var(--color-border)] bg-white pr-4 pl-11 font-mono text-sm font-bold transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-sage)]"
								/>
							</div>
						</div>
					</div>

					<!-- Comparison Card -->
					<div
						class="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-sand)] p-5"
					>
						<div class="absolute -top-4 -right-4 text-[var(--color-stone)] opacity-10">
							<PiggyBank size={80} />
						</div>
						<div class="relative z-10 space-y-2">
							<div class="flex items-start justify-between">
								<p class="text-xs font-semibold tracking-wider text-[var(--color-stone)] uppercase">
									Perbandingan Harga
								</p>
								{#if savingPercentage > 0}
									<span
										class="rounded-full bg-[var(--color-forest)] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
									>
										HEMAT {savingPercentage}%
									</span>
								{/if}
							</div>
							<div>
								<p class="font-mono text-xs text-[var(--color-stone)] line-through">
									{formatCurrency(totalPriceNormal)}
								</p>
								<p class="font-mono text-xl font-bold text-[var(--color-forest)]">
									{formatCurrency(packagePrice)}
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>

			<!-- RIGHT COLUMN (60% / 6-cols) -->
			<div class="flex flex-col gap-6 lg:col-span-6">
				<section
					class="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border-light)] bg-white shadow-sm"
				>
					<!-- Search Header -->
					<div class="border-b border-[var(--color-border-light)] bg-white p-6">
						<h3 class="mb-4 font-heading font-bold text-[var(--color-forest)]">
							Pilih Barang dalam Paket
						</h3>
						<div class="relative">
							<Search
								size={18}
								class="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-stone)]"
							/>
							<input
								type="text"
								placeholder="Cari barang sewa..."
								bind:value={searchQuery}
								class="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)]/50 pr-4 pl-12 text-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-sage)]"
							/>
						</div>
					</div>

					<div class="flex min-h-[400px] flex-grow flex-col">
						<!-- Available Items -->
						<div class="p-6">
							<h4
								class="mb-4 text-[11px] font-bold tracking-widest text-[var(--color-stone)] uppercase"
							>
								Barang Tersedia
							</h4>
							{#if filteredAvailable.length === 0}
								<p
									class="rounded-xl bg-[var(--color-cream)]/30 py-4 text-center text-sm text-[var(--color-stone)] italic"
								>
									Tidak ada barang tersedia yang cocok dengan pencarian.
								</p>
							{:else}
								<div
									class="custom-scrollbar grid max-h-[220px] grid-cols-1 gap-4 overflow-y-auto p-1 sm:grid-cols-2"
								>
									{#each filteredAvailable as item (item.id)}
										{@const IconComp = getItemIcon(item.name)}
										<div
											class="group flex items-center gap-3 rounded-xl border border-[var(--color-border-light)] bg-white p-3 transition-all hover:border-[var(--color-sage)] hover:bg-[var(--color-cream)]/30"
										>
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-sand)]/50 text-[var(--color-forest)]"
											>
												<IconComp size={20} />
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-xs font-bold text-[var(--color-earth)]">
													{item.name}
												</p>
												<p class="font-mono text-[11px] font-bold text-[var(--color-forest)]">
													{formatCurrency(item.rental_price_per_day)}
												</p>
											</div>
											<button
												type="button"
												onclick={() => addItem(item)}
												class="rounded-lg border border-[var(--color-forest)] px-2.5 py-1 text-xs font-bold text-[var(--color-forest)] transition-all hover:bg-[var(--color-forest)] hover:text-white"
											>
												+ Tambah
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Selected Items -->
						<div
							class="flex flex-grow flex-col justify-between border-t border-[var(--color-border-light)] bg-[var(--color-cream)] px-6 py-5"
						>
							<div>
								<div class="mb-4 flex items-center justify-between">
									<h4
										class="text-[11px] font-bold tracking-widest text-[var(--color-stone)] uppercase"
									>
										Barang dalam Paket ({selectedItems.length})
									</h4>
									<span class="text-xs font-bold text-[var(--color-forest)]">
										Total Harga Satuan: {formatCurrency(totalPriceNormal)}
									</span>
								</div>

								{#if selectedItems.length === 0}
									<div
										class="rounded-xl border border-dashed border-[var(--color-border)] bg-white/50 py-12 text-center text-[var(--color-stone)]"
									>
										<Package class="mx-auto mb-2 opacity-30" size={32} />
										<p class="text-xs font-medium">Belum ada barang ditambahkan ke paket</p>
									</div>
								{:else}
									<div class="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto p-1">
										{#each selectedItems as item (item.id)}
											{@const IconComp = getItemIcon(item.name)}
											<div
												class="flex items-center gap-4 rounded-xl border border-[var(--color-border-light)] bg-white p-4 shadow-sm"
											>
												<div
													class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-sand)]/30 text-[var(--color-forest)]"
												>
													<IconComp size={22} />
												</div>
												<div class="min-w-0 flex-1">
													<p class="truncate text-xs font-bold text-[var(--color-earth)]">
														{item.name}
													</p>
													<p class="font-mono text-[11px] font-bold text-[var(--color-forest)]">
														{formatCurrency(item.rental_price_per_day)}
														{#if item.quantity > 1}
															<span
																class="font-sans text-[10px] font-normal text-[var(--color-stone)]"
																>({item.quantity}x)</span
															>
														{/if}
													</p>
												</div>

												<!-- Quantity control adjusters -->
												<div
													class="flex items-center rounded-lg border border-[var(--color-border-light)] bg-[var(--color-sand)]/40 p-0.5"
												>
													<button
														type="button"
														onclick={() => updateQuantity(item.id, item.quantity - 1)}
														class="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-stone)] transition-all hover:bg-white"
													>
														<Minus size={14} />
													</button>
													<span class="w-8 text-center font-mono text-xs font-bold"
														>{item.quantity}</span
													>
													<button
														type="button"
														onclick={() => updateQuantity(item.id, item.quantity + 1)}
														class="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-stone)] transition-all hover:bg-white"
													>
														<Plus size={14} />
													</button>
												</div>

												<!-- Total line price -->
												<div class="w-20 text-right">
													<p class="font-mono text-xs font-bold text-[var(--color-earth)]">
														{formatCurrency(item.rental_price_per_day * item.quantity)}
													</p>
												</div>

												<!-- Remove button -->
												<button
													type="button"
													onclick={() => removeItem(item.id)}
													class="text-[var(--color-stone)] transition-colors hover:text-[var(--color-error)]"
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
		<div
			class="flex items-center justify-end gap-3 border-t border-[var(--color-border-light)] pt-6"
		>
			<a href="/packages">
				<Button type="button" variant="outline" size="lg" class="h-11 rounded-lg px-8">
					Batal
				</Button>
			</a>

			<Button
				type="submit"
				disabled={loading || selectedItems.length === 0}
				size="lg"
				class="flex h-11 items-center gap-2 rounded-lg bg-[var(--color-forest)] px-10 font-bold text-white shadow-[var(--color-forest)]/10 shadow-lg hover:bg-[var(--color-forest)]/90"
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
