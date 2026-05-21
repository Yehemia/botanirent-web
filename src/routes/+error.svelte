<script>
	import { page } from '$app/stores';
	import { Compass, AlertCircle, Home, ArrowLeft } from '@lucide/svelte';

	// SvelteKit automatically sets page status and error
	let status = $derived($page.status);
	let message = $derived($page.error?.message || 'Terjadi kesalahan yang tidak terduga.');

	let is404 = $derived(status === 404);
</script>

<svelte:head>
	<title>Error {status} - BotaniRent</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-cream)] flex flex-col items-center justify-center p-6 text-center select-none font-body relative overflow-hidden">
	<!-- Background organic circles/blobs for rich visual styling -->
	<div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--color-sage-10)] blur-3xl pointer-events-none"></div>
	<div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[var(--color-warning-bg)] blur-3xl pointer-events-none"></div>

	<div class="max-w-md w-full space-y-8 animate-fade-in relative z-10">
		<!-- Error Visual Icon -->
		<div class="flex justify-center">
			<div class="p-8 rounded-full bg-[var(--color-sand)] text-[var(--color-forest)] border border-[var(--color-border)] shadow-md relative">
				{#if is404}
					<Compass size={64} class="animate-bounce" />
				{:else}
					<AlertCircle size={64} class="text-[var(--color-error)]" />
				{/if}
				<!-- Tiny floating badge for status -->
				<span class="absolute -bottom-2 -right-2 px-3 py-1 bg-[var(--color-forest)] text-white text-xs font-mono font-bold rounded-full border-2 border-[var(--color-cream)] shadow-sm">
					Code {status}
				</span>
			</div>
		</div>

		<!-- Error Messaging -->
		<div class="space-y-3">
			<h1 class="text-4xl font-extrabold font-heading text-[var(--color-earth)] tracking-tight">
				{#if is404}
					Halaman Tidak Ditemukan
				{:else}
					Terjadi Kesalahan Sistem
				{/if}
			</h1>
			
			<p class="text-sm text-[var(--color-stone)] leading-relaxed max-w-sm mx-auto">
				{#if is404}
					Jalur yang Anda tuju salah atau halaman telah dipindahkan. Silakan kembali ke Beranda.
				{:else}
					Sistem mendeteksi error internal. Jangan khawatir, detail error di bawah telah dicatat untuk Owner.
				{/if}
			</p>

			<!-- Custom pretty error card -->
			<div class="bg-[var(--color-sand-lightest)] border border-[var(--color-border)] p-4 rounded-xl text-left max-h-32 overflow-y-auto mt-4 shadow-inner">
				<p class="text-xs font-mono text-[var(--color-earth)] break-words font-medium">
					<span class="text-[var(--color-error)] font-bold">[Error Info]:</span> {message}
				</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
			<a 
				href="/dashboard"
				class="inline-flex items-center justify-center font-semibold rounded-md transition-all px-5 py-2.5 text-[14px] h-10 gap-2 bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-light)] active:bg-[var(--color-forest-dark)] active:scale-[0.97]"
			>
				<Home size={18} /> Kembali ke Beranda
			</a>
			
			<button 
				onclick={() => history.back()}
				class="inline-flex items-center justify-center font-semibold rounded-md transition-all px-5 py-2.5 text-[14px] h-10 gap-2 bg-transparent border-[1.5px] border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)] cursor-pointer"
			>
				<ArrowLeft size={18} /> Kembali Sebelumnya
			</button>
		</div>
	</div>
</div>
