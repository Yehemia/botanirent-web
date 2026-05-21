<script>
	import { Menu, Bell } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} sidebarExpanded
	 * @property {string} title
	 * @property {any} userProfile
	 * @property {Function} toggleSidebar
	 */

	/** @type {Props} */
	let { sidebarExpanded, title, userProfile, toggleSidebar } = $props();
</script>

<header 
	class="h-16 bg-white border-b border-[var(--color-border-light)] shadow-[var(--shadow-sm)] flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-250"
>
	<!-- Left: Toggle & Breadcrumb/Title -->
	<div class="flex items-center gap-4">
		<button 
			class="p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-md transition-colors"
			onclick={toggleSidebar}
			aria-label="Toggle Sidebar"
		>
			<Menu size={20} />
		</button>
		
		<h1 class="text-lg font-semibold font-heading text-[var(--color-earth)]">
			{title}
		</h1>
	</div>

	<!-- Right: Actions & User Info -->
	<div class="flex items-center gap-5">
		<!-- Branch Badge -->
		{#if userProfile?.branch_id}
			<div class="hidden md:flex items-center bg-[var(--color-sage-10)] text-[var(--color-forest)] px-3 py-1.5 rounded-full text-xs font-semibold">
				Cabang Aktif
			</div>
		{/if}

		<!-- Notifications -->
		<button class="relative p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-full transition-colors">
			<Bell size={20} />
			<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full"></span>
		</button>

		<div class="h-6 w-px bg-[var(--color-border-light)] mx-1"></div>

		<!-- User Dropdown Trigger -->
		<button class="flex items-center gap-2 hover:bg-[var(--color-sand)] p-1.5 pr-3 rounded-full transition-colors">
			<div class="w-8 h-8 rounded-full bg-[var(--color-forest)] text-white flex items-center justify-center text-sm font-bold uppercase">
				{userProfile?.full_name?.charAt(0) || 'U'}
			</div>
			<div class="hidden md:block text-left">
				<p class="text-[13px] font-semibold text-[var(--color-earth)] leading-tight">{userProfile?.full_name || 'User'}</p>
				<p class="text-[11px] text-[var(--color-stone)] capitalize leading-tight">{userProfile?.role || 'Guest'}</p>
			</div>
		</button>
	</div>
</header>
