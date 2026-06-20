<!--
  ============================================================
  FILE: Card.svelte
  TUJUAN: Komponen kartu REUSABLE — container dengan border, shadow, dan background putih.
          Dipakai untuk membungkus konten di seluruh app (statistik, form, daftar, dll).

  CARA PAKAI:
    <Card>Konten di sini</Card>
    <Card padding="lg" hoverable>Kartu dengan efek hover</Card>
    <Card padding="none">Kartu tanpa padding (untuk tabel full-width)</Card>

  PROPS:
    class     = class CSS tambahan
    hoverable = apakah ada efek hover (naik sedikit + shadow lebih besar)
    padding   = ukuran padding: 'none' | 'sm' | 'md' | 'lg'
    children  = konten di dalam kartu (Svelte 5 snippet)
  ============================================================
-->
<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class] — class CSS tambahan
	 * @property {boolean} [hoverable] — efek hover (naik + shadow)
	 * @property {'none' | 'sm' | 'md' | 'lg'} [padding] — ukuran padding dalam
	 * @property {import('svelte').Snippet} children — konten di dalam kartu
	 */

	/** @type {Props} */
	let { class: className = '', hoverable = false, padding = 'md', children } = $props();

	// Mapping ukuran padding ke class Tailwind
	const paddingClasses = {
		none: 'p-0', // Tanpa padding — untuk tabel yang perlu full-width
		sm: 'p-3', // Padding kecil: 12px
		md: 'p-5', // Padding medium: 20px (default)
		lg: 'p-6 sm:p-8' // Padding besar: 24px mobile, 32px desktop
	};

	// Class dasar: background putih, border ringan, sudut bulat, shadow kecil
	const baseClass =
		'bg-white border border-[var(--color-border-light)] rounded-lg shadow-[var(--shadow-sm)]';

	// $derived = class hover dihitung otomatis berdasarkan prop 'hoverable'
	// Jika hoverable = true:
	//   - transition-all duration-250: animasi halus 250ms
	//   - hover:shadow-md: shadow lebih besar saat hover
	//   - hover:-translate-y-0.5: naik 2px saat hover (efek "mengambang")
	//   - hover:border-[color-border]: border sedikit lebih gelap saat hover
	let hoverClass = $derived(
		hoverable
			? 'transition-all duration-250 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--color-border)]'
			: ''
	);
</script>

<!-- Render kartu dengan semua class digabungkan -->
<div class="{baseClass} {paddingClasses[padding]} {hoverClass} {className}">
	<!-- @render children() = tampilkan konten yang dimasukkan ke dalam <Card>...</Card> -->
	{@render children()}
</div>
