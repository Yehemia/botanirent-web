<script>
	import { enhance } from '$app/forms';
	import { ArrowLeft, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import * as xlsx from 'xlsx';

	let { data, form } = $props();
	let { categories } = data;

	let loading = $state(false);
	let selectedFile = $state(null);

	function handleFileChange(e) {
		selectedFile = e.currentTarget.files?.[0] || null;
	}

	function downloadTemplate() {
		// Prepare instructional data
		const ws_data = [
			['Nama', 'Deskripsi', 'ID Kategori', 'Harga Sewa', 'Harga Jual', 'Stok'],
			['Tenda Dome 4P Consina', 'Tenda kapasitas 4 orang, warna biru', categories.find(c => c.type === 'sewa')?.id || 'CONTOH-ID-SEWA', 35000, 0, 10],
			['Gas Portable Hi-Cook 230g', 'Gas kaleng isi ulang', categories.find(c => c.type === 'retail')?.id || 'CONTOH-ID-RETAIL', 0, 15000, 50]
		];

		const ws = xlsx.utils.aoa_to_sheet(ws_data);
		
		// Set column widths
		ws['!cols'] = [
			{ wch: 30 }, // Nama
			{ wch: 40 }, // Deskripsi
			{ wch: 40 }, // ID Kategori
			{ wch: 15 }, // Harga Sewa
			{ wch: 15 }, // Harga Jual
			{ wch: 10 }  // Stok
		];

		const wb = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(wb, ws, "Template_Barang");
		
		// Create a second sheet for Category Reference
		const ref_data = [
			['ID Kategori', 'Nama Kategori', 'Tipe'],
			...categories.map(c => [c.id, c.name, c.type])
		];
		const ref_ws = xlsx.utils.aoa_to_sheet(ref_data);
		ref_ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 15 }];
		xlsx.utils.book_append_sheet(wb, ref_ws, "Referensi_ID_Kategori");

		xlsx.writeFile(wb, "Template_Bulk_Upload_BotaniRent.xlsx");
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
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Bulk Upload Barang</h1>
			<p class="text-[var(--color-stone)] mt-1">Tambahkan puluhan barang sekaligus menggunakan file Excel (.xlsx).</p>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 text-sm">
			<div class="flex items-start gap-2">
				<AlertCircle size={20} class="shrink-0 mt-0.5" />
				<div class="whitespace-pre-wrap">{form.error}</div>
			</div>
		</div>
	{/if}

	{#if form?.success}
		<div class="bg-[var(--color-success-bg)] text-[var(--color-success)] p-4 rounded-xl border border-[var(--color-success)]/20 text-sm">
			<div class="flex items-center gap-2">
				<CheckCircle size={20} class="shrink-0" />
				<div class="font-medium">Berhasil menambahkan {form.count} barang ke dalam database!</div>
			</div>
			<!-- eslint-disable-next-line -->
			<a href="/inventory" class="inline-block mt-3 px-4 py-2 bg-[var(--color-success)] text-white font-medium rounded-lg hover:bg-[var(--color-success)]/90 transition-colors">
				Kembali ke Daftar Barang
			</a>
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Kiri: Uploader -->
		<Card padding="lg">
			<h3 class="text-xl font-bold font-heading text-[var(--color-earth)] mb-4">Upload File</h3>
			
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
				<div class="relative group cursor-pointer rounded-xl border-2 border-dashed {selectedFile ? 'border-[var(--color-forest)] bg-[var(--color-forest)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-forest)] bg-[var(--color-sand-lightest)]'} flex flex-col items-center justify-center p-8 transition-all text-center">
					<FileSpreadsheet class="{selectedFile ? 'text-[var(--color-forest)]' : 'text-[var(--color-stone)] group-hover:text-[var(--color-forest)]'} mb-3 transition-colors" size={48} />
					
					{#if selectedFile}
						<p class="font-bold text-[var(--color-earth)] truncate w-full px-4">{selectedFile.name}</p>
						<p class="text-xs text-[var(--color-stone)] mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
					{:else}
						<p class="font-medium text-sm text-[var(--color-earth)] mb-1">Klik atau seret file Excel ke sini</p>
						<p class="text-xs text-[var(--color-stone)]">Maksimal 5MB (.xlsx, .xls, .csv)</p>
					{/if}

					<input 
						type="file" 
						name="file" 
						accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
						class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						onchange={handleFileChange}
						required
					>
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
			<Card padding="md" class="bg-[var(--color-info-bg)] border-[var(--color-info)]/20 shadow-none">
				<h3 class="text-lg font-bold font-heading text-[var(--color-info)] mb-2 flex items-center gap-2">
					<Download size={20} /> Download Template
				</h3>
				<p class="text-sm text-[var(--color-info)]/80 mb-4">
					Gunakan template Excel standar kami agar sistem bisa membaca data dengan sempurna. Template ini sudah dilengkapi dengan <strong>Sheet Referensi ID Kategori</strong>.
				</p>
				<Button type="button" variant="outline" onclick={downloadTemplate} class="w-full bg-white text-[var(--color-info)] border-[var(--color-info)] hover:bg-[var(--color-info)] hover:text-white">
					Download Template .xlsx
				</Button>
			</Card>

			<Card padding="md">
				<h3 class="text-lg font-bold font-heading text-[var(--color-earth)] mb-3">Panduan Pengisian</h3>
				<ul class="text-sm text-[var(--color-stone)] space-y-2 list-disc pl-5">
					<li><strong>Nama</strong>: Wajib diisi. Usahakan unik dan jelas.</li>
					<li><strong>ID Kategori</strong>: Wajib diisi dengan UUID yang bisa dilihat di Sheet ke-2 pada template.</li>
					<li><strong>Harga Sewa</strong>: Isi angka (tanpa titik) jika kategori adalah Sewa. Kosongkan jika retail.</li>
					<li><strong>Harga Jual</strong>: Isi angka (tanpa titik) jika kategori adalah Retail. Kosongkan jika sewa.</li>
					<li><strong>Stok</strong>: Wajib angka. Minimum 0.</li>
					<li><strong>Barcode</strong>: Otomatis di-generate oleh sistem, tidak perlu diisi.</li>
				</ul>
			</Card>
		</div>
	</div>
</div>
