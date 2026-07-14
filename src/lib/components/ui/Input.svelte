<script>
	/**
	 * @typedef {Object} ExtraProps
	 * @property {string} [label]
	 * @property {string} [helperText]
	 * @property {string} [error]
	 * @property {'md' | 'lg'} [size]
	 * @property {import('svelte').Snippet} [iconLeft]
	 * @property {import('svelte').Snippet} [iconRight]
	 *
	 * @typedef {Omit<import('svelte/elements').HTMLInputAttributes, 'size'> & ExtraProps} Props
	 */

	/** @type {Props & { isCurrency?: boolean }} */
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
		oninput,
		isCurrency = false,
		...rest
	} = $props();

	const sizeClasses = {
		md: 'h-10 px-3.5 py-2 text-[14px]',
		lg: 'h-12 px-4 py-3 text-[16px]'
	};

	let displayValue = $state('');

	/** @param {any} numStr */
	function formatToRupiah(numStr) {
		if (numStr === null || numStr === undefined || numStr === '') return '';
		const clean = String(numStr).replace(/[^0-9]/g, '');
		if (!clean) return '';
		const formatted = new Intl.NumberFormat('id-ID', {
			minimumFractionDigits: 0
		}).format(parseInt(clean, 10));
		return `Rp ${formatted}`;
	}

	/** @param {string} str */
	function getRawNumber(str) {
		return str.replace(/[^0-9]/g, '');
	}

	$effect(() => {
		if (isCurrency) {
			const formatted = formatToRupiah(value);
			if (formatted !== displayValue) {
				displayValue = formatted;
			}
		}
	});

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleCurrencyInput(e) {
		let inputVal = e.currentTarget.value;
		const raw = getRawNumber(inputVal);
		const formatted = formatToRupiah(raw);
		displayValue = formatted;
		e.currentTarget.value = formatted;
		value = raw;
		
		if (oninput) {
			oninput(e);
		}
	}

	let inputClass = $derived(`w-full rounded-md border-[1.5px] bg-white text-[var(--color-earth)] transition-colors placeholder:text-[var(--color-muted)]
		focus:outline-none
		disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
		${sizeClasses[size]}
		${iconLeft ? 'pl-10' : ''}
		${iconRight ? 'pr-10' : ''}
		${error
		? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)]'
		: 'border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]'}`);
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

		{#if isCurrency}
			<input
				{id}
				type="text"
				{placeholder}
				{disabled}
				{required}
				value={displayValue}
				oninput={handleCurrencyInput}
				class={inputClass}
				{...rest}
			/>
			{#if name}
				<input type="hidden" {name} value={value} />
			{/if}
		{:else}
			<input
				{id}
				{type}
				{name}
				{placeholder}
				{disabled}
				{required}
				bind:value
				oninput={(e) => {
					if (type === 'number') {
						let val = e.currentTarget.value;
						if (val.length > 1 && val.startsWith('0')) {
							val = val.replace(/^0+/, '');
							if (val === '') {
								val = '0';
							}
							e.currentTarget.value = val;
							value = val;
						}
					}
					if (oninput) {
						oninput(e);
					}
				}}
				class={inputClass}
				{...rest}
			/>
		{/if}

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
