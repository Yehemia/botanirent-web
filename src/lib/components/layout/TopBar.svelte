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

	// Generate dynamic breadcrumb segments based on path
	let pathname = $derived($page.url.pathname);
	let breadcrumbs = $derived(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return [];
		
		// Map paths to readable Indonesian names
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

	/**
	 * @param {any} event
	 */
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

	/**
	 * @param {MouseEvent} event
	 */
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
	class="h-16 bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)]/60 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-250 select-none"
>
	<!-- Left: Toggle & Breadcrumb/Title -->
	<div class="flex items-center gap-3">
		<!-- Hamburger Menu Toggle (Mobile only) -->
		<button 
			onclick={toggleSidebar}
			class="md:hidden p-1.5 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-xl transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
			aria-label="Toggle Sidebar"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
		</button>

		<!-- Breadcrumbs Navigation -->
		<div class="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--color-stone)] overflow-hidden">
			<a href="/dashboard" class="flex items-center text-[var(--color-stone)] hover:text-[var(--color-forest)] transition-colors gap-1">
				<Home size={14} class="translate-y-[-1px]" />
			</a>
			{#each breadcrumbs() as bc, idx}
				<ChevronRight size={12} class="text-[var(--color-muted)] shrink-0" />
				{#if idx === breadcrumbs().length - 1}
					<span class="text-sm font-semibold text-[var(--color-earth)] truncate max-w-[120px] md:max-w-none">{bc.label}</span>
				{:else}
					<a href={bc.path} class="hover:text-[var(--color-forest)] transition-colors truncate max-w-[100px]">{bc.label}</a>
				{/if}
			{/each}
		</div>
		
		<!-- Mobile Fallback Title -->
		<h1 class="sm:hidden text-base font-bold font-heading text-[var(--color-earth)] truncate">
			{title}
		</h1>
	</div>

	<!-- Right: Actions & User Info -->
	<div class="flex items-center gap-4">
		<!-- Branch Selector / Badge -->
		{#if userProfile}
			{#if userProfile.role === 'owner' && branches.length > 0}
				<div class="hidden md:flex items-center bg-[var(--color-sage-10)] text-[var(--color-forest)] border border-[var(--color-sage)]/20 rounded-full text-xs font-semibold shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-forest)]/30 transition-all duration-200">
					<div class="flex items-center gap-1.5 pl-3 pr-1 py-1.5 border-r border-[var(--color-sage)]/10">
						<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse"></span>
						<span>Cabang:</span>
					</div>
					<select 
						value={userProfile.branch_id || ''} 
						onchange={handleBranchChange}
						class="bg-transparent border-0 text-[var(--color-forest)] font-semibold pr-8 pl-2 py-1.5 text-xs focus:ring-0 focus:outline-none cursor-pointer hover:bg-[var(--color-sage)]/5 transition-all rounded-r-full appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%232c6e49%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.25rem_center] bg-no-repeat"
					>
						<option value="" class="text-[var(--color-stone)] bg-white font-medium">Semua Cabang</option>
						{#each branches as b}
							<option value={b.id} class="text-[var(--color-stone)] bg-white font-medium">{b.name}</option>
						{/each}
					</select>
				</div>
			{:else if userProfile.branch_id}
				<div class="hidden md:flex items-center bg-[var(--color-sage-10)] text-[var(--color-forest)] border border-[var(--color-sage)]/10 px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 shadow-sm">
					<span class="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] animate-pulse"></span>
					Cabang: {branch?.name || 'Cabang Aktif'}
				</div>
			{/if}
		{/if}

		<!-- Notifications -->
		<button class="relative p-2 text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] rounded-full transition-all duration-200 cursor-pointer active:scale-95 group">
			<Bell size={18} class="transition-transform duration-300 group-hover:rotate-12" />
			<span class="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full border border-white"></span>
		</button>

		<div class="h-6 w-px bg-[var(--color-border-light)] mx-1"></div>

		<!-- User Dropdown Trigger -->
		<div class="relative">
			<button 
				onclick={toggleDropdown}
				class="flex items-center gap-2 hover:bg-[var(--color-sand)] p-1 pr-2.5 rounded-full border border-transparent hover:border-[var(--color-border-light)] transition-all duration-200 cursor-pointer group shadow-sm bg-white"
			>
				<!-- Avatar with gradient/border -->
				<div class="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-forest-light)] to-[var(--color-forest)] text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm border border-white/20 transition-transform group-hover:scale-105 duration-200">
					{userProfile?.full_name?.charAt(0) || 'U'}
				</div>
				<div class="hidden md:block text-left max-w-[120px]">
					<p class="text-[12px] font-bold text-[var(--color-earth)] leading-tight truncate">{userProfile?.full_name || 'User'}</p>
					<p class="text-[10px] text-[var(--color-stone)] capitalize leading-none mt-0.5">{userProfile?.role || 'Guest'}</p>
				</div>
				<ChevronDown size={14} class="text-[var(--color-stone)] transition-transform duration-200 group-hover:translate-y-0.5 shrink-0 {dropdownOpen ? 'rotate-180' : ''}" />
			</button>

			<!-- Dropdown Menu -->
			{#if dropdownOpen}
				<div 
					role="menu"
					tabindex="-1"
					class="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[var(--color-border-light)] shadow-xl py-2 z-50 animate-fade-in"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<!-- Header: User Info -->
					<div class="px-4 py-2.5 border-b border-[var(--color-border-light)]/60">
						<p class="text-xs text-[var(--color-stone)]">Masuk sebagai</p>
						<p class="font-bold text-sm text-[var(--color-earth)] truncate">{userProfile?.full_name || 'User'}</p>
						<p class="text-[10px] text-[var(--color-stone)] capitalize mt-0.5 font-semibold bg-[var(--color-sand)] px-2 py-0.5 rounded-full w-fit">
							{userProfile?.role || 'Guest'}
						</p>
					</div>

					<!-- Body: Links -->
					<div class="p-1">
						<a 
							href="/settings" 
							class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-stone)] hover:bg-[var(--color-sand)] hover:text-[var(--color-earth)] transition-colors"
							onclick={closeDropdown}
						>
							<Settings size={16} />
							<span>Pengaturan Sistem</span>
						</a>
					</div>

					<div class="border-t border-[var(--color-border-light)]/60 my-1"></div>

					<!-- Footer: Logout -->
					<div class="p-1">
						<form action="/logout" method="POST" class="m-0 w-full">
							<button 
								type="submit" 
								class="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors cursor-pointer"
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
