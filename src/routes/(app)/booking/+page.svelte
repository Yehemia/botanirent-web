<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		ChevronLeft, 
		ChevronRight, 
		Plus, 
		Wrench, 
		Calendar, 
		Info, 
		Trash2, 
		Tent, 
		User, 
		Hash,
		Layers,
		CheckCircle,
		Clock,
		MapPin
	} from '@lucide/svelte';
	
	// Import UI components
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatDate } from '$lib/utils/format';

	// Date arithmetic from date-fns
	import { 
		startOfMonth, 
		endOfMonth, 
		startOfWeek, 
		endOfWeek, 
		eachDayOfInterval, 
		format, 
		isSameMonth, 
		isSameDay, 
		addMonths, 
		subMonths, 
		isToday, 
		parseISO,
		addDays,
		startOfWeek as startOfWeekFn
	} from 'date-fns';

	let { data, form } = $props();

	// Read loaded data
	let branches = $derived(data.branches);
	let categories = $derived(data.categories);
	let items = $derived(data.items);
	let assets = $derived(data.assets);
	let bookings = $derived(data.bookings);
	let selectedBranchId = $derived(data.selectedBranchId);
	let role = $derived(data.role);

	// Page state
	let selectedCategory = $state('all');
	let selectedItemId = $state('all');
	let selectedAssetId = $state('all');
	let viewMode = $state('month'); // 'month' or 'week'
	let currentDate = $state(new Date());
	
	// Modals state
	let isMaintenanceModalOpen = $state(false);
	let isDetailModalOpen = $state(false);
	
	// Form inputs for scheduling maintenance
	let maintenanceAssetId = $state('');
	let maintenanceStartDate = $state('');
	let maintenanceEndDate = $state('');
	let maintenanceNotes = $state('');
	let maintenanceType = $state('maintenance'); // 'maintenance' or 'washing'
	
	// Detail modal state
	/** @type {any} */
	let selectedBooking = $state(null);
	let isSubmitting = $state(false);

	// Filter items by category pill
	let filteredItems = $derived(
		selectedCategory === 'all' 
			? items 
			: items.filter(item => item.category_id === selectedCategory)
	);

	// Sync item selection when category changes
	$effect(() => {
		const list = filteredItems;
		if (list.length > 0) {
			if (!selectedItemId) {
				selectedItemId = 'all';
			} else if (selectedItemId !== 'all' && !list.some(item => item.id === selectedItemId)) {
				selectedItemId = 'all';
			}
		} else {
			selectedItemId = '';
		}
	});

	// Get assets for currently selected item
	let filteredAssets = $derived(
		selectedItemId === 'all'
			? []
			: assets.filter(asset => asset.item_id === selectedItemId)
	);

	// Sync asset selection when item changes
	$effect(() => {
		const list = filteredAssets;
		if (selectedAssetId !== 'all' && !list.some(asset => asset.id === selectedAssetId)) {
			selectedAssetId = 'all';
		}
	});

	// Pre-fill asset selection for maintenance modal
	$effect(() => {
		const list = selectedItemId === 'all' ? assets : filteredAssets;
		if (list.length > 0) {
			if (!maintenanceAssetId || !list.some(a => a.id === maintenanceAssetId)) {
				maintenanceAssetId = list[0].id;
			}
		}
	});

	// Handle branch change (Owner only)
	/** @param {Event} e */
	function handleBranchChange(e) {
		const target = /** @type {HTMLSelectElement} */ (e.target);
		goto(`?branch_id=${target.value}`);
	}

	// ----------------------------------------------------
	// CALENDAR COMPUTATIONS
	// ----------------------------------------------------

	// Generate Month Calendar Grid
	let monthDays = $derived.by(() => {
		const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
		const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
		return eachDayOfInterval({ start, end });
	});

	// Generate Week Grid
	let weekDays = $derived.by(() => {
		const start = startOfWeekFn(currentDate, { weekStartsOn: 1 });
		const days = [];
		for (let i = 0; i < 7; i++) {
			days.push(addDays(start, i));
		}
		return days;
	});

	// Format Indonesian month name
	let currentMonthLabel = $derived.by(() => {
		const monthNames = [
			'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
			'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
		];
		return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
	});

	function nextPeriod() {
		if (viewMode === 'month') {
			currentDate = addMonths(currentDate, 1);
		} else {
			currentDate = addDays(currentDate, 7);
		}
	}

	function prevPeriod() {
		if (viewMode === 'month') {
			currentDate = subMonths(currentDate, 1);
		} else {
			currentDate = subDays(currentDate, 7);
		}
	}
	
	// Helper to subtract days
	/**
	 * @param {Date | string | number} date
	 * @param {number} days
	 */
	function subDays(date, days) {
		const result = new Date(date);
		result.setDate(result.getDate() - days);
		return result;
	}

	// Filter bookings based on selected item and asset
	let activeBookings = $derived.by(() => {
		return bookings.filter(b => {
			// Must match selected item (or all)
			if (selectedItemId !== 'all' && b.rental_asset?.item?.id !== selectedItemId) return false;
			
			// Must match selected asset (or all)
			if (selectedAssetId !== 'all' && b.rental_asset_id !== selectedAssetId) return false;
			
			return true;
		});
	});

	// Get bookings for a specific day
	/**
	 * @param {Date} day
	 */
	function getBookingsForDay(day) {
		const dayStr = format(day, 'yyyy-MM-dd');
		return activeBookings.filter(b => b.start_date <= dayStr && b.end_date >= dayStr);
	}

	// Check if booking is a maintenance block
	/**
	 * @param {any} booking
	 */
	function isMaintenance(booking) {
		return !booking.transaction_item_id;
	}

	// Get booking label
	/**
	 * @param {any} booking
	 * @param {Date} day
	 */
	function getBookingLabel(booking, day) {
		if (isMaintenance(booking)) {
			return 'Maintenance';
		}
		
		const customerName = booking.transaction_item?.transaction?.customer?.full_name || 'Customer';
		const dayStr = format(day, 'yyyy-MM-dd');
		
		const prefix = booking.status === 'completed' ? '[Selesai] ' : '';
		
		if (booking.end_date === dayStr) {
			return `${prefix}Sewa - ${customerName} (End)`;
		}
		return `${prefix}Sewa - ${customerName}`;
	}

	// ----------------------------------------------------
	// INTERACTIONS
	// ----------------------------------------------------

	/**
	 * @param {Date} day
	 */
	function handleDayClick(day) {
		// Prevent scheduling in the past
		const today = new Date();
		today.setHours(0,0,0,0);
		const clickedDate = new Date(day);
		clickedDate.setHours(0,0,0,0);
		
		if (clickedDate < today) return;

		const dateStr = format(day, 'yyyy-MM-dd');
		maintenanceStartDate = dateStr;
		maintenanceEndDate = dateStr;
		
		// Pre-select asset if specific asset is chosen
		if (selectedAssetId !== 'all') {
			maintenanceAssetId = selectedAssetId;
		} else if (filteredAssets.length > 0) {
			maintenanceAssetId = filteredAssets[0].id;
		}

		maintenanceNotes = '';
		maintenanceType = 'maintenance';
		isMaintenanceModalOpen = true;
	}

	/**
	 * @param {any} booking
	 * @param {Event} e
	 */
	function handleBookingClick(booking, e) {
		e.stopPropagation(); // Stop click from bubbling to day cell
		selectedBooking = booking;
		isDetailModalOpen = true;
	}
