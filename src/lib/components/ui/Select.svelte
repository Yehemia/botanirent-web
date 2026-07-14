<script>
	/**
	 * @typedef {Object} ExtraProps
	 * @property {string} [label]
	 * @property {string} [helperText]
	 * @property {string} [error]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} children
	 *
	 * @typedef {import('svelte/elements').HTMLSelectAttributes & ExtraProps} Props
	 */

	/** @type {Props} */
	let {
		id = `select-${Math.random().toString(36).slice(2, 9)}`,
		name,
		value = $bindable(''),
		label = '',
		helperText = '',
		error = '',
		disabled = false,
		required = false,
		class: className = '',
		iconLeft,
		children,
		...rest
	} = $props();
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label for={id} class="text-[13px] font-medium text-[var(--color-earth)]">
			{label}
			{#if required}<span class="text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}

	<div class="relative flex items-center">
		{#if iconLeft}
			<div
				class="pointer-events-none absolute left-3 flex items-center justify-center text-[var(--color-muted)]"
			>
				{@render iconLeft()}
			</div>
		{/if}

		<select
			{id}
			{name}
			{disabled}
			{required}
			bind:value
			class="w-full cursor-pointer appearance-none rounded-md border-[1.5px] bg-white py-2 pr-10 text-[14px] text-[var(--color-earth)] transition-colors
				focus:outline-none
				disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
				{iconLeft ? 'pl-10' : 'px-3.5'}
				{error
				? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]'
				: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'}"
			{...rest}
		>
			{@render children()}
		</select>

		<div
			class="pointer-events-none absolute right-3 flex items-center justify-center text-[var(--color-stone)]"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg
			>
		</div>
	</div>

	{#if error}
		<p class="mt-0.5 text-[12px] text-[var(--color-error)]">{error}</p>
	{:else if helperText}
		<p class="mt-0.5 text-[12px] text-[var(--color-stone)]">{helperText}</p>
	{/if}
</div>
