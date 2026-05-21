<script>
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Plus, Trash2, Search, Image as ImageIcon, Upload } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	let { availableItems } = data;

	let loading = $state(false);
	
	// State for selected items in the package
	let selectedItems = $state([]);
	let searchQuery = $state('');
	
	let filteredAvailable = $derived(
		availableItems.filter(item => 
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!selectedItems.find(s => s.id === item.id)
		).slice(0, 10) // Limit suggestions
	);

	let totalPriceNormal = $derived(
		selectedItems.reduce((acc, curr) => acc + (curr.rental_price_per_day * curr.quantity), 0)
	);

	function addItem(item) {
		selectedItems = [...selectedItems, { ...item, quantity: 1 }];
		searchQuery = '';
	}

	function removeItem(id) {
		selectedItems = selectedItems.filter(s => s.id !== id);
	}

	function updateQuantity(id, qty) {
		const val = parseInt(qty);
		if (isNaN(val) || val < 1) return;
		selectedItems = selectedItems.map(s => s.id === id ? { ...s, quantity: val } : s);
	}

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

	function formatCurrency(amount) {
		if (amount == null) return '-';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="space-y-6 max-w-5xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<!-- eslint-disable-next-line -->
		<a href="/packages" class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-lg transition-colors">
			<ArrowLeft size={24} />
		</a>
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Buat Paket Baru</h1>
			<p class="text-[var(--color-stone)] mt-1">Gabungkan beberapa barang sewa menjadi satu paket harga khusus.</p>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium">
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
	>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			
			<!-- Kolom Kiri: Detail Paket -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Foto Paket -->
				<Card padding="md">
					<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-4">Foto Paket</h3>
					<div class="relative group cursor-pointer aspect-video md:aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-forest)] bg-[var(--color-sand-lightest)] flex flex-col items-center justify-center overflow-hidden transition-all">
						{#if imagePreview}
							<img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<ImageIcon class="text-white mb-2" size={32} />
								<span class="text-white font-medium text-sm">Ubah Foto</span>
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center text-[var(--color-stone)] group-hover:text-[var(--color-forest)] transition-colors p-6 text-center">
								<Upload class="mb-3" size={32} />
								<p class="font-medium text-sm mb-1">Upload Foto</p>
								<p class="text-xs opacity-70">PNG, JPG up to 5MB</p>
							</div>
						{/if}
						<input 
							type="file" 
							name="image" 
							accept="image/png, image/jpeg, image/webp" 
							class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							onchange={handleImageChange}
						>
					</div>
				</Card>

				<!-- Informasi Dasar -->
				<Card padding="md" class="space-y-4">
					<Input 
						id="name" 
						name="name" 
						label="Nama Paket" 
						placeholder="misal: Paket Pendakian 2 Orang" 
						required 
					/>
					
					<div>
						<label for="description" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Deskripsi</label>
						<textarea 
							id="description" 
							name="description" 
							rows="3" 
							placeholder="Tulis detail atau keterangan paket..."
							class="w-full px-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all resize-none"
						></textarea>
					</div>
					
					<div class="pt-2">
						<Input 
							id="package_price" 
							name="package_price" 
							type="number"
							label="Harga Paket (Diskon)" 
							placeholder="misal: 100000" 
							min="0"
							required 
						/>
						{#if selectedItems.length > 0}
							<div class="mt-2 text-xs bg-[var(--color-info-bg)] text-[var(--color-info)] p-2 rounded-lg border border-[var(--color-info)]/20">
								<span class="font-medium">Info:</span> Total harga normal dari {selectedItems.length} barang adalah <strong>{formatCurrency(totalPriceNormal)}</strong>.
							</div>
						{/if}
					</div>
				</Card>
			</div>

			<!-- Kolom Kanan: Isi Paket -->
			<div class="lg:col-span-2">
				<Card padding="md" class="h-full flex flex-col">
					<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-4">Pilih Barang ke Dalam Paket</h3>
					
					<!-- Pencarian Barang -->
					<div class="relative mb-6">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
							<Search size={18} />
						</div>
						<input 
							type="text" 
							bind:value={searchQuery} 
							placeholder="Ketik nama barang sewa..." 
							class="w-full pl-10 pr-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all"
						>
						
						{#if searchQuery.trim().length > 0 && filteredAvailable.length > 0}
							<div class="absolute z-10 w-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg max-h-60 overflow-y-auto">
								{#each filteredAvailable as item}
									<button 
										type="button"
										class="w-full text-left px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-[var(--color-sand-lightest)] transition-colors flex justify-between items-center"
										onclick={() => addItem(item)}
									>
										<div>
											<p class="font-medium text-[var(--color-earth)]">{item.name}</p>
											<p class="text-xs text-[var(--color-stone)]">{formatCurrency(item.rental_price_per_day)} / hari</p>
										</div>
										<Plus size={18} class="text-[var(--color-forest)]" />
									</button>
								{/each}
							</div>
						{:else if searchQuery.trim().length > 0}
							<div class="absolute z-10 w-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg p-4 text-center text-[var(--color-stone)] text-sm">
								Barang tidak ditemukan atau sudah masuk dalam paket.
							</div>
						{/if}
					</div>

					<!-- Daftar Barang Terpilih -->
					<div class="flex-1 bg-[var(--color-sand-lightest)] rounded-xl border border-[var(--color-border-light)] overflow-hidden flex flex-col">
						<div class="bg-[var(--color-sand-light)] px-4 py-3 border-b border-[var(--color-border-light)] flex justify-between items-center">
							<span class="font-semibold text-sm text-[var(--color-earth)]">Isi Paket ({selectedItems.length} Barang)</span>
						</div>
						
						<div class="flex-1 overflow-y-auto p-2">
							{#if selectedItems.length === 0}
								<div class="h-full flex flex-col items-center justify-center text-[var(--color-stone)] opacity-60 p-8">
									<Search size={40} class="mb-3" />
									<p class="text-sm text-center">Cari dan tambahkan barang ke dalam paket ini.</p>
								</div>
							{:else}
								<ul class="space-y-2">
									{#each selectedItems as item (item.id)}
										<li class="bg-white border border-[var(--color-border)] rounded-lg p-3 flex items-center justify-between gap-4">
											<div class="flex-1 min-w-0">
												<p class="font-medium text-sm text-[var(--color-earth)] truncate" title={item.name}>{item.name}</p>
												<p class="text-xs text-[var(--color-stone)]">{formatCurrency(item.rental_price_per_day)}</p>
											</div>
											
											<div class="flex items-center gap-3">
												<div class="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden bg-[var(--color-sand-lightest)]">
													<span class="px-2 text-xs font-medium text-[var(--color-stone)]">Qty:</span>
													<input 
														type="number" 
														min="1" 
														value={item.quantity}
														oninput={(e) => updateQuantity(item.id, e.currentTarget.value)}
														class="w-12 py-1 text-center text-sm font-semibold focus:outline-none bg-transparent"
													>
												</div>
												<button 
													type="button" 
													class="p-1.5 text-[var(--color-stone)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-md transition-colors"
													onclick={() => removeItem(item.id)}
												>
													<Trash2 size={16} />
												</button>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>

					<!-- Hidden input to pass selected items JSON to server -->
					<input type="hidden" name="items_json" value={JSON.stringify(selectedItems)} />

					<div class="mt-6 flex justify-end gap-3">
						<!-- eslint-disable-next-line -->
						<a href="/packages">
							<Button type="button" variant="outline">Batal</Button>
						</a>
						<Button type="submit" disabled={loading || selectedItems.length === 0} class="min-w-[140px]">
							{#if loading}
								Menyimpan...
							{:else}
								<Save size={18} class="mr-2" /> Simpan Paket
							{/if}
						</Button>
					</div>
				</Card>
			</div>

		</div>
	</form>
</div>
