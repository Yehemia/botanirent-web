<script>
	/**
	 * @typedef {Object} ExtraProps
	 * @property {string} [label]
	 * @property {string} [helperText]
	 * @property {string} [error]
	 * @property {'md' | 'lg'} [size]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} [iconRight]
	 * @typedef {Omit<import('svelte/elements').HTMLInputAttributes, 'size'> & ExtraProps} Props
	 */

	/** @type {Props} */
	let {
		id = `input-${Math.random().toString(36).slice(2, 9)}`,
		type = 'text',
		name,
		value = $bindable(''),
		placeholder = '',
		label = '',
		helperText = '',
		error = '',
		disabled = false,
		required = false,
		size = 'md',
		class: className = '',
		iconLeft,
		iconRight,
		...rest
	} = $props();

	const sizeClasses = {
		md: 'h-10 px-3.5 py-2 text-[14px]',
		lg: 'h-12 px-4 py-3 text-[16px]'
	};
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

		<input
			{id}
			{type}
			{name}
			{placeholder}
			{disabled}
			{required}
			bind:value
			class="w-full rounded-md border-[1.5px] bg-white text-[var(--color-earth)] transition-colors placeholder:text-[var(--color-muted)]
				focus:outline-none
				disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
				{sizeClasses[size]}
				{iconLeft ? 'pl-10' : ''}
				{iconRight ? 'pr-10' : ''}
				{error
				? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]'
				: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'}"
			{...rest}
		/>

		{#if iconRight}
			<div class="absolute right-3 flex items-center justify-center text-[var(--color-muted)]">
				{@render iconRight()}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="mt-0.5 text-[12px] text-[var(--color-error)]">{error}</p>
	{:else if helperText}
		<p class="mt-0.5 text-[12px] text-[var(--color-stone)]">{helperText}</p>
	{/if}
</div>
