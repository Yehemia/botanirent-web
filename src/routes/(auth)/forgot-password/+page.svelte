<script>
	import { enhance } from '$app/forms';
	import { Mail, ArrowLeft, Send } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();
	
	let loading = $state(false);
	
	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleSubmit() {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-cream)] bg-[url('/pattern.svg')] p-4">
	<div class="bg-white rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden flex max-w-lg w-full mx-4">
	
	<div class="w-full p-8 sm:p-10 flex flex-col justify-center">
		<div class="mb-8 text-center">
			<div class="w-12 h-12 bg-[var(--color-sage-10)] text-[var(--color-forest)] rounded-full flex items-center justify-center mx-auto mb-4">
				<Mail size={24} />
			</div>
			<h2 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Lupa Password?</h2>
			<p class="text-[var(--color-stone)] text-sm mt-2">
				Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
			</p>
		</div>

		{#if form?.error}
			<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm p-3 rounded-md mb-6 border border-[var(--color-error)]/20 text-center">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="bg-[var(--color-success-bg)] text-[var(--color-success)] text-sm p-4 rounded-md mb-6 border border-[var(--color-success)]/20 text-center">
				<p class="font-bold mb-1">Cek Email Anda!</p>
				<p>Link reset password telah dikirim ke {form.email}</p>
			</div>
			
			<!-- eslint-disable-next-line -->
			<a href="/login" class="w-full">
				<Button variant="secondary" fullWidth class="mt-2">
					Kembali ke Halaman Login
				</Button>
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
				<a href="/login" class="inline-flex items-center text-sm font-semibold text-[var(--color-stone)] hover:text-[var(--color-forest)] transition-colors">
					<ArrowLeft size={16} class="mr-2" /> Kembali ke Login
				</a>
			</div>
		{/if}
	</div>

	</div>
</div>
