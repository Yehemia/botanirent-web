<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [id]
	 * @property {string} [type]
	 * @property {string} [name]
	 * @property {string} [value]
	 * @property {string} [placeholder]
	 * @property {string} [label]
	 * @property {string} [helperText]
	 * @property {string} [error]
	 * @property {boolean} [disabled]
	 * @property {boolean} [required]
	 * @property {'md' | 'lg'} [size]
	 * @property {string} [class]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} [iconRight]
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
			{label} {#if required}<span class="text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}

	<div class="relative flex items-center">
		{#if iconLeft}
			<div class="absolute left-3 flex items-center justify-center text-[var(--color-muted)] pointer-events-none">
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
			class="w-full bg-white border-[1.5px] rounded-md transition-colors text-[var(--color-earth)] placeholder:text-[var(--color-muted)]
				focus:outline-none
				disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
				{sizeClasses[size]}
				{iconLeft ? 'pl-10' : ''}
				{iconRight ? 'pr-10' : ''}
				{error 
					? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]' 
					: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'
				}"
			{...rest}
		/>

		{#if iconRight}
			<div class="absolute right-3 flex items-center justify-center text-[var(--color-muted)]">
				{@render iconRight()}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-[12px] text-[var(--color-error)] mt-0.5">{error}</p>
	{:else if helperText}
		<p class="text-[12px] text-[var(--color-stone)] mt-0.5">{helperText}</p>
	{/if}
</div>
