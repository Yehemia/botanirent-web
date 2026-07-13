<script>
	import { fade, scale } from 'svelte/transition';
	import { X } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {Function} [onclose]
	 * @property {string} [title]
	 * @property {'sm' | 'md' | 'lg'} [size]
	 * @property {boolean} [hideCloseButton]
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('svelte').Snippet} [footer]
	 */

	/** @type {Props} */
	let {
		open = $bindable(false),
		onclose,
		title = '',
		size = 'md',
		hideCloseButton = false,
		children,
		footer
	} = $props();

	const sizeClasses = {
		sm: 'max-w-[480px]',
		md: 'max-w-[640px]',
		lg: 'max-w-[860px]'
	};

	/** @param {MouseEvent} e */
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	function close() {
		open = false;
		if (onclose) onclose();
	}

	/** @param {KeyboardEvent} e */
	function handleKeydown(e) {
		if (open && e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-earth)]/50 p-4 backdrop-blur-[4px]"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 250 }}
	>
		<div
			class="w-full rounded-xl bg-white shadow-[var(--shadow-xl)] {sizeClasses[
				size
			]} relative flex max-h-[90vh] flex-col"
			transition:scale={{ duration: 250, start: 0.95, opacity: 0 }}
			role="dialog"
			aria-modal="true"
		>
			{#if title}
				<div class="px-6 pt-6 pb-4">
					<h3 class="font-heading text-xl font-bold text-[var(--color-earth)]">
						{title}
					</h3>
				</div>
			{/if}

			{#if !hideCloseButton}
				<button
					type="button"
					class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)]"
					onclick={close}
					aria-label="Close"
				>
					<X size={20} />
				</button>
			{/if}

			<div class="flex-grow overflow-y-auto px-6 py-2">
				{#if children}
					{@render children()}
				{/if}
			</div>

			{#if footer}
				<div
					class="mt-auto flex justify-end gap-3 border-t border-[var(--color-border-light)]/50 px-6 py-6"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
