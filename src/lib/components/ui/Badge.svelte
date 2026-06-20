<!--
  ============================================================
  FILE: Badge.svelte
  TUJUAN: Komponen BADGE — label kecil berwarna untuk menampilkan status.
          Contoh: "Lunas" (hijau), "Menunggu" (kuning), "Overdue" (merah).

  CARA PAKAI:
    <Badge variant="success">Lunas</Badge>
    <Badge variant="warning">Menunggu</Badge>
    <Badge variant="error">Overdue</Badge>
    <Badge variant="info">Baru</Badge>
    <Badge variant="neutral">Draft</Badge>

  PROPS:
    variant  = gaya warna: 'success'|'warning'|'error'|'info'|'neutral'|'primary'|'secondary'
    class    = class CSS tambahan
    children = teks di dalam badge
  ============================================================
-->
<script>
	/**
	 * @typedef {Object} Props
	 * @property {'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary'} [variant]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let { variant = 'neutral', class: className = '', children } = $props();

	// Class dasar: pill shape (bulat penuh), teks kecil (12px), tebal
	const baseClass =
		'inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide whitespace-nowrap';
	// rounded-full = bentuk pill (sangat bulat)
	// whitespace-nowrap = teks tidak pindah baris
	// tracking-wide = sedikit lebih renggang antar huruf (mudah dibaca di ukuran kecil)

	// Setiap variant menggunakan warna SEMANTIC yang sudah didefinisikan di app.css
	// Pattern: background transparan (10%) + teks warna solid
	// Ini membuat badge terlihat ringan tapi tetap jelas warnanya
	const variantClasses = {
		success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]', // Hijau — sukses, lunas
		warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]', // Kuning — peringatan
		error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]', // Merah — error, overdue
		info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]', // Biru — informasi
		neutral: 'bg-[var(--color-sand)] text-[var(--color-stone)]', // Abu — netral, draft
		primary: 'bg-[var(--color-sage-10)] text-[var(--color-forest)]', // Hijau brand
		secondary: 'bg-[rgba(212,168,67,0.1)] text-[var(--color-amber)]' // Kuning amber
	};
</script>

<!-- Render badge sebagai <span> inline -->
<span class="{baseClass} {variantClasses[variant]} {className}">
	{@render children()}
</span>
