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

<div class="flex min-h-screen items-center justify-center bg-[var(--color-cream)] p-6">
	<div
		class="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-xl"
	>
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-sage-20)] text-[var(--color-forest)]"
			>
				<UserPlus size={32} />
			</div>
			<h1 class="font-heading text-2xl font-bold text-[var(--color-earth)]">Aktivasi Akun Staff</h1>
			<p class="mt-2 text-sm text-[var(--color-stone)]">
				Halo! Silakan buat password untuk mengaktifkan akun Anda di BotaniRent.
			</p>
		</div>

		{#if form?.error}
			<div
				class="mb-6 flex gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600"
			>
				<span class="font-bold">Error:</span>
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance={handleSubmit} class="space-y-6">
			<div class="space-y-4">
				<div class="flex flex-col gap-1.5">
					<label for="password" class="text-sm font-semibold text-[var(--color-earth)]"
						>Buat Password</label
					>
					<div class="relative">
						<input
							id="password"
							name="password"
							type="password"
							placeholder="Minimal 6 karakter"
							required
							minlength="6"
							class="w-full rounded-xl border border-[var(--color-border)] bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition-all focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] focus:outline-none"
						/>
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-stone)]"
						>
							<Lock size={18} />
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="confirmPassword" class="text-sm font-semibold text-[var(--color-earth)]"
						>Konfirmasi Password</label
					>
					<div class="relative">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							placeholder="Ulangi password"
							required
							class="w-full rounded-xl border border-[var(--color-border)] bg-white py-3 pr-4 pl-11 text-sm shadow-sm transition-all focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] focus:outline-none"
						/>
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--color-stone)]"
						>
							<CheckCircle2 size={18} />
						</div>
					</div>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-xl bg-[var(--color-forest)] px-4 py-3 font-medium text-white shadow-md transition-all hover:bg-[var(--color-forest-dark)] active:scale-[0.98] disabled:opacity-70"
			>
				{loading ? 'Mengaktifkan...' : 'Aktifkan Akun Saya'}
			</button>
		</form>
	</div>
</div>