</script>

<div class="space-y-6 max-w-[1400px] mx-auto pb-12">
	<!-- Top Bar and Branch Switcher -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Kalender Booking</h1>
			<p class="text-[var(--color-stone)] mt-1">Cek jadwal penyewaan dan atur pemblokiran pemeliharaan alat sewa.</p>
		</div>

		{#if role === 'owner' && branches.length > 0}
			<div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-sm shrink-0">
				<MapPin size={18} class="text-[var(--color-forest)] shrink-0" />
				<span class="text-[13px] font-medium text-[var(--color-stone)] mr-1">Cabang:</span>
				<select 
					class="bg-transparent font-bold text-sm text-[var(--color-forest)] focus:outline-none cursor-pointer"
					value={selectedBranchId}
					onchange={handleBranchChange}
				>
					{#each branches as branch}
						<option value={branch.id}>{branch.name}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium text-sm">
			{form.error}
		</div>
	{/if}

	<!-- Controls / Filter Bar -->
	<div class="bg-white p-4 rounded-2xl shadow-[var(--shadow-sm)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-[var(--color-border)]">
		
		<!-- Left Filters: Categories & Item Dropdown -->
		<div class="flex flex-col md:flex-row md:items-center gap-4 flex-grow">
			
			<!-- Category Pills -->
			<div class="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
				<button 
					type="button"
					onclick={() => selectedCategory = 'all'}
					class="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 shadow-sm border
						{selectedCategory === 'all' 
							? 'bg-[var(--color-forest)] text-white border-[var(--color-forest)]' 
							: 'bg-[var(--color-cream)] text-[var(--color-stone)] border-[var(--color-border-light)] hover:border-[var(--color-stone)]'}"
				>
					Semua
				</button>
				{#each categories as cat (cat.id)}
					<button 
						type="button"
						onclick={() => selectedCategory = cat.id}
						class="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 shadow-sm border
							{selectedCategory === cat.id 
								? 'bg-[var(--color-forest)] text-white border-[var(--color-forest)]' 
								: 'bg-[var(--color-cream)] text-[var(--color-stone)] border-[var(--color-border-light)] hover:border-[var(--color-stone)]'}"
					>
						{cat.name}
					</button>
				{/each}
			</div>

			<!-- Separator -->
			<div class="hidden md:block w-px h-8 bg-[var(--color-border-light)] shrink-0"></div>

			<!-- Select Item Dropdown -->
			<div class="flex-grow max-w-sm">
				<select 
					bind:value={selectedItemId}
					class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] font-medium text-[var(--color-earth)] transition-colors cursor-pointer focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
				>
					<option value="all">Semua Barang ({filteredItems.length})</option>
					{#each filteredItems as item (item.id)}
						<option value={item.id}>{item.name}</option>
					{/each}
				</select>
			</div>

			<!-- Select Asset/Unit Dropdown -->
			{#if selectedItemId && selectedItemId !== 'all' && filteredAssets.length > 0}
				<div class="w-full md:w-48 shrink-0">
					<select 
						bind:value={selectedAssetId}
						class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors cursor-pointer focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] font-mono"
					>
						<option value="all">Semua Unit ({filteredAssets.length})</option>
						{#each filteredAssets as asset (asset.id)}
							<option value={asset.id}>{asset.asset_code} ({asset.status})</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- Right Controls: View Toggle & Action -->
		<div class="flex items-center gap-3 shrink-0">
			<!-- View Mode Toggle -->
			<div class="flex bg-[var(--color-sand)] p-1 rounded-lg border border-[var(--color-border)]">
				<button 
					type="button"
					onclick={() => viewMode = 'month'}
					class="px-4 py-1.5 text-xs font-semibold rounded transition-all shadow-sm
						{viewMode === 'month' 
							? 'bg-white text-[var(--color-forest)] font-bold' 
							: 'text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
				>
					Bulan
				</button>
				<button 
					type="button"
					onclick={() => viewMode = 'week'}
					class="px-4 py-1.5 text-xs font-semibold rounded transition-all shadow-sm
						{viewMode === 'week' 
							? 'bg-white text-[var(--color-forest)] font-bold' 
							: 'text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
				>
					Minggu
				</button>
			</div>

			<!-- Add Maintenance Button -->
			{#if selectedItemId && filteredAssets.length > 0}
				<Button 
					size="md" 
					class="flex items-center gap-2"
					onclick={() => {
						const today = new Date();
						maintenanceStartDate = format(today, 'yyyy-MM-dd');
						maintenanceEndDate = format(today, 'yyyy-MM-dd');
						maintenanceNotes = '';
						maintenanceType = 'maintenance';
						if (selectedAssetId !== 'all') {
							maintenanceAssetId = selectedAssetId;
						} else {
							maintenanceAssetId = filteredAssets[0].id;
						}
						isMaintenanceModalOpen = true;
					}}
				>
					<Plus size={16} /> Block Unit
				</Button>
			{/if}
		</div>
	</div>

	<!-- Calendar Section -->
	{#if !selectedItemId}
		<Card padding="lg" class="text-center py-20">
			<Calendar size={48} class="mx-auto mb-4 text-[var(--color-stone)] opacity-30" />
			<p class="text-lg font-medium text-[var(--color-earth)]">Belum Ada Barang Terpilih</p>
			<p class="text-sm text-[var(--color-stone)] mt-1">Pilih barang sewa di atas untuk melihat kalender ketersediaannya.</p>
		</Card>
	{:else}
		<div class="bg-white rounded-2xl shadow-[var(--shadow-md)] border border-[var(--color-border)] overflow-hidden flex flex-col">
			
			<!-- Calendar Navigation Header -->
			<div class="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-sand-lightest)]">
				<button 
					type="button"
					onclick={prevPeriod}
					class="p-2 text-[var(--color-stone)] hover:text-[var(--color-forest)] hover:bg-[var(--color-sand)] rounded-full transition-colors"
				>
					<ChevronLeft size={20} />
				</button>
				<h3 class="font-heading font-bold text-lg md:text-xl text-[var(--color-forest)] tracking-wide">{currentMonthLabel}</h3>
				<button 
					type="button"
					onclick={nextPeriod}
					class="p-2 text-[var(--color-stone)] hover:text-[var(--color-forest)] hover:bg-[var(--color-sand)] rounded-full transition-colors"
				>
					<ChevronRight size={20} />
				</button>
			</div>

			<!-- Grid Area -->
			{#if viewMode === 'month'}
				<!-- Month View Grid -->
				<div class="flex-1 flex flex-col">
					<!-- Days Header -->
					<div class="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-sand)] shrink-0">
						{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as day}
							<div class="py-2.5 px-4 text-right font-heading text-xs font-bold text-[var(--color-stone)] uppercase tracking-wider">
								{day}
							</div>
						{/each}
					</div>

					<!-- Days cells -->
					<div class="flex-1 grid grid-cols-7 bg-[var(--color-border)] gap-[1px]">
						{#each monthDays as day}
							{@const isCurrentMonth = isSameMonth(day, currentDate)}
							{@const dayBookings = getBookingsForDay(day)}
							{@const isTodayCell = isToday(day)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div 
								onclick={() => handleDayClick(day)}
								class="bg-white p-2 relative min-h-[110px] md:min-h-[130px] flex flex-col gap-1 transition-all duration-200 cursor-pointer
									{isCurrentMonth ? 'text-[var(--color-earth)] hover:bg-[var(--color-sand-lightest)]' : 'text-gray-300 bg-gray-50/50'}
									{isTodayCell ? 'border-2 border-[var(--color-forest)] shadow-[inset_0_0_0_2px_rgba(107,143,78,0.08)]' : ''}"
							>
								<!-- Day Number -->
								<div class="flex justify-end">
									<span class="font-mono text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
										{isTodayCell ? 'bg-[var(--color-sage-20)] text-[var(--color-forest)] font-bold' : ''}"
									>
										{day.getDate()}
									</span>
								</div>

								<!-- Bookings within this day -->
								<div class="flex-grow space-y-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-hide">
									{#each dayBookings as booking (booking.id)}
										{@const isMaint = isMaintenance(booking)}
										<button 
											type="button"
											onclick={(e) => handleBookingClick(booking, e)}
											class="w-full text-left text-[11px] font-semibold px-2 py-1 rounded truncate border shadow-sm transition-all hover:scale-[1.02] hover:shadow
												{booking.status === 'completed'
													? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[rgba(107,143,78,0.2)] opacity-75'
													: isMaint 
														? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[rgba(232,168,32,0.3)]' 
														: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[rgba(59,130,176,0.3)]'}"
											title="{getBookingLabel(booking, day)} ({booking.rental_asset?.asset_code})"
										>
											{#if selectedAssetId === 'all'}
												<span class="font-mono font-bold text-[10px] mr-0.5">[{booking.rental_asset?.asset_code}]</span>
											{/if}
											{getBookingLabel(booking, day)}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Week View Grid -->
				<div class="p-6 bg-white space-y-6">
					<p class="text-xs text-[var(--color-stone)] italic mb-2">Menampilkan jadwal detail untuk 7 hari terdekat dari tanggal terpilih.</p>
					
					<div class="grid grid-cols-1 md:grid-cols-7 gap-4">
						{#each weekDays as day}
							{@const dayBookings = getBookingsForDay(day)}
							{@const isTodayCell = isToday(day)}
							
							<div 
								class="rounded-xl border p-4 flex flex-col min-h-[300px] bg-white transition-all
									{isTodayCell 
										? 'border-[var(--color-forest)] ring-[3px] ring-[var(--color-sage-10)] bg-[var(--color-sand-lightest)]/30' 
										: 'border-[var(--color-border)] hover:border-[var(--color-stone)]'}"
							>
								<!-- Day Header -->
								<div class="pb-3 border-b border-[var(--color-border-light)] flex justify-between items-baseline">
									<div class="font-heading font-bold text-sm text-[var(--color-earth)]">
										{new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(day)}
									</div>
									<div class="font-mono text-base font-bold text-[var(--color-forest)]">
										{day.getDate()}
									</div>
								</div>

								<!-- Add Button -->
								<button 
									type="button"
									onclick={() => handleDayClick(day)}
									class="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-[var(--color-border)] hover:border-[var(--color-forest)] hover:bg-[var(--color-sage-10)] text-[var(--color-stone)] hover:text-[var(--color-forest)] rounded-lg text-xs font-semibold transition-all"
								>
									<Plus size={12} /> Block
								</button>

								<!-- Bookings List -->
								<div class="mt-4 flex-grow space-y-2 overflow-y-auto max-h-[220px]">
									{#if dayBookings.length === 0}
										<div class="h-full flex items-center justify-center text-[var(--color-stone)] text-xs italic py-10">
											Ready
										</div>
									{:else}
										{#each dayBookings as booking (booking.id)}
											{@const isMaint = isMaintenance(booking)}
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div 
												onclick={(e) => handleBookingClick(booking, e)}
												class="p-2.5 rounded-lg border shadow-sm cursor-pointer hover:shadow transition-all text-xs font-medium flex flex-col gap-1
													{booking.status === 'completed'
														? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[rgba(107,143,78,0.2)] opacity-75'
														: isMaint 
															? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[rgba(232,168,32,0.3)]' 
															: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[rgba(59,130,176,0.3)]'}"
											>
												<div class="font-bold flex items-center justify-between">
													<span class="font-mono bg-white/60 px-1 py-0.5 rounded text-[10px]">
														{booking.rental_asset?.asset_code}
													</span>
													{#if booking.status === 'completed'}
														<span class="text-[9px] uppercase font-semibold">Done</span>
													{:else if isMaint}
														<span class="text-[9px] uppercase font-semibold">Maint</span>
													{:else}
														<span class="text-[9px] uppercase font-semibold">Rent</span>
													{/if}
												</div>
												<div class="font-semibold truncate">
													{getBookingLabel(booking, day)}
												</div>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Legend Footer -->
			<div class="flex items-center gap-6 p-4 border-t border-[var(--color-border)] bg-[var(--color-sand-lightest)]/60 text-[13px] font-semibold text-[var(--color-stone)] flex-wrap">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded bg-white border border-[var(--color-border)] shadow-inner"></div>
					<span>Ready (Siap Sewa)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded bg-[var(--color-info-bg)] border border-[rgba(59,130,176,0.3)] shadow-inner"></div>
					<span>Disewa (Aktif)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded bg-[var(--color-success-bg)] border border-[rgba(107,143,78,0.2)] shadow-inner opacity-75"></div>
					<span>Selesai (Dikembalikan)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded bg-[var(--color-warning-bg)] border border-[rgba(232,168,32,0.3)] shadow-inner"></div>
					<span>Maintenance (Dicuci / Perbaikan)</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- ====================================================
     MODAL: SCHEDULE MAINTENANCE
     ==================================================== -->
<Modal 
	bind:open={isMaintenanceModalOpen} 
	title="Atur Pemblokiran Unit (Maintenance)"
	size="md"
>
	<form 
		method="POST" 
		action="?/createMaintenance"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					isMaintenanceModalOpen = false;
				}
				await update();
			};
		}}
		class="space-y-4"
	>
		<input type="hidden" name="branch_id" value={selectedBranchId} />

		<div class="space-y-1">
			<label class="text-[13px] font-medium text-[var(--color-earth)]" for="rental_asset_id">Pilih Unit Fisik</label>
			<select 
				id="rental_asset_id"
				name="rental_asset_id"
				bind:value={maintenanceAssetId}
				class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)] font-mono"
				required
			>
				{#each (selectedItemId === 'all' ? assets : filteredAssets) as asset}
					<option value={asset.id}>{asset.asset_code} - {asset.item?.name} ({asset.status})</option>
				{/each}
			</select>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1">
				<label class="text-[13px] font-medium text-[var(--color-earth)]" for="start_date">Tanggal Mulai</label>
				<input 
					id="start_date"
					type="date" 
					name="start_date" 
					bind:value={maintenanceStartDate}
					class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)]"
					required
				/>
			</div>
			<div class="space-y-1">
				<label class="text-[13px] font-medium text-[var(--color-earth)]" for="end_date">Tanggal Selesai</label>
				<input 
					id="end_date"
					type="date" 
					name="end_date" 
					bind:value={maintenanceEndDate}
					class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)]"
					required
				/>
			</div>
		</div>

		<div class="space-y-1">
			<label class="text-[13px] font-medium text-[var(--color-earth)]" for="status">Jenis Blokir / Kategori</label>
			<select 
				id="status"
				name="status"
				bind:value={maintenanceType}
				class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)]"
			>
				<option value="maintenance">Perbaikan (Maintenance)</option>
				<option value="washing">Pembersihan (Washing)</option>
			</select>
		</div>

		<div class="space-y-1">
			<label class="text-[13px] font-medium text-[var(--color-earth)]" for="notes">Catatan Kerusakan / Pemeliharaan</label>
			<textarea 
				id="notes"
				name="notes"
				bind:value={maintenanceNotes}
				rows="3"
				placeholder="Contoh: Tiang tenda retak, dicuci karena lumpur tebal..."
				class="w-full bg-white border-[1.5px] border-[var(--color-border)] rounded-md px-3 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)]"
			></textarea>
		</div>

		<div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]">
			<Button variant="ghost" onclick={() => isMaintenanceModalOpen = false}>Batal</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Memproses...' : 'Simpan Blokir'}
			</Button>
		</div>
	</form>
</Modal>

<!-- ====================================================
     MODAL: BOOKING DETAIL
     ==================================================== -->
<Modal 
	bind:open={isDetailModalOpen} 
	title="Detail Jadwal Aset"
	size="md"
>
	{#if selectedBooking}
		{@const isMaint = isMaintenance(selectedBooking)}
		{@const ra = selectedBooking.rental_asset}
		{@const ti = selectedBooking.transaction_item}
		{@const t = ti?.transaction}
		{@const customer = t?.customer}

		<div class="space-y-6 py-2">
			<!-- Header info -->
			<div class="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-sand-lightest)]">
				<div class="w-12 h-12 rounded-lg bg-[var(--color-forest)]/10 text-[var(--color-forest)] flex items-center justify-center shrink-0">
					{#if isMaint}
						<Wrench size={24} />
					{:else}
						<Tent size={24} />
					{/if}
				</div>
				<div class="min-w-0">
					<h4 class="font-heading font-bold text-base text-[var(--color-earth)]">{ra?.item?.name}</h4>
					<p class="text-xs font-mono font-bold text-[var(--color-stone)] mt-0.5">Kode Aset: {ra?.asset_code}</p>
				</div>
			</div>

			<!-- Core Details -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Booking Type Badge -->
				<div class="space-y-1">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Tipe Jadwal</span>
					<div>
						{#if isMaint}
							<Badge variant="warning">Maintenance / Cuci</Badge>
						{:else}
							<Badge variant="info">Penyewaan Aktif</Badge>
						{/if}
					</div>
				</div>

				<!-- Date Range -->
				<div class="space-y-1">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Rentang Tanggal</span>
					<div class="text-sm font-semibold text-[var(--color-earth)]">
						{formatDate(selectedBooking.start_date, { day: '2-digit', month: 'short', year: 'numeric' })} s/d 
						{formatDate(selectedBooking.end_date, { day: '2-digit', month: 'short', year: 'numeric' })}
					</div>
				</div>

				{#if !isMaint}
					<!-- Transaction Code -->
					<div class="space-y-1">
						<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Kode Transaksi</span>
						<div class="text-sm font-mono font-bold text-[var(--color-earth)] flex items-center gap-1.5">
							<Hash size={14} class="text-[var(--color-stone)]" />
							{t?.transaction_code || '-'}
						</div>
					</div>

					<!-- Customer Name -->
					<div class="space-y-1">
						<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Nama Penyewa</span>
						<div class="text-sm font-semibold text-[var(--color-earth)] flex items-center gap-1.5">
							<User size={14} class="text-[var(--color-stone)]" />
							{customer?.full_name || 'Customer'}
						</div>
					</div>
				{/if}
			</div>

			{#if isMaint && selectedBooking.notes}
				<!-- Notes / Reason -->
				<div class="space-y-1 pt-2 border-t border-[var(--color-border-light)]/50">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Catatan Pemeliharaan</span>
					<p class="text-sm text-[var(--color-earth)] bg-[var(--color-cream)] p-3 rounded-lg border border-[var(--color-border-light)]/60">
						{selectedBooking.notes || '-'}
					</p>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-between items-center pt-4 border-t border-[var(--color-border-light)] mt-6">
				<!-- Cancel/Finish block (Only for maintenance OR if cashiers can cancel bookings) -->
				{#if isMaint}
					<form 
						method="POST" 
						action="?/deleteBooking"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									isDetailModalOpen = false;
								}
								await update();
							};
						}}
					>
						<input type="hidden" name="id" value={selectedBooking.id} />
						<input type="hidden" name="rental_asset_id" value={ra?.id} />
						<Button 
							type="submit" 
							variant="danger" 
							size="sm"
							class="flex items-center gap-1.5"
							disabled={isSubmitting}
						>
							<Trash2 size={14} /> Selesaikan Maintenance
						</Button>
					</form>
				{:else}
					<!-- For normal bookings, we can release the block in case of cancellations -->
					<form 
						method="POST" 
						action="?/deleteBooking"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ result, update }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									isDetailModalOpen = false;
								}
								await update();
							};
						}}
					>
						<input type="hidden" name="id" value={selectedBooking.id} />
						<input type="hidden" name="rental_asset_id" value={ra?.id} />
						<Button 
							type="submit" 
							variant="danger" 
							size="sm"
							class="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
							disabled={isSubmitting}
						>
							<Trash2 size={14} /> Lepas Booking Block
						</Button>
					</form>
				{/if}

				<Button variant="ghost" onclick={() => isDetailModalOpen = false}>Tutup</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	/* Hide standard scrollbars for category pills slider */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
