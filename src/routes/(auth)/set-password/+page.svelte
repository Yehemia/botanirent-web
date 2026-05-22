<script>
	import { enhance } from '$app/forms';
	import { UserPlus, Lock, CheckCircle2 } from '@lucide/svelte';

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

<div class="min-h-screen bg-[var(--color-cream)] flex items-center justify-center p-6">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-8">
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-[var(--color-sage-20)] text-[var(--color-forest)] rounded-full flex items-center justify-center mx-auto mb-4">
				<UserPlus size={32} />
			</div>
			<h1 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Aktivasi Akun Staff</h1>
			<p class="text-[var(--color-stone)] text-sm mt-2">
				Halo! Silakan buat password untuk mengaktifkan akun Anda di BotaniRent.
			</p>
		</div>

		{#if form?.error}
			<div class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex gap-2">
				<span class="font-bold">Error:</span> {form.error}
			</div>
		{/if}

		<form method="POST" use:enhance={handleSubmit} class="space-y-6">
			<div class="space-y-4">
				<div class="flex flex-col gap-1.5">
					<label for="password" class="text-sm font-semibold text-[var(--color-earth)]">Buat Password</label>
					<div class="relative">
						<input 
							id="password" 
							name="password" 
							type="password" 
							placeholder="Minimal 6 karakter" 
							required 
							minlength="6"
							class="w-full bg-white border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] transition-all shadow-sm"
						/>
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-stone)]">
							<Lock size={18} />
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="confirmPassword" class="text-sm font-semibold text-[var(--color-earth)]">Konfirmasi Password</label>
					<div class="relative">
						<input 
							id="confirmPassword" 
							name="confirmPassword" 
							type="password" 
							placeholder="Ulangi password" 
							required
							class="w-full bg-white border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] transition-all shadow-sm"
						/>
						<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-stone)]">
							<CheckCircle2 size={18} />
						</div>
					</div>
				</div>
			</div>

			<button 
				type="submit" 
				disabled={loading}
				class="w-full bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)] text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 shadow-md active:scale-[0.98]"
			>
				{loading ? 'Mengaktifkan...' : 'Aktifkan Akun Saya'}
			</button>
		</form>
	</div>
</div>
