<script>
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-cream)] bg-[url('/pattern.svg')] p-4">
	<div class="w-full max-w-[420px]">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold font-heading text-[var(--color-forest)]">BotaniRent</h1>
			<p class="text-[var(--color-stone)] mt-2">Sistem Manajemen Rental & Retail Outdoor</p>
		</div>
		
		{@render children()}
	</div>
</div>
