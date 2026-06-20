<!--
  ============================================================
  FILE: Button.svelte
  TUJUAN: Komponen tombol REUSABLE (bisa dipakai ulang) untuk seluruh app.

  KONSEP KOMPONEN REUSABLE:
    Daripada menulis <button class="bg-green..."> berulang-ulang di setiap halaman,
    kita buat SATU komponen <Button> yang bisa dikustomisasi lewat PROPS.
    Jadi kalau suatu hari desain tombol berubah, cukup ubah DI SINI saja.

  CARA PAKAI:
    <Button variant="primary" size="md" onclick={handleClick}>Simpan</Button>
    <Button variant="danger" size="sm">Hapus</Button>
    <Button variant="ghost">Batal</Button>
    <Button variant="secondary" fullWidth>Lebar Penuh</Button>
    <Button variant="primary">
      {#snippet iconLeft()}<Plus size={16} />{/snippet}
      Tambah Item
    </Button>

  PROPS YANG TERSEDIA:
    variant   = gaya visual: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
    size      = ukuran: 'sm' | 'md' | 'lg'
    fullWidth = apakah tombol selebar container (true/false)
    disabled  = apakah tombol dinonaktifkan
    iconLeft  = snippet ikon di kiri teks
    iconRight = snippet ikon di kanan teks

  KONSEP PEMROGRAMAN:
    - COMPOSITION PATTERN: tombol dikustomisasi lewat props, bukan inheritance
    - SNIPPET (Svelte 5): cara baru memasukkan konten ke dalam komponen
    - REST PROPS (...rest): meneruskan semua atribut HTML yang tidak di-destructure
  ============================================================
-->
<script>
	/**
	 * TYPE DEFINITIONS (JSDoc)
	 * Mendefinisikan tipe data untuk setiap prop yang diterima komponen ini.
	 *
	 * @typedef {Object} ExtraProps — prop tambahan khusus komponen ini
	 * @property {'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'} [variant] — gaya visual
	 * @property {'sm' | 'md' | 'lg'} [size] — ukuran tombol
	 * @property {boolean} [fullWidth] — apakah tombol selebar container
	 * @property {import('svelte').Snippet} [iconLeft] — snippet ikon di kiri
	 * @property {import('svelte').Snippet} [iconRight] — snippet ikon di kanan
	 *
	 * HTMLButtonAttributes = semua atribut HTML standar untuk <button>
	 * (type, disabled, onclick, id, class, dll)
	 * ExtraProps = prop tambahan yang kita buat sendiri
	 * Props = gabungan keduanya
	 *
	 * @typedef {import('svelte/elements').HTMLButtonAttributes & ExtraProps} Props
	 */

	/** @type {Props} */
	let {
		type = 'button', // Default type = 'button' (bukan 'submit')
		variant = 'primary', // Default gaya = primary (hijau hutan)
		size = 'md', // Default ukuran = medium
		disabled = false, // Default aktif (tidak disabled)
		fullWidth = false, // Default tidak full width
		class: className = '', // Class CSS tambahan dari luar (rename karena 'class' = reserved word)
		onclick, // Event handler saat tombol diklik
		children, // Konten teks di dalam tombol (Svelte 5 snippet)
		iconLeft, // Snippet ikon di kiri teks
		iconRight, // Snippet ikon di kanan teks
		...rest // Semua prop lain (id, aria-label, dll) diteruskan ke <button>
	} = $props();

	// ─────────────────────────────────────────────────
	// CLASS DEFINITIONS — mendefinisikan class CSS per variasi
	// ─────────────────────────────────────────────────

	// Class DASAR yang selalu ada di semua tombol
	const baseClasses =
		'inline-flex items-center justify-center font-semibold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
	// inline-flex items-center justify-center = konten di tengah (horizontal & vertikal)
	// font-semibold                           = teks semi-tebal
	// rounded-md                              = sudut sedikit bulat
	// transition-all                          = semua perubahan dianimasikan
	// focus-visible:ring-2                    = ring saat fokus keyboard (aksesibilitas)
	// disabled:opacity-50                     = 50% transparan saat disabled
	// disabled:cursor-not-allowed             = cursor "dilarang" saat disabled

	// Class per VARIANT (gaya visual)
	// Setiap variant punya warna background, teks, hover, dan active yang berbeda
	const variantClasses = {
		primary:
			'bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-light)] focus-visible:ring-[var(--color-forest)] active:bg-[var(--color-forest-dark)] active:scale-[0.97]',
		// primary: hijau hutan, teks putih, sedikit mengecil saat ditekan (active:scale-[0.97])

		secondary:
			'bg-transparent border-[1.5px] border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)] focus-visible:ring-[var(--color-forest)]',
		// secondary: tombol outline (border tanpa background)

		outline:
			'bg-transparent border-[1.5px] border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)] focus-visible:ring-[var(--color-forest)]',
		// outline: sama seperti secondary (alias)

		danger:
			'bg-[var(--color-error)] text-white hover:bg-[#A83428] focus-visible:ring-[var(--color-error)]',
		// danger: merah, untuk aksi berbahaya (hapus data, dll)

		ghost:
			'bg-transparent text-[var(--color-stone)] hover:bg-[var(--color-sand)] active:bg-[var(--color-sand-light)] focus-visible:ring-[var(--color-border)]'
		// ghost: transparan, hanya teks — paling subtle
	};

	// Class per SIZE (ukuran)
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-[13px] h-8 gap-2', // Kecil: tinggi 32px
		md: 'px-5 py-2.5 text-[14px] h-10 gap-2', // Sedang: tinggi 40px
		lg: 'px-7 py-3 text-[16px] h-12 gap-3' // Besar: tinggi 48px
	};

	// $derived = computed value yang otomatis dihitung ulang saat fullWidth berubah
	let widthClass = $derived(fullWidth ? 'w-full' : '');
</script>

<!-- TEMPLATE: Render tombol dengan class yang digabungkan -->
<button
	{type}
	{disabled}
	{onclick}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {widthClass} {className}"
	{...rest}
>
	<!-- Ikon di KIRI teks (opsional) -->
	{#if iconLeft}
		<span class="flex-shrink-0">
			<!-- @render = Svelte 5 syntax untuk merender snippet
			     Snippet adalah "potongan UI" yang dikirim dari parent
			     Contoh: {#snippet iconLeft()}<Plus size={16} />{/snippet} -->
			{@render iconLeft()}
		</span>
	{/if}

	<!-- Konten utama tombol (teks, ikon, dll) -->
	{#if children}
		{@render children()}
	{/if}

	<!-- Ikon di KANAN teks (opsional) -->
	{#if iconRight}
		<span class="flex-shrink-0">
			{@render iconRight()}
		</span>
	{/if}
</button>
