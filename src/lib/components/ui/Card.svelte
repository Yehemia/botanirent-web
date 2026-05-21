<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [class]
	 * @property {boolean} [hoverable]
	 * @property {import('svelte').Snippet} children
	 */

	/** @type {Props} */
	let {
		class: className = '',
		hoverable = false,
		children
	} = $props();

	const baseClass = "bg-white border border-[var(--color-border-light)] rounded-lg p-5 shadow-[var(--shadow-sm)]";
	let hoverClass = $derived(hoverable ? "transition-all duration-250 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--color-border)]" : "");
</script>

<div class="{baseClass} {hoverClass} {className}">
	{@render children()}
</div>
