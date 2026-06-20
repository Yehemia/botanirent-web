<!--
  ============================================================
  FILE: +error.svelte
  TUJUAN: Halaman error KUSTOM yang ditampilkan saat terjadi error.
          Menggantikan halaman error default SvelteKit yang polos.

  KAPAN DITAMPILKAN:
    - Error 404: Halaman tidak ditemukan (URL salah)
    - Error 500: Kesalahan internal server
    - Error lainnya: dari throw error() di load function / server

  KONSEP ERROR HANDLING di SvelteKit:
    SvelteKit otomatis menangkap error dan menampilkan file +error.svelte
    terdekat di hierarki layout. File ini ada di root, jadi menangkap
    SEMUA error dari halaman manapun.

  KONSEP $derived():
    $derived() = Svelte 5 rune untuk COMPUTED VALUE
    Nilainya otomatis dihitung ulang saat data sumber ($page) berubah
  ============================================================
-->
<script>
	// $app/stores → store SvelteKit yang berisi info halaman aktif
	// page berisi: URL, params, status HTTP, objek error
	import { page } from '$app/stores';

	// Import ikon dari Lucide (library ikon populer)
	// Compass = ikon kompas (untuk 404 — "tersesat")
	// AlertCircle = ikon peringatan (untuk error lain)
	// Home = ikon rumah (tombol kembali ke beranda)
	// ArrowLeft = ikon panah kiri (tombol kembali)
	import { Compass, AlertCircle, Home, ArrowLeft } from '@lucide/svelte';

	// SvelteKit automatically sets page status and error
	// $derived() mengambil nilai dari $page yang otomatis berubah saat error berbeda

	// Status HTTP error (404, 500, dll)
	let status = $derived($page.status);

	// Pesan error — dari server atau pesan default
	let message = $derived($page.error?.message || 'Terjadi kesalahan yang tidak terduga.');

	// Boolean: apakah ini error 404? Untuk menampilkan UI yang berbeda
	let is404 = $derived(status === 404);
</script>

<!-- Title dinamis sesuai status error -->
<svelte:head>
	<title>Error {status} - BotaniRent</title>
</svelte:head>

<!-- Container halaman error — centered, full screen -->
<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-cream)] p-6 text-center font-body select-none"
>
	<!-- Background organic circles/blobs for rich visual styling
	     Lingkaran besar semi-transparan di pojok halaman
	     Memberikan efek "organik" dan depth tanpa mengganggu konten
	     pointer-events-none = tidak bisa diklik (hanya dekoratif)
	     blur-3xl = blur sangat besar → terlihat seperti "cahaya" lembut -->
	<div
		class="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--color-sage-10)] blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[var(--color-warning-bg)] blur-3xl"
	></div>

	<!-- Konten utama error — dengan animasi fade-in -->
	<div class="animate-fade-in relative z-10 w-full max-w-md space-y-8">
		<!-- Error Visual Icon — ikon besar dalam lingkaran -->
		<div class="flex justify-center">
			<div
				class="relative rounded-full border border-[var(--color-border)] bg-[var(--color-sand)] p-8 text-[var(--color-forest)] shadow-md"
			>
				<!-- Tampilkan ikon berbeda berdasarkan tipe error:
				     404 = Compass (kompas bergoyang) → "tersesat, halaman tidak ditemukan"
				     Lain = AlertCircle (peringatan merah) → "ada error sistem" -->
				{#if is404}
					<Compass size={64} class="animate-bounce" />
				{:else}
					<AlertCircle size={64} class="text-[var(--color-error)]" />
				{/if}
				<!-- Tiny floating badge for status
				     Badge kecil di pojok kanan bawah ikon menampilkan kode status -->
				<span
					class="absolute -right-2 -bottom-2 rounded-full border-2 border-[var(--color-cream)] bg-[var(--color-forest)] px-3 py-1 font-mono text-xs font-bold text-white shadow-sm"
				>
					Code {status}
				</span>
			</div>
		</div>

		<!-- Error Messaging — pesan error untuk user -->
		<div class="space-y-3">
			<h1 class="font-heading text-4xl font-extrabold tracking-tight text-[var(--color-earth)]">
				<!-- Judul berbeda untuk 404 vs error lainnya -->
				{#if is404}
					Halaman Tidak Ditemukan
				{:else}
					Terjadi Kesalahan Sistem
				{/if}
			</h1>

			<p class="mx-auto max-w-sm text-sm leading-relaxed text-[var(--color-stone)]">
				<!-- Deskripsi error yang user-friendly (bukan teknis) -->
				{#if is404}
					Jalur yang Anda tuju salah atau halaman telah dipindahkan. Silakan kembali ke Beranda.
				{:else}
					Sistem mendeteksi error internal. Jangan khawatir, detail error di bawah telah dicatat
					untuk Owner.
				{/if}
			</p>

			<!-- Custom pretty error card
			     Menampilkan detail teknis error dalam card bergaya terminal/code
			     max-h-32 + overflow-y-auto = batas tinggi, jika lebih → bisa di-scroll
			     font-mono = font monospace agar terlihat teknis -->
			<div
				class="mt-4 max-h-32 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4 text-left shadow-inner"
			>
				<p class="font-mono text-xs font-medium break-words text-[var(--color-earth)]">
					<span class="font-bold text-[var(--color-error)]">[Error Info]:</span>
					{message}
				</p>
			</div>
		</div>

		<!-- Action Buttons — tombol navigasi untuk user -->
		<div class="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
			<!-- Tombol PRIMARY: Kembali ke Beranda (dashboard)
			     bg-forest = background hijau utama
			     hover:bg-forest-light = lebih terang saat hover
			     active:scale-[0.97] = sedikit mengecil saat ditekan (feedback visual) -->
			<a
				href="/dashboard"
				class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--color-forest)] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[var(--color-forest-light)] active:scale-[0.97] active:bg-[var(--color-forest-dark)]"
			>
				<Home size={18} /> Kembali ke Beranda
			</a>

			<!-- Tombol SECONDARY: Kembali ke halaman sebelumnya
			     history.back() = navigasi ke halaman sebelumnya di browser history
			     border + bg-transparent = tombol outline (tidak solid) -->
			<button
				onclick={() => history.back()}
				class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border-[1.5px] border-[var(--color-forest)] bg-transparent px-5 py-2.5 text-[14px] font-semibold text-[var(--color-forest)] transition-all hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)]"
			>
				<ArrowLeft size={18} /> Kembali Sebelumnya
			</button>
		</div>
	</div>
</div>
