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

<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-cream)] p-6 text-center font-body select-none"
>
	<!-- Background organic circles/blobs for rich visual styling -->
	<div
		class="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[var(--color-sage-10)] blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-[var(--color-warning-bg)] blur-3xl"
	></div>

	<div class="animate-fade-in relative z-10 w-full max-w-md space-y-8">
		<!-- Error Visual Icon -->
		<div class="flex justify-center">
			<div
				class="relative rounded-full border border-[var(--color-border)] bg-[var(--color-sand)] p-8 text-[var(--color-forest)] shadow-md"
			>
				{#if is404}
					<Compass size={64} class="animate-bounce" />
				{:else}
					<AlertCircle size={64} class="text-[var(--color-error)]" />
				{/if}
				<!-- Tiny floating badge for status -->
				<span
					class="absolute -right-2 -bottom-2 rounded-full border-2 border-[var(--color-cream)] bg-[var(--color-forest)] px-3 py-1 font-mono text-xs font-bold text-white shadow-sm"
				>
					Code {status}
				</span>
			</div>
		</div>

		<!-- Error Messaging -->
		<div class="space-y-3">
			<h1 class="font-heading text-4xl font-extrabold tracking-tight text-[var(--color-earth)]">
				{#if is404}
					Halaman Tidak Ditemukan
				{:else}
					Terjadi Kesalahan Sistem
				{/if}
			</h1>

			<p class="mx-auto max-w-sm text-sm leading-relaxed text-[var(--color-stone)]">
				{#if is404}
					Jalur yang Anda tuju salah atau halaman telah dipindahkan. Silakan kembali ke Beranda.
				{:else}
					Sistem mendeteksi error internal. Jangan khawatir, detail error di bawah telah dicatat
					untuk Owner.
				{/if}
			</p>

			<!-- Custom pretty error card -->
			<div
				class="mt-4 max-h-32 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-sand-lightest)] p-4 text-left shadow-inner"
			>
				<p class="font-mono text-xs font-medium break-words text-[var(--color-earth)]">
					<span class="font-bold text-[var(--color-error)]">[Error Info]:</span>
					{message}
				</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
			<a
				href="/dashboard"
				class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--color-forest)] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[var(--color-forest-light)] active:scale-[0.97] active:bg-[var(--color-forest-dark)]"
			>
				<Home size={18} /> Kembali ke Beranda
			</a>

			<button
				onclick={() => history.back()}
				class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border-[1.5px] border-[var(--color-forest)] bg-transparent px-5 py-2.5 text-[14px] font-semibold text-[var(--color-forest)] transition-all hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)]"
			>
				<ArrowLeft size={18} /> Kembali Sebelumnya
			</button>
		</div>
	</div>
</div>
