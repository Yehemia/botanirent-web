<script>
	/**
	 * @typedef {Object} Props
	 * @property {'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary'} [variant]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let {
		variant = 'neutral',
		class: className = '',
		children
	} = $props();

	const baseClass = "inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide whitespace-nowrap";
	
	const variantClasses = {
		success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
		warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
		error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
		info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
		neutral: 'bg-[var(--color-sand)] text-[var(--color-stone)]',
		primary: 'bg-[var(--color-sage-10)] text-[var(--color-forest)]',
		secondary: 'bg-[rgba(212,168,67,0.1)] text-[var(--color-amber)]'
	};
</script>

<span class="{baseClass} {variantClasses[variant]} {className}">
	{@render children()}
</span>
