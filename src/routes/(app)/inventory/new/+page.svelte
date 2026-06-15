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

	let categories = $derived(data.categories);

	let loading = $state(false);

	// Get initial category ID using static helper to prevent Svelte warnings
	const getInitialCategoryId = () => {
		return form?.values?.category_id || (data.categories.length > 0 ? data.categories[0].id : '');
	};

	const initialCategoryId = getInitialCategoryId();
	let selectedCategoryId = $state(initialCategoryId);

	// Reactively find the selected category to toggle price inputs
	let selectedCategory = $derived(
		categories.find((/** @type {any} */ c) => c.id === selectedCategoryId)
	);

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
</script>

<div class="mx-auto max-w-4xl space-y-6 pb-12">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<!-- eslint-disable-next-line -->
		<a
			href="/inventory"
			class="rounded-lg p-2 text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)]"
		>
			<ArrowLeft size={24} />
		</a>
		<div>
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Tambah Barang Baru</h1>
			<p class="mt-1 text-[var(--color-stone)]">
				Barcode akan di-generate otomatis oleh sistem (misal: BTN-XXXXX).
			</p>
		</div>
	</div>

	{#if form?.error}
		<div
			class="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 font-medium text-[var(--color-error)]"
		>
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
					toast.success('Berhasil menambahkan barang baru!');
				} else if (result.type === 'error' || result.type === 'failure') {
					toast.error('Gagal menambahkan barang. Periksa kembali data Anda.');
				}
			};
		}}
	>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<!-- Kolom Kiri: Foto -->
			<div class="space-y-6 md:col-span-1">
				<Card padding="md" class="h-full">
					<h3 class="mb-4 font-heading text-lg font-bold text-[var(--color-earth)]">Foto Barang</h3>

					<div
						class="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-sand-lightest)] transition-all hover:border-[var(--color-forest)]"
					>
						{#if imagePreview}
							<img src={imagePreview} alt="Preview" class="h-full w-full object-cover" />
							<div
								class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<ImageIcon class="mb-2 text-white" size={32} />
								<span class="text-sm font-medium text-white">Ubah Foto</span>
							</div>
						{:else}
							<div
								class="flex flex-col items-center justify-center p-6 text-center text-[var(--color-stone)] transition-colors group-hover:text-[var(--color-forest)]"
							>
								<Upload class="mb-3" size={32} />
								<p class="mb-1 text-sm font-medium">Upload Foto</p>
								<p class="text-xs opacity-70">PNG, JPG up to 5MB</p>
							</div>
						{/if}
						<input
							type="file"
							name="image"
							accept="image/png, image/jpeg, image/webp"
							class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
							onchange={handleImageChange}
						/>
					</div>
					<p class="mt-3 text-center text-xs text-[var(--color-stone)]">
						Foto bersifat opsional namun sangat disarankan untuk katalog kasir.
					</p>
				</Card>
			</div>

			<!-- Kolom Kanan: Detail Form -->
			<div class="space-y-6 md:col-span-2">
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
								value={form?.values?.name || ''}
							/>
						</div>

						<Select
							id="category_id"
							name="category_id"
							label="Kategori"
							bind:value={selectedCategoryId}
						>
							{#if categories.length === 0}
								<option value="" disabled>Belum ada kategori di database</option>
							{/if}
							{#each categories as cat}
								<option value={cat.id}>{cat.name} ({cat.type})</option>
							{/each}
						</Select>

						<!-- Grid untuk Harga dan Stok -->
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
										value={form?.values?.rental_price_per_day || ''}
									/>
									<p class="mt-1 text-xs text-[var(--color-stone)]">
										Hanya angka tanpa titik/koma.
									</p>
								{:else if selectedCategory?.type === 'retail'}
									<Input
										id="sell_price"
										name="sell_price"
										type="number"
										label="Harga Jual"
										placeholder="misal: 150000"
										min="0"
										required
										value={form?.values?.sell_price || ''}
									/>
									<p class="mt-1 text-xs text-[var(--color-stone)]">Harga jual ke konsumen.</p>
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
									value={form?.values?.stock_total || '1'}
								/>
								<p class="mt-1 text-xs text-[var(--color-stone)]">
									Total fisik barang di cabang ini.
								</p>
							</div>
						</div>

						<!-- Deskripsi -->
						<div>
							<label
								for="description"
								class="mb-2 block text-sm font-semibold text-[var(--color-earth)]"
								>Deskripsi (Opsional)</label
							>
							<textarea
								id="description"
								name="description"
								rows="4"
								placeholder="Tuliskan spesifikasi, warna, atau catatan lain terkait barang ini..."
								class="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)] px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-[var(--color-forest)] focus:outline-none"
								>{form?.values?.description || ''}</textarea
							>
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
							<Save size={18} class="mr-2" /> Simpan Barang
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</form>
</div>
