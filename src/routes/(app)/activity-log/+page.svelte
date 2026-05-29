<script>
	import { goto } from '$app/navigation';
	import { 
		Activity, 
		Search, 
		Calendar, 
		User, 
		MapPin, 
		ChevronLeft, 
		ChevronRight 
	} from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { formatDate } from '$lib/utils/format';

	/** @type {{ data: any }} */
	let { data } = $props();
	let logs = $derived(data.logs);
	let branches = $derived(data.branches);
	let filters = $derived(data.filters);
	let totalCount = $derived(data.totalCount);
	let page = $derived(data.page);
	let pageSize = $derived(data.pageSize);

	let totalPages = $derived(Math.ceil(totalCount / pageSize));
	let hasNext = $derived(page < totalPages);
	let hasPrev = $derived(page > 1);

	// Search & branch local states for binding
	let searchVal = $state('');
	let branchVal = $state('');

	// Keep local states in sync when page data updates
	$effect(() => {
		searchVal = filters.search || '';
		branchVal = filters.branchId || '';
	});

	/**
	 * @param {number} p
	 */
	function getPageUrl(p) {
		const params = new URLSearchParams();
		if (searchVal) params.set('search', searchVal);
		if (branchVal) params.set('branchId', branchVal);
		params.set('page', p.toString());
		return `?${params.toString()}`;
	}

	/** @param {SubmitEvent} e */
	function handleFilterSubmit(e) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (searchVal) params.set('search', searchVal);
		if (branchVal) params.set('branchId', branchVal);
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	function handleReset() {
		searchVal = '';
		branchVal = '';
		goto('?');
	}

	/**
	 * @param {string} role
	 */
	function getRoleBadgeVariant(role) {
		switch (role) {
			case 'owner':
				return 'error';
			case 'kasir':
				return 'info';
			case 'gudang':
				return 'warning';
			default:
				return 'neutral';
		}
	}

	/**
	 * @param {string} action
	 */
	function getActionLabel(action) {
		switch (action) {
			case 'item_returned':
				return 'Pengembalian Item';
			case 'penalty_rule_updated':
				return 'Update Aturan Denda';
			case 'checkout':
				return 'Checkout Transaksi';
			case 'login':
				return 'User Login';
			case 'logout':
				return 'User Logout';
			case 'asset_created':
				return 'Aset Baru Dibuat';
			case 'asset_updated':
				return 'Aset Diperbarui';
			case 'item_created':
				return 'Item Baru Dibuat';
			case 'item_updated':
				return 'Item Diperbarui';
			default:
				return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
		}
	}

	/**
	 * @param {string} action
	 */
	function getActionColorClass(action) {
		if (action.includes('delete') || action.includes('lost') || action.includes('error')) {
			return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]/10';
		}
		if (action.includes('create') || action.includes('return') || action.includes('add') || action === 'checkout') {
			return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/10';
		}
		if (action.includes('update') || action.includes('edit')) {
			return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/10';
		}
		return 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/10';
	}
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
	<!-- Header -->
	<div>
		<h1 class="text-2xl sm:text-3xl font-bold font-heading text-[var(--color-earth)] flex items-center gap-2">
			<Activity class="w-6 h-6 sm:w-7 sm:h-7" /> Log Aktivitas Audit
		</h1>
		<p class="text-xs sm:text-sm text-[var(--color-stone)] mt-1">Audit trail lengkap aktivitas user di seluruh cabang secara real-time.</p>
	</div>

	<!-- Filters Card -->
	<Card padding="md">
		<form onsubmit={handleFilterSubmit} class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
			<div class="md:col-span-2">
				<Input 
					id="log-search-input"
					name="search" 
					label="Cari Aksi / Entitas" 
					bind:value={searchVal} 
					placeholder="Cari aksi (misal: return, checkout)..."
				>
					{#snippet iconLeft()}
						<Search size={18} />
					{/snippet}
				</Input>
			</div>

			<div>
				<Select 
					id="log-branch-select"
					name="branchId" 
					label="Cabang" 
					bind:value={branchVal}
				>
					<option value="">Semua Cabang</option>
					{#each branches as branch}
						<option value={branch.id}>{branch.name}</option>
					{/each}
				</Select>
			</div>

			<div class="flex gap-2 h-[42px] mb-[1.5px]">
				<Button type="submit" variant="primary" class="flex-1">
					Filter
				</Button>
				{#if filters.search || filters.branchId}
					<Button type="button" onclick={handleReset} variant="secondary" class="flex-1">
						Reset
					</Button>
				{/if}
			</div>
		</form>
	</Card>

	<!-- Table Card -->
	<Card padding="none" class="overflow-hidden shadow-sm">
		<!-- Desktop View -->
		<div class="hidden sm:block overflow-x-auto">
			<table class="w-full text-left text-sm whitespace-nowrap">
				<thead class="bg-[var(--color-sand-light)] text-[var(--color-earth)] font-semibold border-b border-[var(--color-border)]">
					<tr>
						<th class="px-6 py-4">Waktu</th>
						<th class="px-6 py-4">User / Staf</th>
						<th class="px-6 py-4">Cabang</th>
						<th class="px-6 py-4">Aksi</th>
						<th class="px-6 py-4">Tipe Entitas</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)] bg-white">
					{#if logs.length === 0}
						<tr>
							<td colspan="5" class="px-6 py-12 text-center text-[var(--color-stone)] italic">
								Tidak ada log aktivitas yang ditemukan.
							</td>
						</tr>
					{:else}
						{#each logs as log (log.id)}
							<tr class="hover:bg-[var(--color-sand-lightest)]/50 transition-colors">
								<td class="px-6 py-4 text-[var(--color-stone)] text-xs font-mono">
									{formatDate(log.created_at)}
								</td>
								<td class="px-6 py-4">
									<div class="flex flex-col">
										<span class="font-semibold text-[var(--color-earth)] flex items-center gap-1.5">
											<User size={13} class="text-[var(--color-stone)]" />
											{log.profile?.full_name || 'System / Auto'}
										</span>
										{#if log.profile?.role}
											<span class="text-[10px] mt-0.5 w-fit">
												<Badge variant={getRoleBadgeVariant(log.profile.role)}>
													{log.profile.role.toUpperCase()}
												</Badge>
											</span>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 text-[var(--color-earth)] font-medium">
									<span class="flex items-center gap-1">
										<MapPin size={13} class="text-[var(--color-stone)]" />
										{log.branch?.name || '-'}
									</span>
								</td>
								<td class="px-6 py-4">
									<span class="inline-block px-2.5 py-1 border rounded-md text-xs font-semibold uppercase tracking-wider {getActionColorClass(log.action)}">
										{getActionLabel(log.action)}
									</span>
								</td>
								<td class="px-6 py-4 font-mono text-xs text-[var(--color-stone)] capitalize">
									{log.entity_type || '-'}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Mobile View -->
		<div class="block sm:hidden divide-y divide-[var(--color-border-light)] bg-white">
			{#if logs.length === 0}
				<p class="p-6 text-center text-[var(--color-stone)] italic text-xs">Tidak ada log aktivitas yang ditemukan.</p>
			{:else}
				{#each logs as log (log.id)}
					<div class="p-4 flex flex-col gap-2.5 hover:bg-[var(--color-sand-lightest)]/30 transition-colors">
						<div class="flex justify-between items-start gap-2">
							<span class="inline-block px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider {getActionColorClass(log.action)}">
								{getActionLabel(log.action)}
							</span>
							{#if log.entity_type}
								<span class="font-mono text-[10px] text-[var(--color-stone)] capitalize bg-[var(--color-sand)] px-1.5 py-0.5 rounded">
									{log.entity_type}
								</span>
							{/if}
						</div>
						
						<div class="flex flex-col gap-1.5 text-xs text-[var(--color-earth)]">
							<div class="flex items-center gap-2">
								<User size={13} class="text-[var(--color-stone)] shrink-0" />
								<span class="font-semibold">{log.profile?.full_name || 'System / Auto'}</span>
								{#if log.profile?.role}
									<span class="scale-90 origin-left">
										<Badge variant={getRoleBadgeVariant(log.profile.role)}>
											{log.profile.role.toUpperCase()}
										</Badge>
									</span>
								{/if}
							</div>
							
							<div class="flex items-center gap-2 text-[var(--color-stone)]">
								<MapPin size={13} class="text-[var(--color-stone)] shrink-0" />
								<span>Cabang: <strong>{log.branch?.name || '-'}</strong></span>
							</div>
						</div>

						<div class="text-[10px] text-[var(--color-stone)] font-mono flex items-center gap-1 mt-0.5">
							<Calendar size={11} class="shrink-0" />
							{formatDate(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Pagination Footer -->
		{#if totalPages > 1}
			<div class="px-4 sm:px-6 py-4 bg-[var(--color-sand-lightest)] border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div class="text-xs sm:text-sm text-[var(--color-stone)] text-center sm:text-left">
					Menampilkan <span class="font-semibold">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> - <span class="font-semibold">{Math.min(page * pageSize, totalCount)}</span> dari <span class="font-semibold">{totalCount}</span> log
				</div>
				
				<div class="flex items-center gap-2">
					{#if hasPrev}
						<Button onclick={() => goto(getPageUrl(page - 1))} variant="secondary" size="sm" class="inline-flex items-center gap-1">
							<ChevronLeft size={16} /> Seb.
						</Button>
					{:else}
						<Button disabled variant="secondary" size="sm" class="inline-flex items-center gap-1 opacity-50">
							<ChevronLeft size={16} /> Seb.
						</Button>
					{/if}

					<span class="text-xs sm:text-sm text-[var(--color-earth)] font-semibold px-1 sm:px-2">
						Halaman {page} dari {totalPages}
					</span>

					{#if hasNext}
						<Button onclick={() => goto(getPageUrl(page + 1))} variant="secondary" size="sm" class="inline-flex items-center gap-1">
							Sel. <ChevronRight size={16} />
						</Button>
					{:else}
						<Button disabled variant="secondary" size="sm" class="inline-flex items-center gap-1 opacity-50">
							Sel. <ChevronRight size={16} />
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</Card>
</div>
