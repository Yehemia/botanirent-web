<script>
	import { page } from '$app/stores';
	import { Bell, ChevronRight, Home, ChevronDown, Settings, LogOut } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} sidebarExpanded
	 * @property {string} title
	 * @property {any} userProfile
	 * @property {any} [branch]
	 * @property {any[]} [branches]
	 * @property {() => void} toggleSidebar
	 */

	/** @type {Props} */
	let { sidebarExpanded, title, userProfile, branch, branches = [], toggleSidebar } = $props();

	let pathname = $derived($page.url.pathname);

	let breadcrumbs = $derived(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return [];

		/** @type {Record<string, string>} */
		const nameMap = {
			dashboard: 'Dashboard',
			pos: 'POS',
			checkout: 'Pembayaran',
			customers: 'Data Penyewa',
			booking: 'Kalender Booking',
			inventory: 'Inventaris',
			packages: 'Paket Bundling',
			'asset-status': 'Status Aset',
			returns: 'Pengembalian',
			transactions: 'Riwayat',
			statistics: 'Statistik',
			branches: 'Cabang',
			staff: 'Staff',
			settings: 'Pengaturan',
			'activity-log': 'Log Aktivitas'
		};

		return segments.map((seg, idx) => {
			const path = '/' + segments.slice(0, idx + 1).join('/');
			const label = nameMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
			return { label, path };
		});
	});

	/** @param {any} event */
	async function handleBranchChange(event) {
		const select = /** @type {HTMLSelectElement} */ (event.currentTarget);
		const branchId = select.value;

		try {
			const res = await fetch('/api/change-branch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ branchId })
			});

			const data = await res.json();

			if (res.ok) {
				toast.success('Berhasil mengubah cabang aktif!');
				setTimeout(() => {
					window.location.reload();
				}, 500);
			} else {
				toast.error(data?.message || 'Gagal mengubah cabang.');
			}
		} catch (err) {
			console.error('Error changing branch:', err);
			toast.error('Terjadi kesalahan saat mengubah cabang.');
		}
	}

	let dropdownOpen = $state(false);

	/** @param {any} event */
	function toggleDropdown(event) {
		event.stopPropagation();
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}
</script>

<svelte:window onclick={closeDropdown} />

<header
	class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border-light)]/60 bg-white/80 px-6 shadow-sm backdrop-blur-md transition-all duration-250 select-none"
