<script>
	import { enhance } from '$app/forms';
	import { ShieldAlert, UserPlus, KeyRound, TreePine } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data, form } = $props();
	let loading = $state(false);

	const isRecovery = $derived(data.type === 'recovery');
</script>

<svelte:head>
	<title>{isRecovery ? 'Pemulihan Akun' : 'Aktivasi Akun'} — BotaniRent</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#FAF6F0] px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(45,80,22,0.03)] border border-[#2D5016]/5 text-center">
		<!-- Header Logo -->
		<div class="flex flex-col items-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D5016]/10 text-[#2D5016] mb-4">
				{#if isRecovery}
					<KeyRound size={32} />
				{:else}
					<UserPlus size={32} />
				{/if}
			</div>
			
			<div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B8F4E] mb-2">
				<TreePine size={14} />
				<span>Sistem Keamanan BotaniRent</span>
			</div>

			<h2 class="text-2xl font-bold tracking-tight text-[#2D5016]">
				{#if isRecovery}
					Atur Ulang Kata Sandi
				{:else}
					Aktivasi Akun Staff
				{/if}
			</h2>
			<p class="mt-2 text-sm text-[#6B8F4E] leading-relaxed">
				{#if isRecovery}
					Konfirmasi permintaan pengaturan ulang kata sandi Anda.
				{:else}
					Konfirmasi pendaftaran akun Anda sebagai staf BotaniRent.
				{/if}
			</p>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm text-[var(--color-error)] flex items-start gap-3 text-left">
				<ShieldAlert size={18} class="shrink-0 mt-0.5" />
				<div>
					<p class="font-semibold">Verifikasi Gagal</p>
					<p class="text-xs mt-1 text-[var(--color-error)]/80 leading-relaxed">{form.error}</p>
					<p class="text-[11px] mt-2 text-[var(--color-stone)] leading-relaxed">
						Token ini mungkin sudah kedaluwarsa atau telah digunakan. Silakan minta tautan baru dari Owner.
					</p>
				</div>
			</div>
		{/if}

		<!-- Action Block -->
		<form
			method="POST"
			action="?/verify"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="token_hash" value={data.token_hash} />
			<input type="hidden" name="type" value={data.type} />
			<input type="hidden" name="next" value={data.next} />

			<div class="rounded-xl bg-[#FAF6F0]/80 border border-[#2D5016]/5 p-4 text-xs text-[#6B8F4E] text-left leading-relaxed">
				<strong>Mengapa langkah ini ada?</strong><br>
				Kami menggunakan klik konfirmasi ini untuk melindungi akun Anda dari pemindaian otomatis (prefetching/crawler) oleh aplikasi pesan seperti WhatsApp atau program antivirus.
			</div>

			<Button
				type="submit"
				disabled={loading}
				class="w-full py-6 text-sm font-semibold tracking-wide bg-[#2D5016] text-white hover:bg-[#2D5016]/90 transition-colors shadow-[0_4px_14px_rgba(45,80,22,0.15)]"
			>
				{loading ? 'Memproses Verifikasi...' : (isRecovery ? 'Lanjutkan ke Reset Password' : 'Verifikasi & Aktifkan Akun')}
			</Button>
		</form>

		<!-- Footer Link -->
		<div class="mt-4 pt-2 border-t border-gray-100">
			<a
				href="/login"
				class="text-xs font-semibold text-[#6B8F4E] hover:text-[#2D5016] transition-colors"
			>
				Kembali ke Login
			</a>
		</div>
	</div>
</div>
