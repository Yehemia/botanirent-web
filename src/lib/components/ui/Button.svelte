<script>
	/**
	 * @typedef {Object} Props
	 * @property {'button' | 'submit' | 'reset'} [type]
	 * @property {'primary' | 'secondary' | 'danger' | 'ghost'} [variant]
	 * @property {'sm' | 'md' | 'lg'} [size]
	 * @property {boolean} [disabled]
	 * @property {boolean} [fullWidth]
	 * @property {string} [class]
	 * @property {Function} [onclick]
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} [iconRight]
	 */

	/** @type {Props} */
	let {
		type = 'button',
		variant = 'primary',
		size = 'md',
		disabled = false,
		fullWidth = false,
		class: className = '',
		onclick,
		children,
		iconLeft,
		iconRight,
		...rest
	} = $props();

	const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-light)] focus-visible:ring-[var(--color-forest)] active:bg-[var(--color-forest-dark)] active:scale-[0.97]',
		secondary: 'bg-transparent border-[1.5px] border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-sage-10)] active:bg-[var(--color-sage-20)] focus-visible:ring-[var(--color-forest)]',
		danger: 'bg-[var(--color-error)] text-white hover:bg-[#A83428] focus-visible:ring-[var(--color-error)]',
		ghost: 'bg-transparent text-[var(--color-stone)] hover:bg-[var(--color-sand)] active:bg-[var(--color-sand-light)] focus-visible:ring-[var(--color-border)]'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-[13px] h-8 gap-2',
		md: 'px-5 py-2.5 text-[14px] h-10 gap-2',
		lg: 'px-7 py-3 text-[16px] h-12 gap-3'
	};

	const widthClass = fullWidth ? 'w-full' : '';
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {widthClass} {className}"
	{...rest}
>
	{#if iconLeft}
		<span class="flex-shrink-0">
			{@render iconLeft()}
		</span>
	{/if}
	
	{#if children}
		{@render children()}
	{/if}
	
	{#if iconRight}
		<span class="flex-shrink-0">
			{@render iconRight()}
		</span>
	{/if}
</button>
