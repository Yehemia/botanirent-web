<script>
	import { enhance } from '$app/forms';
	import { Mail, Lock, Eye, EyeOff, Mountain, Tent, TreePine, ArrowRight } from '@lucide/svelte';

	let { data, form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);

	let googleFormElement;
	let nativeIdToken = $state('');

	async function handleGoogleClick(e) {
		e.preventDefault();

		// Check at click time (not onMount) because the detection script
		// is injected by Flutter AFTER the page finishes loading.
		const isWebView = !!(window.isFlutterWebView || window.__BOTANIRENT_MOBILE__);

		if (isWebView && window.flutter_inappwebview) {
			loading = true;
			try {
				const result = await window.flutter_inappwebview.callHandler('googleSignIn');
				if (result && result.idToken) {
					nativeIdToken = result.idToken;
					// Set action to token login
					googleFormElement.action = '?/googleTokenLogin';
					
					// Submit form programmatically after setting values
					setTimeout(() => {
						googleFormElement.submit();
					}, 50);
				} else {
					loading = false;
					if (result && result.error) {
						alert('Login Google gagal: ' + result.error);
					}
				}
			} catch (err) {
				console.error('[Web] Native Google Sign In error:', err);
				loading = false;
				alert('Error native Google Sign In. Membuka OAuth biasa...');
				googleFormElement.action = '?/googleOauth';
				googleFormElement.submit();
			}
		} else {
			// Ordinary web browser behavior
			googleFormElement.action = '?/googleOauth';
			googleFormElement.submit();
		}
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

<svelte:head>
	<title>Login — BotaniRent</title>
	<meta name="description" content="Masuk ke sistem manajemen BotaniRent Outdoor" />
</svelte:head>

<div class="login-page">
	<!-- Animated Background Pattern -->
	<div class="login-bg-pattern"></div>
	
	<!-- Mobile Hero Section (Dark Theme) -->
	<header class="login-mobile-header">
		<div class="pattern-overlay"></div>
		<!-- Animated Background Elements -->
		<div class="mobile-float-element float-1">
			<Mountain size={36} strokeWidth={1.5} />
		</div>
		<div class="mobile-float-element float-2">
			<Tent size={28} strokeWidth={1.5} />
		</div>
		<div class="mobile-float-element float-3">
			<TreePine size={24} strokeWidth={1.5} />
		</div>
		
		<div class="mobile-hero-content">
			<!-- Brand Logo Group -->
			<div class="mobile-logo-wrapper">
				<div class="logo-bg">
					<img src="/logo.svg" alt="Logo BotaniRent" class="mobile-hero-logo" />
				</div>
			</div>
			<h1 class="mobile-hero-title">
				BotaniRent <br/>
				<span class="text-botani-gold">Outdoor</span>
			</h1>
			<p class="mobile-hero-subtitle">
				Platform manajemen persewaan peralatan outdoor terlengkap.
			</p>
			<!-- Feature Chips (Mobile Row) -->
			<div class="mobile-hero-features">
				<div class="mobile-feature-pill">
					<div class="feature-dot"></div>
					<span>Multi-Cabang</span>
				</div>
				<div class="mobile-feature-pill">
					<div class="feature-dot"></div>
					<span>Real-time Tracking</span>
				</div>
				<div class="mobile-feature-pill">
					<div class="feature-dot"></div>
					<span>QRIS Payment</span>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Left Panel: Branding (Desktop) -->
	<div class="login-hero">
		<div class="hero-overlay"></div>
		<div class="hero-gradient"></div>
		
		<!-- Floating nature elements -->
		<div class="hero-float-element float-1">
			<Mountain size={28} strokeWidth={1.5} />
		</div>
		<div class="hero-float-element float-2">
			<Tent size={24} strokeWidth={1.5} />
		</div>
		<div class="hero-float-element float-3">
			<TreePine size={22} strokeWidth={1.5} />
		</div>
		
		<div class="hero-content">
			<!-- Logo -->
			<div class="hero-logo-wrapper">
				<img src="/logo.svg" alt="Logo BotaniRent" class="hero-logo" />
			</div>
			
			<h2 class="hero-title">BotaniRent<br/><span>Outdoor</span></h2>
			<p class="hero-subtitle">
				Platform manajemen persewaan peralatan outdoor terlengkap — dari inventaris, booking, hingga laporan keuangan.
			</p>
			
			<!-- Feature pills -->
			<div class="hero-features">
				<div class="hero-feature-pill">
					<div class="feature-dot"></div>
					<span>Multi-Cabang</span>
				</div>
				<div class="hero-feature-pill">
					<div class="feature-dot"></div>
					<span>Real-time Tracking</span>
				</div>
				<div class="hero-feature-pill">
					<div class="feature-dot"></div>
					<span>QRIS Payment</span>
				</div>
			</div>
		</div>
		
		<!-- Bottom attribution -->
		<div class="hero-footer">
			<p>© 2026 BotaniRent. All rights reserved.</p>
		</div>
	</div>

	<!-- Right Panel: Login Form -->
	<div class="login-form-panel">
		<div class="login-form-container">
			<!-- Greeting -->
			<div class="login-greeting">
				<h1 class="login-title">Selamat Datang</h1>
				<p class="login-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
			</div>

			<!-- Error Message -->
			{#if form?.error || data?.error}
				<div class="login-error" role="alert">
					<div class="login-error-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
					</div>
					<span>
						{#if form?.error}
							{form.error}
						{:else if data?.error === 'auth_callback_failed'}
							Verifikasi login Google gagal: {data.errorDescription || 'Silakan coba lagi.'}
						{:else}
							Error: {data.errorDescription || data.error}
						{/if}
					</span>
				</div>
			{/if}

			<!-- Login Form -->
			<form method="POST" action="?/login" use:enhance={handleSubmit} class="login-form">
				<!-- Email -->
				<div class="form-field">
					<label for="email" class="form-label">Email</label>
					<div class="input-wrapper">
						<div class="input-icon">
							<Mail size={18} />
						</div>
						<input 
							id="email" 
							name="email" 
							type="email" 
							placeholder="nama@botanirent.com" 
							required 
							autocomplete="email"
							value={form?.email ?? ''}
							class="form-input"
						/>
					</div>
				</div>

				<!-- Password -->
				<div class="form-field">
					<div class="form-label-row">
						<label for="password" class="form-label">Password</label>
						<!-- eslint-disable-next-line -->
						<a href="/forgot-password" class="forgot-link">Lupa password?</a>
					</div>
					<div class="input-wrapper">
						<div class="input-icon">
							<Lock size={18} />
						</div>
						<input 
							id="password" 
							name="password" 
							type={showPassword ? 'text' : 'password'} 
							placeholder="••••••••" 
							required
							autocomplete="current-password"
							class="form-input has-toggle"
						/>
						<button 
							type="button" 
							class="password-toggle"
							onclick={() => showPassword = !showPassword}
							tabindex="-1"
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
						>
							{#if showPassword}
								<EyeOff size={18} />
							{:else}
								<Eye size={18} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Remember me -->
				<div class="form-remember">
					<label class="remember-label">
						<input type="checkbox" name="remember" class="remember-checkbox" />
						<div class="custom-check">
							<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
						</div>
						<span>Ingat saya selama 30 hari</span>
					</label>
				</div>

				<!-- Submit -->
				<button type="submit" disabled={loading} class="login-submit-btn">
					{#if loading}
						<div class="login-spinner"></div>
						<span>Memproses...</span>
					{:else}
						<span>Masuk Sekarang</span>
						<ArrowRight size={18} />
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="login-divider">
				<div class="divider-line"></div>
				<span class="divider-text">atau</span>
				<div class="divider-line"></div>
			</div>

			<!-- Google OAuth / Native Sign-in -->
			<form method="POST" action="?/googleOauth" bind:this={googleFormElement}>
				<input type="hidden" name="idToken" value={nativeIdToken} />
				<button type="button" onclick={handleGoogleClick} disabled={loading} class="google-btn">
					<svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					<span>Masuk dengan Google</span>
				</button>
			</form>

			<!-- Footer -->
			<p class="login-footer">
				Belum punya akun? 
				<!-- eslint-disable-next-line -->
				<a href="mailto:owner@botanirent.com" class="login-footer-link">Hubungi Owner</a>
			</p>
		</div>
	</div>

	<!-- Mobile Footer -->
	<footer class="login-mobile-footer">
		<div class="footer-border"></div>
		<p>© 2026 BotaniRent. All rights reserved.</p>
	</footer>
</div>

<style>
	/* ─── Page Layout ─── */
	.login-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100dvh;
		background: var(--color-cream);
		font-family: var(--font-body);
		color: var(--color-earth);
		overflow-y: auto;
		position: relative;
	}

	@media (min-width: 768px) {
		.login-page {
			flex-direction: row;
			overflow: hidden;
		}
	}

	.login-bg-pattern {
		position: fixed;
		inset: 0;
		opacity: 0.03;
		background-image: radial-gradient(circle at 25% 25%, var(--color-forest) 1px, transparent 1px),
						  radial-gradient(circle at 75% 75%, var(--color-forest) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
		z-index: 0;
	}

	/* ─── Mobile Hero Section ─── */
	.login-mobile-header {
		display: block;
		background: #0d1a04;
		position: relative;
		overflow: hidden;
		padding: 36px 20px 44px 20px;
		text-align: center;
		z-index: 1;
	}

	@media (min-width: 768px) {
		.login-mobile-header {
			display: none;
		}
	}

	.pattern-overlay {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
		background-size: 24px 24px;
		pointer-events: none;
	}

	.mobile-float-element {
		position: absolute;
		color: rgba(255,255,255,0.08);
		z-index: 1;
	}

	.mobile-float-element.float-1 {
		top: 20px;
		left: 20px;
		transform: rotate(-12deg);
		animation: floatSlow 12s ease-in-out infinite;
	}

	.mobile-float-element.float-2 {
		top: 48px;
		right: 28px;
		transform: rotate(12deg);
		animation: floatSlow 10s ease-in-out infinite 2s;
	}

	.mobile-float-element.float-3 {
		bottom: 20px;
		left: 36px;
		animation: floatSlow 14s ease-in-out infinite 4s;
	}

	.mobile-hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.mobile-logo-wrapper {
		margin-bottom: 16px;
	}

	.mobile-logo-wrapper .logo-bg {
		background: rgba(255, 255, 255, 0.1);
		padding: 16px;
		border-radius: var(--radius-xl);
		display: inline-block;
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.mobile-hero-logo {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}

	.mobile-hero-title {
		font-family: var(--font-heading);
		font-size: 28px;
		font-weight: 700;
		color: white;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.mobile-hero-title .text-botani-gold {
		color: #e8c176;
	}

	.mobile-hero-subtitle {
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		line-height: 1.5;
		margin-top: 8px;
		max-width: 280px;
		margin-left: auto;
		margin-right: auto;
	}

	.mobile-hero-features {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 16px;
	}

	.mobile-feature-pill {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 6px 12px;
		border-radius: var(--radius-full);
	}

	.mobile-feature-pill span {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.mobile-feature-pill .feature-dot {
		width: 6px;
		height: 6px;
		background-color: #e8c176;
		border-radius: 50%;
		margin-right: 8px;
	}

	/* ─── Hero Panel (Desktop) ─── */
	.login-hero {
		display: none;
		width: 50%;
		position: relative;
		overflow: hidden;
		background: #0c1a0a;
	}

	@media (min-width: 768px) {
		.login-hero {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}
	}

	@media (min-width: 1280px) {
		.login-hero { width: 55%; }
		.login-form-panel { width: 45%; }
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background-image: url('https://images.unsplash.com/photo-1504280390224-3860bb4d1565?q=80&w=2070&auto=format&fit=crop');
		background-size: cover;
		background-position: center;
		opacity: 0.45;
		filter: saturate(0.8);
	}

	.hero-gradient {
		position: absolute;
		inset: 0;
		background: 
			linear-gradient(180deg, rgba(12,26,10,0.6) 0%, rgba(12,26,10,0.3) 40%, rgba(12,26,10,0.85) 100%),
			linear-gradient(135deg, rgba(45,80,22,0.4) 0%, transparent 60%);
	}

	/* Floating elements */
	.hero-float-element {
		position: absolute;
		color: rgba(255,255,255,0.08);
		z-index: 1;
	}
	.float-1 {
		top: 12%;
		left: 15%;
		animation: floatSlow 12s ease-in-out infinite;
	}
	.float-2 {
		top: 30%;
		right: 12%;
		animation: floatSlow 10s ease-in-out infinite 2s;
	}
	.float-3 {
		bottom: 20%;
		left: 20%;
		animation: floatSlow 14s ease-in-out infinite 4s;
	}

	@keyframes floatSlow {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-12px) rotate(3deg); }
	}

	.hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 48px 40px;
		max-width: 520px;
	}

	.hero-logo-wrapper {
		width: 88px;
		height: 88px;
		background: rgba(255,255,255,0.1);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255,255,255,0.15);
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 28px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.3);
	}

	.hero-logo {
		width: 56px;
		height: 56px;
		object-fit: contain;
		filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
	}

	.hero-title {
		font-family: var(--font-heading);
		font-size: 42px;
		font-weight: 700;
		color: white;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin-bottom: 16px;
	}
	.hero-title span {
		background: linear-gradient(135deg, var(--color-amber) 0%, #e8c96a 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		color: rgba(255,255,255,0.7);
		font-size: 15px;
		line-height: 1.7;
		max-width: 400px;
		margin-bottom: 32px;
	}

	.hero-features {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}

	.hero-feature-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(255,255,255,0.08);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 100px;
		font-size: 12px;
		font-weight: 600;
		color: rgba(255,255,255,0.8);
		letter-spacing: 0.02em;
	}

	.feature-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-amber);
		box-shadow: 0 0 8px rgba(212,168,67,0.5);
	}

	.hero-footer {
		position: absolute;
		bottom: 24px;
		left: 0;
		right: 0;
		text-align: center;
		z-index: 2;
	}
	.hero-footer p {
		color: rgba(255,255,255,0.3);
		font-size: 12px;
	}

	/* ─── Form Panel ─── */
	.login-form-panel {
		width: 100%;
		min-height: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px 24px 40px 24px;
		position: relative;
		z-index: 10;
		background: var(--color-cream);
		border-radius: 24px 24px 0 0;
		margin-top: -24px;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.04);
	}

	@media (min-width: 768px) {
		.login-form-panel {
			width: 50%;
			min-height: 100vh;
			min-height: 100dvh;
			padding: 48px 56px;
			border-radius: 0;
			margin-top: 0;
			z-index: 1;
			box-shadow: none;
		}
	}

	.login-form-container {
		width: 100%;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	/* ─── Mobile Footer ─── */
	.login-mobile-footer {
		display: block;
		background: var(--color-cream);
		padding: 16px 20px 32px 20px;
		text-align: center;
		z-index: 5;
		margin-top: auto;
	}

	@media (min-width: 768px) {
		.login-mobile-footer {
			display: none;
		}
	}

	.login-mobile-footer .footer-border {
		border-top: 1px solid var(--color-border-light);
		margin-bottom: 16px;
		width: 100%;
	}

	.login-mobile-footer p {
		font-size: 10px;
		color: var(--color-stone);
		opacity: 0.6;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	/* ─── Greeting ─── */
	.login-greeting {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.login-title {
		font-family: var(--font-heading);
		font-size: 30px;
		font-weight: 700;
		color: var(--color-earth);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.login-subtitle {
		font-size: 14px;
		color: var(--color-stone);
		line-height: 1.5;
	}

	/* ─── Error ─── */
	.login-error {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: linear-gradient(135deg, rgba(196,64,50,0.06), rgba(196,64,50,0.1));
		border: 1px solid rgba(196,64,50,0.15);
		border-radius: 14px;
		color: var(--color-error);
		font-size: 13px;
		font-weight: 500;
		line-height: 1.4;
		animation: shakeError 0.4s ease;
	}

	.login-error-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(196,64,50,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	@keyframes shakeError {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-6px); }
		40% { transform: translateX(6px); }
		60% { transform: translateX(-4px); }
		80% { transform: translateX(4px); }
	}

	/* ─── Form ─── */
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.form-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-earth);
	}

	.forgot-link {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-amber);
		text-decoration: none;
		transition: color 0.2s;
	}
	.forgot-link:hover {
		color: var(--color-terracotta);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 14px;
		color: var(--color-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		transition: color 0.2s;
		z-index: 1;
	}

	.form-input {
		width: 100%;
		height: 48px;
		padding: 0 16px 0 44px;
		background: white;
		border: 1.5px solid var(--color-border-light);
		border-radius: 14px;
		font-size: 14px;
		color: var(--color-earth);
		transition: all 0.25s ease;
		outline: none;
		font-family: var(--font-body);
	}
	.form-input.has-toggle {
		padding-right: 48px;
	}
	.form-input::placeholder {
		color: var(--color-muted);
	}
	.form-input:hover {
		border-color: var(--color-border);
	}
	.form-input:focus {
		border-color: var(--color-forest);
		box-shadow: 0 0 0 4px rgba(45,80,22,0.08);
	}
	.input-wrapper:focus-within .input-icon {
		color: var(--color-forest);
	}

	.password-toggle {
		position: absolute;
		right: 4px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted);
		cursor: pointer;
		border-radius: 10px;
		border: none;
		background: transparent;
		transition: all 0.2s;
	}
	.password-toggle:hover {
		color: var(--color-stone);
		background: var(--color-sand);
	}

	/* ─── Remember ─── */
	.form-remember {
		margin-top: -4px;
	}
	.remember-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-size: 13px;
		color: var(--color-stone);
		transition: color 0.2s;
		user-select: none;
	}
	.remember-label:hover {
		color: var(--color-earth);
	}
	.remember-checkbox {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.custom-check {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 1.5px solid var(--color-border);
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.2s ease;
		color: transparent;
	}
	.remember-checkbox:checked + .custom-check {
		background: var(--color-forest);
		border-color: var(--color-forest);
		color: white;
	}
	.remember-checkbox:focus-visible + .custom-check {
		box-shadow: 0 0 0 3px rgba(45,80,22,0.15);
	}

	/* ─── Submit Button ─── */
	.login-submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		height: 50px;
		border: none;
		border-radius: 14px;
		background: linear-gradient(135deg, var(--color-forest) 0%, var(--color-forest-light) 100%);
		color: white;
		font-size: 15px;
		font-weight: 700;
		font-family: var(--font-body);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 16px rgba(45,80,22,0.25), 0 1px 3px rgba(45,80,22,0.15);
		position: relative;
		overflow: hidden;
	}
	.login-submit-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s;
	}
	.login-submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(45,80,22,0.3), 0 2px 6px rgba(45,80,22,0.2);
	}
	.login-submit-btn:hover:not(:disabled)::before {
		opacity: 1;
	}
	.login-submit-btn:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
	}
	.login-submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.login-spinner {
		width: 18px;
		height: 18px;
		border: 2.5px solid rgba(255,255,255,0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ─── Divider ─── */
	.login-divider {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--color-border-light);
	}
	.divider-text {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* ─── Google Button ─── */
	.google-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		height: 48px;
		border-radius: 14px;
		border: 1.5px solid var(--color-border-light);
		background: white;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-earth);
		cursor: pointer;
		transition: all 0.25s ease;
		font-family: var(--font-body);
	}
	.google-btn:hover {
		background: var(--color-sand-lightest);
		border-color: var(--color-border);
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	.google-btn:active {
		transform: scale(0.98);
	}
	.google-icon {
		width: 20px;
		height: 20px;
	}

	/* ─── Footer ─── */
	.login-footer {
		text-align: center;
		font-size: 13px;
		color: var(--color-stone);
	}
	.login-footer-link {
		font-weight: 700;
		color: var(--color-forest);
		text-decoration: none;
		transition: color 0.2s;
	}
	.login-footer-link:hover {
		color: var(--color-forest-light);
		text-decoration: underline;
	}
</style>
