<!--
  ============================================================
  FILE: Input.svelte
  TUJUAN: Komponen INPUT FIELD REUSABLE — input teks dengan label, ikon,
          validasi error, dan helper text.

  CARA PAKAI:
    <Input label="Nama" bind:value={nama} required />
    <Input label="Email" type="email" bind:value={email} error="Email tidak valid" />
    <Input label="Cari" placeholder="Ketik di sini..." helperText="Minimal 3 karakter">
      {#snippet iconLeft()}<Search size={16} />{/snippet}
    </Input>

  PROPS:
    label      = label di atas input
    value      = nilai input ($bindable = two-way binding)
    type       = tipe input: 'text', 'email', 'password', 'number', dll
    error      = pesan error (jika ada, border jadi merah)
    helperText = teks bantuan di bawah input
    size       = ukuran: 'md' | 'lg'
    iconLeft   = snippet ikon di kiri
    iconRight  = snippet ikon di kanan
    required   = wajib diisi (tampilkan tanda *)
    ...dan semua atribut HTML <input> lainnya

  KONSEP TWO-WAY BINDING ($bindable):
    bind:value menghubungkan nilai input SECARA DUA ARAH:
    - User mengetik di input → variabel di parent berubah
    - Variabel di parent berubah → input otomatis terupdate
  ============================================================
-->
<script>
	/**
	 * @typedef {Object} ExtraProps
	 * @property {string} [label] - label di atas input
	 * @property {string} [helperText] - teks bantuan di bawah input
	 * @property {string} [error] - pesan error (jika ada, border jadi merah)
	 * @property {'md' | 'lg'} [size] - ukuran input
	 * @property {import('svelte').Snippet} [iconLeft] - ikon di kiri
	 * @property {import('svelte').Snippet} [iconRight] - snippet/ikon di kanan
	 *
	 * Omit<..., 'size'> = ambil semua atribut HTMLInput KECUALI 'size'
	 * karena kita mendefinisikan 'size' sendiri dengan tipe berbeda ('md'|'lg' vs number)
	 *
	 * @typedef {Omit<import('svelte/elements').HTMLInputAttributes, 'size'> & ExtraProps} Props
	 */

	/** @type {Props & { isCurrency?: boolean }} */
	let {
		// Generate ID unik otomatis jika tidak diberikan
		// Math.random().toString(36).slice(2,9) = string acak 7 karakter (contoh: "k2f9x4a")
		// ID penting untuk menghubungkan <label for="..."> dengan <input id="...">
		id = `input-${Math.random().toString(36).slice(2, 9)}`,
		type = 'text', // Default tipe = teks
		name, // Nama field (untuk form submission)
		value = $bindable(''), // $bindable: parent bisa bind:value={namaVar}
		placeholder = '', // Teks placeholder (abu-abu di dalam input)
		label = '', // Label di atas input
		helperText = '', // Teks bantuan di bawah input (saat tidak error)
		error = '', // Pesan error (saat validasi gagal)
		disabled = false, // Apakah input dinonaktifkan
		required = false, // Apakah wajib diisi
		size = 'md', // Ukuran input
		class: className = '', // Class tambahan dari luar
		iconLeft, // Snippet ikon di kiri
		iconRight, // Snippet ikon di kanan
		oninput, // Handler input dari parent
		isCurrency = false, // Apakah input ini memformat Rupiah
		...rest // Atribut HTML lain (min, max, step, pattern, dll)
	} = $props();

	// Mapping ukuran ke class Tailwind
	const sizeClasses = {
		md: 'h-10 px-3.5 py-2 text-[14px]', // Medium: tinggi 40px
		lg: 'h-12 px-4 py-3 text-[16px]' // Large: tinggi 48px
	};

	let displayValue = $state('');

	// Format raw value to currency string (e.g., 150000 -> "Rp 150.000")
	function formatToRupiah(numStr) {
		if (numStr === null || numStr === undefined || numStr === '') return '';
		const clean = String(numStr).replace(/[^0-9]/g, '');
		if (!clean) return '';
		const formatted = new Intl.NumberFormat('id-ID', {
			minimumFractionDigits: 0
		}).format(parseInt(clean, 10));
		return `Rp ${formatted}`;
	}

	// Extract raw number from currency string (e.g., "Rp 150.000" -> "150000")
	function getRawNumber(str) {
		return str.replace(/[^0-9]/g, '');
	}

	// Keep displayValue in sync with value prop when updated from parent
	$effect(() => {
		if (isCurrency) {
			const formatted = formatToRupiah(value);
			if (formatted !== displayValue) {
				displayValue = formatted;
			}
		}
	});

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleCurrencyInput(e) {
		let inputVal = e.currentTarget.value;
		const raw = getRawNumber(inputVal);
		const formatted = formatToRupiah(raw);
		displayValue = formatted;
		e.currentTarget.value = formatted;
		value = raw;
		
		if (oninput) {
			oninput(e);
		}
	}

	const inputClass = `w-full rounded-md border-[1.5px] bg-white text-[var(--color-earth)] transition-colors placeholder:text-[var(--color-muted)]
		focus:outline-none
		disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
		${sizeClasses[size]}
		${iconLeft ? 'pl-10' : ''}
		${iconRight ? 'pr-10' : ''}
		${error
		? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]'
		: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'}`;
</script>

<!-- Container utama: layout vertikal (label → input → helper/error) -->
<div class="flex flex-col gap-1.5 {className}">
	<!-- LABEL (opsional) -->
	{#if label}
		<label for={id} class="text-[13px] font-medium text-[var(--color-earth)]">
			{label}
			<!-- Tanda bintang merah (*) jika field wajib diisi -->
			{#if required}<span class="text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}

	<!-- WRAPPER INPUT: relative untuk positioning ikon -->
	<div class="relative flex items-center">
		<!-- IKON KIRI (opsional)
		     pointer-events-none = ikon tidak bisa diklik (agar klik masuk ke input)
		     absolute left-3 = posisi absolut di kiri, jarak 12px dari tepi -->
		{#if iconLeft}
			<div
				class="pointer-events-none absolute left-3 flex items-center justify-center text-[var(--color-muted)]"
			>
				{@render iconLeft()}
			</div>
		{/if}

		<!-- INPUT ELEMENT -->
		{#if isCurrency}
			<input
				{id}
				type="text"
				{placeholder}
				{disabled}
				{required}
				value={displayValue}
				oninput={handleCurrencyInput}
				class={inputClass}
				{...rest}
			/>
			{#if name}
				<input type="hidden" {name} value={value} />
			{/if}
		{:else}
			<input
				{id}
				{type}
				{name}
				{placeholder}
				{disabled}
				{required}
				bind:value
				oninput={(e) => {
					if (type === 'number') {
						let val = e.currentTarget.value;
						if (val.length > 1 && val.startsWith('0')) {
							val = val.replace(/^0+/, '');
							if (val === '') {
								val = '0';
							}
							e.currentTarget.value = val;
							value = val;
						}
					}
					if (oninput) {
						oninput(e);
					}
				}}
				class={inputClass}
				{...rest}
			/>
		{/if}
		<!-- PENJELASAN CLASS INPUT:
		     - pl-10 / pr-10: padding kiri/kanan ekstra jika ada ikon (agar teks tidak tertutup ikon)
		     - Jika ERROR: border merah + ring merah saat fokus
		     - Jika NORMAL: border abu + ring hijau sage saat fokus
		     - focus:ring-[3px]: ring halus di sekitar input saat fokus (aksesibilitas) -->

		<!-- IKON KANAN (opsional) -->
		{#if iconRight}
			<div class="absolute right-3 flex items-center justify-center text-[var(--color-muted)]">
				{@render iconRight()}
			</div>
		{/if}
	</div>

	<!-- PESAN ERROR atau HELPER TEXT di bawah input -->
	{#if error}
		<!-- Error message: merah, muncul jika ada error -->
		<p class="mt-0.5 text-[12px] text-[var(--color-error)]">{error}</p>
	{:else if helperText}
		<!-- Helper text: abu, muncul jika tidak ada error -->
		<p class="mt-0.5 text-[12px] text-[var(--color-stone)]">{helperText}</p>
	{/if}
</div>
