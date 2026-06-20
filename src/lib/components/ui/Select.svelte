<!--
  ============================================================
  FILE: Select.svelte
  TUJUAN: Komponen SELECT (dropdown) REUSABLE — mirip Input.svelte tapi untuk pilihan.

  CARA PAKAI:
    <Select label="Kategori" bind:value={kategori} required>
      <option value="">-- Pilih --</option>
      <option value="tenda">Tenda</option>
      <option value="sleeping_bag">Sleeping Bag</option>
    </Select>

    <Select label="Status" bind:value={status} error="Wajib dipilih">
      {#snippet iconLeft()}<Filter size={16} />{/snippet}
      <option value="">Semua</option>
      <option value="active">Aktif</option>
    </Select>

  PROPS:
    label      = label di atas dropdown
    value      = nilai terpilih ($bindable = two-way binding)
    error      = pesan error
    helperText = teks bantuan
    iconLeft   = snippet ikon di kiri
    children   = <option> elements
    ...dan semua atribut HTML <select> lainnya
  ============================================================
-->
<script>
	/**
	 * @typedef {Object} ExtraProps
	 * @property {string} [label]
	 * @property {string} [helperText]
	 * @property {string} [error]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} children — berisi <option> elements
	 *
	 * @typedef {import('svelte/elements').HTMLSelectAttributes & ExtraProps} Props
	 */

	/** @type {Props} */
	let {
		id = `select-${Math.random().toString(36).slice(2, 9)}`, // ID unik otomatis
		name, // Nama field untuk form
		value = $bindable(''), // Nilai terpilih (two-way binding)
		label = '', // Label di atas dropdown
		helperText = '', // Teks bantuan
		error = '', // Pesan error
		disabled = false,
		required = false,
		class: className = '',
		iconLeft, // Ikon di kiri dropdown
		children, // <option> elements yang akan dirender di dalam <select>
		...rest
	} = $props();
</script>

<!-- Container: sama persis dengan Input.svelte (konsistensi visual) -->
<div class="flex flex-col gap-1.5 {className}">
	<!-- LABEL (opsional) -->
	{#if label}
		<label for={id} class="text-[13px] font-medium text-[var(--color-earth)]">
			{label}
			{#if required}<span class="text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}

	<!-- WRAPPER SELECT -->
	<div class="relative flex items-center">
		<!-- IKON KIRI (opsional) -->
		{#if iconLeft}
			<div
				class="pointer-events-none absolute left-3 flex items-center justify-center text-[var(--color-muted)]"
			>
				{@render iconLeft()}
			</div>
		{/if}

		<!-- SELECT ELEMENT
		     appearance-none = hapus tampilan default browser (panah bawaan)
		     Kita buat panah sendiri (lihat di bawah) agar konsisten di semua browser -->
		<select
			{id}
			{name}
			{disabled}
			{required}
			bind:value
			class="w-full cursor-pointer appearance-none rounded-md border-[1.5px] bg-white py-2 pr-10 text-[14px] text-[var(--color-earth)] transition-colors
				focus:outline-none
				disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
				{iconLeft ? 'pl-10' : 'px-3.5'}
				{error
				? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]'
				: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'}"
			{...rest}
		>
			<!-- children = <option> elements dari parent -->
			{@render children()}
		</select>

		<!-- Dropdown indicator arrow (panah bawah custom)
		     pointer-events-none = panah tidak menghalangi klik pada select
		     Ini menggantikan panah default browser yang dihapus dengan appearance-none -->
		<div
			class="pointer-events-none absolute right-3 flex items-center justify-center text-[var(--color-stone)]"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg
			>
		</div>
	</div>

	<!-- PESAN ERROR atau HELPER TEXT -->
	{#if error}
		<p class="mt-0.5 text-[12px] text-[var(--color-error)]">{error}</p>
	{:else if helperText}
		<p class="mt-0.5 text-[12px] text-[var(--color-stone)]">{helperText}</p>
	{/if}
</div>
