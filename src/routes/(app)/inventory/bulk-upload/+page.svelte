<script>
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		Upload,
		FileSpreadsheet,
		Download,
		CheckCircle,
		AlertCircle
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import * as xlsx from 'xlsx';

	let { data, form } = $props();
	let categories = $derived(data.categories);

	let loading = $state(false);
	/** @type {File | null} */
	let selectedFile = $state(null);

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleFileChange(e) {
		selectedFile = e.currentTarget.files?.[0] || null;
	}

	function downloadTemplate() {
		// Prepare instructional data
		const ws_data = [
			['Nama', 'Deskripsi', 'ID Kategori', 'Harga Sewa', 'Harga Jual', 'Stok'],
			[
				'Tenda Dome 4P Consina',
				'Tenda kapasitas 4 orang, warna biru',
				categories.find((/** @type {any} */ c) => c.type === 'sewa')?.id || 'CONTOH-ID-SEWA',
				35000,
				0,
				10
			],
			[
				'Gas Portable Hi-Cook 230g',
				'Gas kaleng isi ulang',
				categories.find((/** @type {any} */ c) => c.type === 'retail')?.id || 'CONTOH-ID-RETAIL',
				0,
				15000,
				50
			]
		];

		const ws = xlsx.utils.aoa_to_sheet(ws_data);

		// Set column widths
		ws['!cols'] = [
			{ wch: 30 }, // Nama
			{ wch: 40 }, // Deskripsi
			{ wch: 40 }, // ID Kategori
			{ wch: 15 }, // Harga Sewa
			{ wch: 15 }, // Harga Jual
			{ wch: 10 } // Stok
		];

		const wb = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(wb, ws, 'Template_Barang');

		// Create a second sheet for Category Reference
		const ref_data = [
			['ID Kategori', 'Nama Kategori', 'Tipe'],
			...categories.map((c) => [c.id, c.name, c.type])
		];
		const ref_ws = xlsx.utils.aoa_to_sheet(ref_data);
		ref_ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 15 }];
		xlsx.utils.book_append_sheet(wb, ref_ws, 'Referensi_ID_Kategori');

		xlsx.writeFile(wb, 'Template_Bulk_Upload_BotaniRent.xlsx');
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
			<h1 class="font-heading text-3xl font-bold text-[var(--color-earth)]">Bulk Upload Barang</h1>
			<p class="mt-1 text-[var(--color-stone)]">
				Tambahkan puluhan barang sekaligus menggunakan file Excel (.xlsx).
			</p>
		</div>
	</div>

	{#if form?.error}
		<div
			class="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm text-[var(--color-error)]"
		>
			<div class="flex items-start gap-2">
				<AlertCircle size={20} class="mt-0.5 shrink-0" />
				<div class="whitespace-pre-wrap">{form.error}</div>
			</div>
		</div>
	{/if}

	{#if form?.success}
		<div
			class="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success)]"
		>
			<div class="flex items-center gap-2">
				<CheckCircle size={20} class="shrink-0" />
				<div class="font-medium">Berhasil menambahkan {form.count} barang ke dalam database!</div>
			</div>
			<!-- eslint-disable-next-line -->
			<a
				href="/inventory"
				class="mt-3 inline-block rounded-lg bg-[var(--color-success)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--color-success)]/90"
			>
				Kembali ke Daftar Barang
			</a>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Kiri: Uploader -->
		<Card padding="lg">
			<h3 class="mb-4 font-heading text-xl font-bold text-[var(--color-earth)]">Upload File</h3>

			<form
				method="POST"
				enctype="multipart/form-data"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
						selectedFile = null;
					};
				}}
				class="space-y-6"
			>
				<div
					class="group relative cursor-pointer rounded-xl border-2 border-dashed {selectedFile
						? 'border-[var(--color-forest)] bg-[var(--color-forest)]/5'
						: 'border-[var(--color-border)] bg-[var(--color-sand-lightest)] hover:border-[var(--color-forest)]'} flex flex-col items-center justify-center p-8 text-center transition-all"
				>
					<FileSpreadsheet
						class="{selectedFile
							? 'text-[var(--color-forest)]'
							: 'text-[var(--color-stone)] group-hover:text-[var(--color-forest)]'} mb-3 transition-colors"
						size={48}
					/>

					{#if selectedFile}
						<p class="w-full truncate px-4 font-bold text-[var(--color-earth)]">
							{selectedFile.name}
						</p>
						<p class="mt-1 text-xs text-[var(--color-stone)]">
							{(selectedFile.size / 1024).toFixed(1)} KB
						</p>
					{:else}
						<p class="mb-1 text-sm font-medium text-[var(--color-earth)]">
							Klik atau seret file Excel ke sini
						</p>
						<p class="text-xs text-[var(--color-stone)]">Maksimal 5MB (.xlsx, .xls, .csv)</p>
					{/if}

					<input
						type="file"
						name="file"
						accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
						class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						onchange={handleFileChange}
						required
					/>
				</div>

				<Button type="submit" disabled={!selectedFile || loading} class="w-full" size="lg">
					{#if loading}
						Sedang Memproses Data...
					{:else}
						<Upload size={18} class="mr-2" /> Mulai Upload
					{/if}
				</Button>
			</form>
		</Card>

		<!-- Kanan: Instruksi -->
		<div class="space-y-4">
			<Card
				padding="md"
				class="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] shadow-none"
			>
				<h3
					class="mb-2 flex items-center gap-2 font-heading text-lg font-bold text-[var(--color-info)]"
				>
					<Download size={20} /> Download Template
				</h3>
				<p class="mb-4 text-sm text-[var(--color-info)]/80">
					Gunakan template Excel standar kami agar sistem bisa membaca data dengan sempurna.
					Template ini sudah dilengkapi dengan <strong>Sheet Referensi ID Kategori</strong>.
				</p>
				<Button
					type="button"
					variant="outline"
					onclick={downloadTemplate}
					class="w-full border-[var(--color-info)] bg-white text-[var(--color-info)] hover:bg-[var(--color-info)] hover:text-white"
				>
					Download Template .xlsx
				</Button>
			</Card>

			<Card padding="md">
				<h3 class="mb-3 font-heading text-lg font-bold text-[var(--color-earth)]">
					Panduan Pengisian
				</h3>
				<ul class="list-disc space-y-2 pl-5 text-sm text-[var(--color-stone)]">
					<li><strong>Nama</strong>: Wajib diisi. Usahakan unik dan jelas.</li>
					<li>
						<strong>ID Kategori</strong>: Wajib diisi dengan UUID yang bisa dilihat di Sheet ke-2
						pada template.
					</li>
					<li>
						<strong>Harga Sewa</strong>: Isi angka (tanpa titik) jika kategori adalah Sewa.
						Kosongkan jika retail.
					</li>
					<li>
						<strong>Harga Jual</strong>: Isi angka (tanpa titik) jika kategori adalah Retail.
						Kosongkan jika sewa.
					</li>
					<li><strong>Stok</strong>: Wajib angka. Minimum 0.</li>
					<li><strong>Barcode</strong>: Otomatis di-generate oleh sistem, tidak perlu diisi.</li>
				</ul>
			</Card>
		</div>
	</div>
</div>
