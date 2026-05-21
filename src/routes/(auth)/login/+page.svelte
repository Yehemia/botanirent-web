<script>
	import { enhance } from '$app/forms';
	import { Mail, Lock, LogIn, ArrowRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();
	
	let loading = $state(false);
	
	function handleSubmit() {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}
</script>

<div class="bg-white rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden flex max-w-4xl w-full mx-4">
	
	<!-- Left Side: Login Form -->
	<div class="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
		<div class="mb-8">
			<h2 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Selamat Datang Kembali</h2>
			<p class="text-[var(--color-stone)] text-sm mt-1">Masuk untuk mengelola rental dan inventaris cabang Anda.</p>
		</div>

		{#if form?.error}
			<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm p-3 rounded-md mb-6 border border-[var(--color-error)]/20">
				{form.error}
			</div>
		{/if}

		<form method="POST" action="?/login" use:enhance={handleSubmit} class="space-y-5">
			<Input 
				id="email" 
				name="email" 
				type="email" 
				label="Email Address" 
				placeholder="contoh@botanirent.com" 
				required 
				value={form?.email ?? ''}
			>
				{#snippet iconLeft()}
					<Mail size={18} />
				{/snippet}
			</Input>

			<Input 
				id="password" 
				name="password" 
				type="password" 
				label="Password" 
				placeholder="••••••••" 
				required
			>
				{#snippet iconLeft()}
					<Lock size={18} />
				{/snippet}
			</Input>

			<div class="flex items-center justify-between mt-2">
				<label class="flex items-center gap-2 cursor-pointer group">
					<input type="checkbox" name="remember" class="w-4 h-4 rounded text-[var(--color-forest)] focus:ring-[var(--color-forest)] border-gray-300">
					<span class="text-sm text-[var(--color-stone)] group-hover:text-[var(--color-earth)] transition-colors">Ingat saya</span>
				</label>
				
				<a href="/forgot-password" class="text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-forest-dark)] transition-colors">
					Lupa Password?
				</a>
			</div>

			<Button type="submit" fullWidth disabled={loading} class="mt-6">
				{#if loading}
					Memproses...
				{:else}
					<span class="flex items-center gap-2">
						Masuk Sekarang <LogIn size={18} />
					</span>
				{/if}
			</Button>
		</form>

		<div class="relative flex py-6 items-center">
			<div class="flex-grow border-t border-gray-200"></div>
			<span class="flex-shrink-0 mx-4 text-[var(--color-stone)] text-sm">atau lanjutkan dengan</span>
			<div class="flex-grow border-t border-gray-200"></div>
		</div>

		<form method="POST" action="?/googleOauth">
			<Button type="submit" variant="secondary" fullWidth class="bg-white">
				{#snippet iconLeft()}
					<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
				{/snippet}
				Google
			</Button>
		</form>
	</div>

	<!-- Right Side: Visual -->
	<div class="hidden md:block w-1/2 bg-[var(--color-forest)] relative">
		<!-- Placeholder untuk gambar alam/tenda, sekarang pakai gradient/pattern -->
		<div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
		<div class="absolute inset-0 bg-gradient-to-t from-[var(--color-forest-dark)] to-transparent"></div>
		
		<div class="absolute bottom-0 left-0 p-10 text-white">
			<h3 class="text-3xl font-bold font-heading mb-3">Jelajahi Alam.</h3>
			<p class="text-white/80 leading-relaxed text-sm max-w-sm">
				Sistem manajemen yang andal untuk menyederhanakan operasional persewaan peralatan outdoor Anda di seluruh cabang.
			</p>
			
			<div class="mt-8 flex gap-2">
				<div class="w-10 h-1 bg-[var(--color-amber)] rounded-full"></div>
				<div class="w-2 h-1 bg-white/30 rounded-full"></div>
				<div class="w-2 h-1 bg-white/30 rounded-full"></div>
			</div>
		</div>
	</div>

</div>
