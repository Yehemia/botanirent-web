<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {boolean} [hoverable]
	 * @property {'none' | 'sm' | 'md' | 'lg'} [padding]
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let { class: className = '', hoverable = false, padding = 'md', children } = $props();

	const paddingClasses = {
		none: 'p-0',
		sm: 'p-3',
		md: 'p-5',
		lg: 'p-6 sm:p-8'
	};

	const baseClass =
		'bg-white border border-[var(--color-border-light)] rounded-lg shadow-[var(--shadow-sm)]';

	let hoverClass = $derived(
		hoverable
			? 'transition-all duration-250 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--color-border)]'
			: ''
	);
</script>

<div class="{baseClass} {paddingClasses[padding]} {hoverClass} {className}">
	{@render children()}
</div>