>
	<div class="flex items-center gap-3">
		<button
			onclick={toggleSidebar}
			class="shrink-0 cursor-pointer rounded-xl p-1.5 text-[var(--color-stone)] transition-all duration-200 hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] active:scale-95 md:hidden"
			aria-label="Toggle Sidebar"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide-icon lucide lucide-menu"
				><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line
					x1="4"
					x2="20"
					y1="18"
					y2="18"
				/></svg
			>
		</button>

		<div
			class="hidden items-center gap-1.5 overflow-hidden text-xs font-medium text-[var(--color-stone)] sm:flex"
		>
			<a
				href="/dashboard"
				class="flex items-center gap-1 text-[var(--color-stone)] transition-colors hover:text-[var(--color-forest)]"
				aria-label="Dashboard"
			>
				<Home size={14} class="translate-y-[-1px]" />
			</a>
			{#each breadcrumbs() as bc, idx}
				<ChevronRight size={12} class="shrink-0 text-[var(--color-muted)]" />
				{#if idx === breadcrumbs().length - 1}
					<span
						class="max-w-[120px] truncate text-sm font-semibold text-[var(--color-earth)] md:max-w-none"
						>{bc.label}</span
					>
				{:else}
					<a
						href={bc.path}
						class="max-w-[100px] truncate transition-colors hover:text-[var(--color-forest)]"
						>{bc.label}</a
					>
				{/if}
			{/each}
		</div>

		<h1 class="truncate font-heading text-base font-bold text-[var(--color-earth)] sm:hidden">
			{title}
		</h1>
	</div>

	<div class="flex items-center gap-4">
		{#if userProfile}
			{#if userProfile.role === 'owner' && branches.length > 0}
				<div
					class="hidden items-center overflow-hidden rounded-full border border-[var(--color-sage)]/20 bg-[var(--color-sage-10)] text-xs font-semibold text-[var(--color-forest)] shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--color-forest)]/30 md:flex"
				>
					<div
						class="flex items-center gap-1.5 border-r border-[var(--color-sage)]/10 py-1.5 pr-1 pl-3"
					>
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sage)]"></span>
						<span>Cabang:</span>
					</div>
					<select
						value={userProfile.branch_id || ''}
						onchange={handleBranchChange}
						class="cursor-pointer appearance-none rounded-r-full border-0 bg-transparent bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%232c6e49%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.25rem_center] bg-no-repeat py-1.5 pr-8 pl-2 text-xs font-semibold text-[var(--color-forest)] transition-all hover:bg-[var(--color-sage)]/5 focus:ring-0 focus:outline-none"
					>
						<option value="" class="bg-white font-medium text-[var(--color-stone)]"
							>Semua Cabang</option
						>
						{#each branches as b}
							<option value={b.id} class="bg-white font-medium text-[var(--color-stone)]"
								>{b.name}</option
							>
						{/each}
					</select>
				</div>
			{:else if userProfile.branch_id}
				<div
					class="hidden items-center gap-1.5 rounded-full border border-[var(--color-sage)]/10 bg-[var(--color-sage-10)] px-3 py-1.5 text-xs font-semibold text-[var(--color-forest)] shadow-sm md:flex"
				>
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sage)]"></span>
					Cabang: {branch?.name || 'Cabang Aktif'}
				</div>
			{/if}
		{/if}

		<button
			class="group relative cursor-pointer rounded-full p-2 text-[var(--color-stone)] transition-all duration-200 hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] active:scale-95"
		>
			<Bell size={18} class="transition-transform duration-300 group-hover:rotate-12" />
			<span
				class="absolute top-2 right-2 h-2 w-2 rounded-full border border-white bg-[var(--color-error)]"
			></span>
		</button>

		<div class="mx-1 h-6 w-px bg-[var(--color-border-light)]"></div>

		<div class="relative">
			<button
				onclick={toggleDropdown}
				class="group flex cursor-pointer items-center gap-2 rounded-full border border-transparent bg-white p-1 pr-2.5 shadow-sm transition-all duration-200 hover:border-[var(--color-border-light)] hover:bg-[var(--color-sand)]"
			>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-forest)] text-xs font-bold text-white uppercase shadow-sm transition-transform duration-200 group-hover:scale-105"
				>
					{userProfile?.full_name?.charAt(0) || 'U'}
				</div>
				<div class="hidden max-w-[120px] text-left md:block">
					<p class="truncate text-[12px] leading-tight font-bold text-[var(--color-earth)]">
						{userProfile?.full_name || 'User'}
					</p>
					<p class="mt-0.5 text-[10px] leading-none text-[var(--color-stone)] capitalize">
						{userProfile?.role || 'Guest'}
					</p>
				</div>
				<ChevronDown
					size={14}
					class="shrink-0 text-[var(--color-stone)] transition-transform duration-200 group-hover:translate-y-0.5 {dropdownOpen
						? 'rotate-180'
						: ''}"
				/>
			</button>

			{#if dropdownOpen}
				<div
					role="menu"
					tabindex="-1"
					class="animate-fade-in absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[var(--color-border-light)] bg-white py-2 shadow-xl"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<div class="border-b border-[var(--color-border-light)]/60 px-4 py-2.5">
						<p class="text-xs text-[var(--color-stone)]">Masuk sebagai</p>
						<p class="truncate text-sm font-bold text-[var(--color-earth)]">
							{userProfile?.full_name || 'User'}
						</p>
						<p
							class="mt-0.5 w-fit rounded-full bg-[var(--color-sand)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-stone)] capitalize"
						>
							{userProfile?.role || 'Guest'}
						</p>
					</div>

					{#if userProfile?.role === 'owner'}
						<div class="p-1">
							<a
								href="/settings"
								class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-stone)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)]"
								onclick={closeDropdown}
							>
								<Settings size={16} />
								<span>Pengaturan Sistem</span>
							</a>
						</div>
					{/if}

					<div class="my-1 border-t border-[var(--color-border-light)]/60"></div>

					<div class="p-1">
						<form action="/logout" method="POST" class="m-0 w-full">
							<button
								type="submit"
								class="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-bg)]"
							>
								<LogOut size={16} />
								<span>Keluar Aplikasi</span>
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
