<!--
  ============================================================
  FILE: Modal.svelte
  TUJUAN: Komponen MODAL (dialog popup) REUSABLE.
          Modal muncul di atas halaman dengan overlay gelap di belakangnya.

  CARA PAKAI:
    <Modal bind:open={showModal} title="Konfirmasi Hapus" size="sm">
      <p>Yakin ingin menghapus data ini?</p>
      {#snippet footer()}
        <Button variant="ghost" onclick={() => showModal = false}>Batal</Button>
        <Button variant="danger" onclick={handleDelete}>Hapus</Button>
      {/snippet}
    </Modal>

  PROPS:
    open             = status buka/tutup (boolean, $bindable = two-way binding)
    onclose          = callback saat modal ditutup
    title            = judul modal
    size             = ukuran: 'sm' (480px) | 'md' (640px) | 'lg' (860px)
    hideCloseButton  = sembunyikan tombol X
    children         = konten utama modal
    footer           = snippet untuk tombol-tombol di bawah

  FITUR AKSESIBILITAS:
    - Tombol Escape untuk menutup
    - role="dialog" dan aria-modal="true"
    - Klik di luar modal (backdrop) untuk menutup

  KONSEP SVELTE TRANSITION:
    Svelte menyediakan animasi bawaan (fade, scale, slide)
    yang otomatis berjalan saat elemen muncul/menghilang dari DOM.
  ============================================================
-->
<script>
	// Import transisi bawaan Svelte
	// fade = animasi transparan ↔ terlihat (untuk overlay)
	// scale = animasi mengecil ↔ ukuran normal (untuk panel modal)
	import { fade, scale } from 'svelte/transition';

	// Ikon X (tombol tutup) dari library Lucide
	import { X } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open - status buka/tutup modal
	 * @property {Function} [onclose] - callback dipanggil saat modal ditutup
	 * @property {string} [title] - judul di atas modal
	 * @property {'sm' | 'md' | 'lg'} [size] - ukuran lebar modal
	 * @property {boolean} [hideCloseButton] - sembunyikan tombol X
	 * @property {import('svelte').Snippet} [children] - konten utama
	 * @property {import('svelte').Snippet} [footer] - snippet untuk tombol-tombol bawah
	 */

	/** @type {Props} */
	let {
		open = $bindable(false),
		// $bindable = prop yang bisa diubah dari DALAM komponen ini
		// Saat modal menutup diri, 'open' di parent juga ikut berubah jadi false
		// Tanpa $bindable: parent harus mendengarkan event onclose dan ubah sendiri

		onclose, // Callback tambahan saat modal ditutup (opsional)
		title = '', // Judul modal (kosong = tanpa judul)
		size = 'md', // Default ukuran = medium (640px)
		hideCloseButton = false, // Default tampilkan tombol X
		children, // Konten utama modal
		footer // Snippet untuk footer (tombol Batal, Simpan, dll)
	} = $props();

	// Mapping ukuran modal ke max-width CSS
	const sizeClasses = {
		sm: 'max-w-[480px]', // Kecil — untuk konfirmasi sederhana
		md: 'max-w-[640px]', // Sedang — untuk form standar
		lg: 'max-w-[860px]' // Besar — untuk form kompleks / tabel
	};

	// ─────────────────────────────────────────────────
	// EVENT HANDLERS
	// ─────────────────────────────────────────────────

	/** Klik di area GELAP (backdrop) → tutup modal
	 *  e.target === e.currentTarget: pastikan yang diklik adalah backdrop itu sendiri,
	 *  BUKAN elemen anak di dalamnya (panel modal)
	 * @param {MouseEvent} e
	 */
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	// Tutup modal: set open = false dan panggil callback onclose jika ada
	function close() {
		open = false;
		if (onclose) onclose();
	}

	// Handle escape key — tekan Esc untuk menutup modal (UX standar)
	/** @param {KeyboardEvent} e */
	function handleKeydown(e) {
		if (open && e.key === 'Escape') {
			close();
		}
	}
</script>

<!-- GLOBAL EVENT LISTENER: tangkap semua keydown di window
     Ini perlu di GLOBAL karena modal mungkin tidak mendapat fokus -->
<svelte:window on:keydown={handleKeydown} />

<!-- CONDITIONAL RENDERING: modal hanya ada di DOM saat open = true -->
{#if open}
	<!-- ═══════ BACKDROP (overlay gelap) ═══════
	     fixed inset-0 = menutupi seluruh layar
	     z-50 = di atas semua elemen lain
	     bg-earth/50 = background semi-transparan (50% opacity)
	     backdrop-blur-[4px] = blur halus pada konten di belakang modal
	     
	     transition:fade = animasi Svelte: muncul/hilang dengan fade effect -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-earth)]/50 p-4 backdrop-blur-[4px]"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 250 }}
	>
		<!-- ═══════ PANEL MODAL ═══════
		     rounded-xl = sudut bulat
		     bg-white = background putih
		     shadow-xl = shadow besar
		     max-h-[90vh] = tinggi max 90% layar (agar tidak overflow)
		     flex flex-col = layout vertikal (title → content → footer)
		     
		     transition:scale = animasi Svelte: muncul dari 95% → 100% ukuran -->
		<div
			class="w-full rounded-xl bg-white shadow-[var(--shadow-xl)] {sizeClasses[
				size
			]} relative flex max-h-[90vh] flex-col"
			transition:scale={{ duration: 250, start: 0.95, opacity: 0 }}
			role="dialog"
			aria-modal="true"
		>
			<!-- HEADER: Judul modal (opsional) -->
			{#if title}
				<div class="px-6 pt-6 pb-4">
					<h3 class="font-heading text-xl font-bold text-[var(--color-earth)]">
						{title}
					</h3>
				</div>
			{/if}

			<!-- TOMBOL TUTUP (X) di pojok kanan atas -->
			{#if !hideCloseButton}
				<button
					type="button"
					class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)]"
					onclick={close}
					aria-label="Close"
				>
					<X size={20} />
				</button>
			{/if}

			<!-- BODY: Konten utama modal (scrollable jika terlalu panjang) -->
			<div class="flex-grow overflow-y-auto px-6 py-2">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- FOOTER: Tombol-tombol aksi (opsional)
			     mt-auto = dorong ke bawah (selalu di bagian bawah modal)
			     border-t = garis pemisah tipis di atas footer -->
			{#if footer}
				<div
					class="mt-auto flex justify-end gap-3 border-t border-[var(--color-border-light)]/50 px-6 py-6"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
