<script>
	import { enhance } from '$app/forms';
	import { Mail, Lock } from '@lucide/svelte';

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

<div class="bg-[var(--color-cream)] font-body text-[var(--color-earth)] h-screen w-full overflow-hidden flex">
	
	<!-- Left Side: Hero Image & Branding -->
	<div class="hidden md:flex w-[55%] h-full relative flex-col items-center justify-center bg-black">
		<div class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60" style="background-image: url('https://images.unsplash.com/photo-1504280390224-3860bb4d1565?q=80&w=2070&auto=format&fit=crop');"></div>
		<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
		
		<div class="relative z-10 flex flex-col items-center text-center px-10">
			<!-- Logo Text as Placeholder for Image -->
			<div class="w-32 h-32 rounded-full bg-[var(--color-forest)] border-4 border-white/20 shadow-xl flex items-center justify-center mb-8">
				<span class="text-4xl font-bold text-white font-heading">BR</span>
			</div>
			
			<h2 class="text-4xl font-bold font-heading text-white mb-4">BotaniRent Outdoor</h2>
			<p class="text-white/80 text-lg max-w-md">
				Sistem manajemen andal untuk menyederhanakan operasional persewaan peralatan outdoor Anda di seluruh cabang.
			</p>
			
			<div class="mt-12 flex gap-4 text-left">
				<div class="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4">
					<div class="p-3 bg-[var(--color-amber)] text-white rounded-full">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
					</div>
					<div>
						<h4 class="text-white font-semibold">Verified Gear</h4>
						<p class="text-white/70 text-sm">Inventaris selalu terjaga</p>
					</div>
				</div>
				<div class="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4">
					<div class="p-3 bg-[var(--color-forest)] text-white rounded-full">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
					</div>
					<div>
						<h4 class="text-white font-semibold">Multi-Cabang</h4>
						<p class="text-white/70 text-sm">Kelola dari satu sistem</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Right Side: Login Form -->
	<div class="w-full md:w-[45%] h-full flex items-center justify-center p-8 sm:p-12 relative overflow-y-auto">
		<div class="w-full max-w-md flex flex-col gap-10 relative z-10">
			
			<!-- Header -->
			<div class="text-center md:text-left space-y-3">
				<!-- Mobile Logo -->
				<div class="md:hidden w-16 h-16 rounded-full bg-[var(--color-forest)] flex items-center justify-center mx-auto mb-6">
					<span class="text-xl font-bold text-white font-heading">BR</span>
				</div>
				<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)] tracking-tight">Login BotaniRent</h1>
				<p class="text-[var(--color-stone)] text-sm">Selamat datang kembali! Silakan masukkan kredensial Anda.</p>
			</div>

			{#if form?.error}
				<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm p-4 rounded-lg border border-[var(--color-error)]/20 flex items-center gap-3">
					<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Form -->
			<form method="POST" action="?/login" use:enhance={handleSubmit} class="flex flex-col gap-6">
				<div class="space-y-4">
					<div class="flex flex-col gap-1.5">
						<label for="email" class="text-sm font-semibold text-[var(--color-earth)]">Email Address</label>
						<div class="relative">
							<input 
								id="email" 
								name="email" 
								type="email" 
								placeholder="contoh@botanirent.com" 
								required 
								value={form?.email ?? ''}
								class="w-full bg-white border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] transition-all shadow-sm"
							/>
							<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-stone)]">
								<Mail size={18} />
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-1.5">
						<label for="password" class="text-sm font-semibold text-[var(--color-earth)]">Password</label>
						<div class="relative">
							<input 
								id="password" 
								name="password" 
								type="password" 
								placeholder="••••••••" 
								required
								class="w-full bg-white border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] transition-all shadow-sm"
							/>
							<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-stone)]">
								<Lock size={18} />
							</div>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<label class="flex items-center gap-2 cursor-pointer group">
						<input type="checkbox" name="remember" class="w-4 h-4 rounded text-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/30 border-gray-300">
						<span class="text-sm text-[var(--color-stone)] group-hover:text-[var(--color-earth)] transition-colors">Ingat saya</span>
					</label>
					
					<!-- eslint-disable-next-line -->
					<a href="/forgot-password" class="text-sm font-semibold text-[var(--color-amber)] hover:text-[var(--color-clay)] transition-colors">
						Lupa kata sandi?
					</a>
				</div>

				<button type="submit" disabled={loading} class="w-full bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)] text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[var(--color-forest)]/20 active:scale-[0.98]">
					{#if loading}
						Memproses...
					{:else}
						Masuk Sekarang
					{/if}
				</button>
			</form>

			<div class="relative flex items-center">
				<div class="flex-grow border-t border-[var(--color-border)]"></div>
				<span class="flex-shrink-0 mx-4 text-[var(--color-stone)] text-xs font-medium uppercase tracking-wider">atau masuk dengan</span>
				<div class="flex-grow border-t border-[var(--color-border)]"></div>
			</div>

			<form method="POST" action="?/googleOauth">
				<button type="submit" class="w-full bg-white hover:bg-gray-50 border border-[var(--color-border)] text-[var(--color-earth)] font-medium py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98]">
					<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Lanjutkan dengan Google
				</button>
			</form>
			
			<div class="text-center mt-2">
				<!-- eslint-disable-next-line -->
				<p class="text-sm text-[var(--color-stone)]">Belum punya akses? <a href="mailto:owner@botanirent.com" class="font-semibold text-[var(--color-forest)] hover:underline">Hubungi Owner</a></p>
			</div>
		</div>
	</div>

</div>
