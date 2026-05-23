<script>
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Upload, Package, Save, Image as ImageIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	
	const initialItem = data.item;
	const initialForm = form;
	let item = $derived(data.item);
	let categories = $derived(data.categories);

	let loading = $state(false);
	
	// Initialize form states using Svelte 5 $state
	let name = $state(initialForm?.values?.name ?? initialItem.name);
	let description = $state(initialForm?.values?.description ?? initialItem.description ?? '');
	let selectedCategoryId = $state(initialForm?.values?.category_id ?? initialItem.category_id);
	let stock_total = $state(initialForm?.values?.stock_total ?? initialItem.stock_total);
	let is_active = $state(initialForm?.values?.is_active ?? (initialItem.is_active ? 'true' : 'false'));
	
	let rental_price_per_day = $state(initialForm?.values?.rental_price_per_day ?? initialItem.rental_price_per_day ?? '');
	let sell_price = $state(initialForm?.values?.sell_price ?? initialItem.sell_price ?? '');
	
	// Reactively find the selected category to toggle price inputs
	let selectedCategory = $derived(categories.find((/** @type {any} */ c) => c.id === selectedCategoryId));
	
	/** @type {string | null} */
	let imagePreview = $state(initialItem.image_url || null);

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleImageChange(e) {
		const file = e.currentTarget.files?.[0];
		if (file) {
			imagePreview = URL.createObjectURL(file);
		}
	}
</script>

<div class="space-y-6 max-w-4xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<!-- eslint-disable-next-line -->
		<a href="/inventory" class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-lg transition-colors">
			<ArrowLeft size={24} />
		</a>
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Edit Barang</h1>
			<p class="text-[var(--color-stone)] mt-1">Barcode: <span class="font-mono font-bold text-[var(--color-earth)] bg-[var(--color-sand)] px-2 py-0.5 rounded-md">{item.barcode || '-'}</span></p>
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
			return async ({ result, update }) => {
				await update();
				loading = false;
				if (result.type === 'success' || result.type === 'redirect') {
					toast.success('Berhasil menyimpan perubahan!');
				} else if (result.type === 'error' || result.type === 'failure') {
					toast.error('Gagal menyimpan perubahan. Periksa kembali data Anda.');
				}
			};
		}}
	>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			
			<!-- Kolom Kiri: Foto -->
			<div class="md:col-span-1 space-y-6">
				<Card padding="md" class="h-full">
					<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-4">Foto Barang</h3>
					
					<div class="relative group cursor-pointer aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-forest)] bg-[var(--color-sand-lightest)] flex flex-col items-center justify-center overflow-hidden transition-all">
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
					<p class="text-xs text-[var(--color-stone)] mt-3 text-center">
						Foto bersifat opsional namun sangat disarankan untuk katalog kasir.
					</p>
				</Card>
			</div>

			<!-- Kolom Kanan: Detail Form -->
			<div class="md:col-span-2 space-y-6">
				<Card padding="lg">
					<div class="space-y-5">
						
						<!-- Nama Barang -->
						<div>
							<Input 
								id="name" 
								name="name" 
								label="Nama Barang" 
								placeholder="misal: Tenda Dome 4P Consina" 
								required 
								bind:value={name}
							/>
						</div>

						<!-- Kategori & Status Aktif -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<Select 
								id="category_id" 
								name="category_id" 
								label="Kategori"
								bind:value={selectedCategoryId}
							>
								{#each categories as cat}
									<option value={cat.id}>{cat.name} ({cat.type})</option>
								{/each}
							</Select>

							<Select 
								id="is_active" 
								name="is_active" 
								label="Status Operasional"
								bind:value={is_active}
							>
								<option value="true">Aktif (Tampil di POS)</option>
								<option value="false">Nonaktif (Sembunyikan dari POS)</option>
							</Select>
						</div>

						<!-- Grid untuk Harga dan Stok -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
							
							<!-- Dinamis: Harga Sewa atau Harga Jual -->
							<div>
								{#if selectedCategory?.type === 'sewa'}
									<Input 
										id="rental_price_per_day" 
										name="rental_price_per_day" 
										type="number"
										label="Harga Sewa (per Siklus)" 
										placeholder="misal: 35000" 
										min="0"
										required 
										bind:value={rental_price_per_day}
									/>
									<p class="text-xs text-[var(--color-stone)] mt-1">Hanya angka tanpa titik/koma.</p>
								{:else if selectedCategory?.type === 'retail'}
									<Input 
										id="sell_price" 
										name="sell_price" 
										type="number"
										label="Harga Jual" 
										placeholder="misal: 150000" 
										min="0"
										required 
										bind:value={sell_price}
									/>
									<p class="text-xs text-[var(--color-stone)] mt-1">Harga jual ke konsumen.</p>
								{/if}
							</div>

							<!-- Stok -->
							<div>
								<Input 
									id="stock_total" 
									name="stock_total" 
									type="number"
									label="Total Stok" 
									placeholder="misal: 10" 
									min="0"
									required 
									bind:value={stock_total}
								/>
								<p class="text-xs text-[var(--color-stone)] mt-1">Total fisik barang di cabang ini.</p>
							</div>
						</div>

						<!-- Deskripsi -->
						<div>
							<label for="description" class="block text-sm font-semibold text-[var(--color-earth)] mb-2">Deskripsi (Opsional)</label>
							<textarea 
								id="description" 
								name="description" 
								rows="4" 
								placeholder="Tuliskan spesifikasi, warna, atau catatan lain terkait barang ini..."
								class="w-full px-4 py-3 bg-[var(--color-sand-lightest)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)] focus:border-transparent transition-all resize-none"
								bind:value={description}
							></textarea>
						</div>

					</div>
				</Card>
				
				<!-- Action Buttons -->
				<div class="flex justify-end gap-3 pt-4">
					<!-- eslint-disable-next-line -->
					<a href="/inventory">
						<Button type="button" variant="outline">Batal</Button>
					</a>
					<Button type="submit" disabled={loading} class="min-w-[140px]">
						{#if loading}
							Menyimpan...
						{:else}
							<Save size={18} class="mr-2" /> Simpan Perubahan
						{/if}
					</Button>
				</div>
			</div>

		</div>
	</form>
</div>
