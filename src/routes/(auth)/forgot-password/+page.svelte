<script>
	import { enhance } from '$app/forms';
	import { Mail, ArrowLeft, Send, Phone } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();

	let loading = $state(false);

	/**
	 * Menyensor digit tengah nomor telepon untuk alasan keamanan (e.g. 0812*****890)
	 * @param {string} phone
	 */
	function maskPhoneNumber(phone) {
		if (!phone) return '';
		const clean = phone.replace(/[^0-9]/g, '');
		if (clean.length < 6) return clean;
		return clean.substring(0, 4) + '*'.repeat(clean.length - 7) + clean.substring(clean.length - 3);
	}

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleSubmit() {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-[var(--color-cream)] bg-[url('/pattern.svg')] p-4"
>
	<div
		class="mx-4 flex w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xl)]"
	>
		<div class="flex w-full flex-col justify-center p-8 sm:p-10">
			<div class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-sage-10)] text-[var(--color-forest)]"
				>
					<Phone size={24} />
				</div>
				<h2 class="font-heading text-2xl font-bold text-[var(--color-earth)]">Lupa Password?</h2>
				<p class="mt-2 text-sm text-[var(--color-stone)]">
					Masukkan email Anda, dan kami akan mengirimkan link reset password ke nomor WhatsApp yang terdaftar.
				</p>
			</div>

			{#if form?.error}
				<div
					class="mb-6 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-3 text-center text-sm text-[var(--color-error)]"
				>
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div
					class="mb-6 rounded-md border border-[var(--color-success)]/20 bg-[var(--color-success-bg)] p-4 text-center text-sm text-[var(--color-success)]"
				>
					<p class="mb-1 font-bold text-base">Tautan WhatsApp Terkirim!</p>
					<p class="mb-2">Link reset password telah berhasil dikirim ke nomor WhatsApp yang terdaftar:</p>
					<strong class="block font-mono text-base tracking-wider text-[var(--color-success)]">{maskPhoneNumber(form.phone)}</strong>
				</div>

				<!-- eslint-disable-next-line -->
				<a href="/login" class="w-full">
					<Button variant="secondary" fullWidth class="mt-2">Kembali ke Halaman Login</Button>
				</a>
			{:else}
				<form method="POST" action="?/reset" use:enhance={handleSubmit} class="space-y-5">
					<Input
						id="email"
						name="email"
						type="email"
						label="Email Address"
						placeholder="contoh@botanirent.com"
						required
					>
						{#snippet iconLeft()}
							<Mail size={18} />
						{/snippet}
					</Input>

					<Button type="submit" fullWidth disabled={loading} class="mt-6">
						{#if loading}
							Mengirim...
						{:else}
							<span class="flex items-center gap-2">
								Kirim Link Reset <Send size={16} />
							</span>
						{/if}
					</Button>
				</form>

				<div class="mt-6 text-center">
					<!-- eslint-disable-next-line -->
					<a
						href="/login"
						class="inline-flex items-center text-sm font-semibold text-[var(--color-stone)] transition-colors hover:text-[var(--color-forest)]"
					>
						<ArrowLeft size={16} class="mr-2" /> Kembali ke Login
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
