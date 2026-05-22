<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		Search, 
		Users, 
		User, 
		Plus, 
		Eye, 
		Edit, 
		Trash2, 
		ChevronLeft, 
		ChevronRight, 
		MapPin, 
		Info, 
		Calendar, 
		CreditCard, 
		AlertCircle, 
		CheckCircle,
		X,
		Activity,
		Phone,
		Mail,
		Home,
		FileText
	} from '@lucide/svelte';
	
	// Import shared UI components
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatDate, formatCurrency } from '$lib/utils/format';

	let { data, form } = $props();

	// Extracted page props
	let branches = $derived(data.branches);
	let selectedBranchId = $derived(data.selectedBranchId);
	let role = $derived(data.role);

	// Page state
	let searchQuery = $state('');
	let selectedStatus = $state('all'); // 'all', 'aktif', 'riwayat', 'bermasalah'
	let sortBy = $state('newest'); // 'newest', 'alphabetical', 'total_rentals'
	let currentPage = $state(1);
	const pageSize = 10;

	// Modals open state
	let isAddModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let isDetailModalOpen = $state(false);

	// Selected items for action
	/** @type {any} */
	let selectedCustomer = $state(null);
	let detailActiveTab = $state('general'); // 'general', 'active_rentals', 'history'

	// Form states
	let newCustomer = $state({
		full_name: '',
		phone: '',
		email: '',
		address: '',
		ktp_number: '',
		guarantee_type: 'KTP Asli',
		deposit_amount: 0,
		notes: ''
	});

	let editCustomer = $state({
		id: '',
		full_name: '',
		phone: '',
		email: '',
		address: '',
		ktp_number: '',
		guarantee_type: 'KTP Asli',
		deposit_amount: 0,
		notes: ''
	});

	let isSubmitting = $state(false);

	// Handle branch switcher (Owner only)
	/** @param {Event} e */
	function handleBranchChange(e) {
		const target = /** @type {HTMLSelectElement} */ (e.target);
		goto(`?branch_id=${target.value}`);
	}

	// Safely compute initials for avatar display
	/** @param {string} name */
	function getInitials(name) {
		if (!name) return '??';
		return name
			.trim()
			.split(/\s+/)
			.map(n => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	// 1. Process customers: Parse serialized JSON notes & calculate summary metrics
	let processedCustomers = $derived.by(() => {
		return data.customers.map(c => {
			let total_rentals = 0;
			let active_rentals_count = 0;
			let unpaid_penalties_count = 0;
			/** @type {string | null} */
			let last_rental_date = null;

			// Parse custom serialized fields inside the 'notes' column
			let ktp_number = '';
			let guarantee_type = 'KTP Asli';
			let deposit_amount = 0;
			let customerNotes = '';
			
			if (c.notes) {
				try {
					const json = JSON.parse(c.notes);
					if (json && typeof json === 'object') {
						ktp_number = json.ktp_number || '';
						guarantee_type = json.guarantee_type || 'KTP Asli';
						deposit_amount = Number(json.deposit_amount) || 0;
						customerNotes = json.notes || '';
					} else {
						customerNotes = c.notes;
					}
				} catch (e) {
					customerNotes = c.notes;
				}
			}

			// Parse rentals, status, and denda from customer transactions history
			c.transactions?.forEach(/** @param {any} tx */ (tx) => {
				const isRental = tx.type === 'rental' || tx.type === 'hybrid';
				const isPaid = tx.payment_status === 'paid';
				
				if (isRental && isPaid) {
					total_rentals++;
					if (!last_rental_date || new Date(tx.created_at) > new Date(last_rental_date)) {
						last_rental_date = tx.created_at;
					}
				}

				tx.transaction_items?.forEach(/** @param {any} item */ (item) => {
					if (item.rental_status === 'active' || item.rental_status === 'overdue') {
						active_rentals_count++;
					}
					item.penalties?.forEach(/** @param {any} penalty */ (penalty) => {
						if (penalty.payment_status === 'unpaid') {
							unpaid_penalties_count++;
						}
					});
				});
			});

			// Map transaction metrics to user-facing statuses
			let status = 'Baru'; // Default if 0 rentals
			if (unpaid_penalties_count > 0) {
				status = 'Ada Denda';
			} else if (active_rentals_count > 0) {
				status = 'Aktif Menyewa';
			} else if (total_rentals > 0) {
				status = 'Selesai';
			}

			return {
				...c,
				ktp_number,
				guarantee_type,
				deposit_amount,
				customerNotes,
				total_rentals,
				active_rentals_count,
				unpaid_penalties_count,
				last_rental_date,
				status
			};
		});
	});

	// 2. Compute Filtered & Sorted Customer list based on search/tabs/sort inputs
	let filteredAndSortedCustomers = $derived.by(() => {
		let list = [...processedCustomers];

		// Filter by status tab selection
		if (selectedStatus === 'aktif') {
			list = list.filter(c => c.status === 'Aktif Menyewa');
		} else if (selectedStatus === 'riwayat') {
			list = list.filter(c => c.status === 'Selesai');
		} else if (selectedStatus === 'bermasalah') {
			list = list.filter(c => c.status === 'Ada Denda');
		}

		// Filter by Search Query
		const query = searchQuery.trim().toLowerCase();
		if (query) {
			list = list.filter(c => 
				c.full_name?.toLowerCase().includes(query) ||
				c.phone?.toLowerCase().includes(query) ||
				c.ktp_number?.toLowerCase().includes(query)
			);
		}

		// Sort items
		if (sortBy === 'newest') {
			list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		} else if (sortBy === 'alphabetical') {
			list.sort((a, b) => a.full_name.localeCompare(b.full_name));
		} else if (sortBy === 'total_rentals') {
			list.sort((a, b) => b.total_rentals - a.total_rentals);
		}

		return list;
	});

	// 3. Compute counts for page cards dynamically
	let stats = $derived.by(() => {
		const total = processedCustomers.length;
		const active = processedCustomers.filter(c => c.status === 'Aktif Menyewa').length;
		const bermasalah = processedCustomers.filter(c => c.status === 'Ada Denda').length;
		return { total, active, bermasalah };
	});

	// 4. Client-side Pagination calculations
	let totalPages = $derived(Math.ceil(filteredAndSortedCustomers.length / pageSize) || 1);
	let paginatedCustomers = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredAndSortedCustomers.slice(start, start + pageSize);
	});

	// Keep pagination index in bound
	$effect(() => {
		const _q = searchQuery;
		const _s = selectedStatus;
		const _o = sortBy;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	// Helpers for detail modal tabs
	let selectedCustomerActiveRentals = $derived.by(() => {
		if (!selectedCustomer) return [];
		/** @type {any[]} */
		const list = [];
		selectedCustomer.transactions?.forEach(/** @param {any} tx */ (tx) => {
			if (tx.payment_status !== 'paid') return;
			tx.transaction_items?.forEach(/** @param {any} item */ (item) => {
				if (item.rental_status === 'active' || item.rental_status === 'overdue') {
					list.push({ ...item, transaction_code: tx.transaction_code });
				}
			});
		});
		return list;
	});

	let selectedCustomerHistoryRentals = $derived.by(() => {
		if (!selectedCustomer) return [];
		/** @type {any[]} */
		const list = [];
		selectedCustomer.transactions?.forEach(/** @param {any} tx */ (tx) => {
			if (tx.payment_status !== 'paid') return;
			tx.transaction_items?.forEach(/** @param {any} item */ (item) => {
				list.push({ ...item, transaction_code: tx.transaction_code, paid_at: tx.paid_at || tx.created_at });
			});
		});
		list.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
		return list;
	});

	// Modal opening triggers
	/** @param {any} customer */
	function openDetailModal(customer) {
		selectedCustomer = customer;
		detailActiveTab = 'general';
		isDetailModalOpen = true;
	}

	/** @param {any} customer */
	function openEditModal(customer) {
		editCustomer = {
			id: customer.id,
			full_name: customer.full_name || '',
			phone: customer.phone || '',
			email: customer.email || '',
			address: customer.address || '',
			ktp_number: customer.ktp_number || '',
			guarantee_type: customer.guarantee_type || 'KTP Asli',
			deposit_amount: customer.deposit_amount || 0,
			notes: customer.customerNotes || ''
		};
		isEditModalOpen = true;
	}

	/** @param {any} customer */
	function openDeleteModal(customer) {
		selectedCustomer = customer;
		isDeleteModalOpen = true;
	}
</script>

<div class="space-y-6 pb-12 animate-fade-in">
	
	<!-- Top Bar and Branch Switcher -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Data Penyewa</h1>
			<p class="text-[var(--color-stone)] mt-1">Kelola daftar pelanggan, informasi jaminan, dan riwayat transaksi sewa.</p>
		</div>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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

			<Button 
				size="md"
				class="flex items-center justify-center gap-2 shrink-0 font-semibold"
				onclick={() => isAddModalOpen = true}
			>
				<Plus size={18} /> Tambah Penyewa
			</Button>
		</div>
	</div>

	<!-- Error Banners -->
	{#if form?.error}
		<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium text-sm flex items-center gap-3">
			<AlertCircle size={18} class="shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Stats Counters Row -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<!-- Card 1: Total -->
		<Card padding="md" class="border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-[var(--color-sage-10)] flex items-center justify-center text-[var(--color-forest)] shrink-0">
					<Users size={22} />
				</div>
				<div>
					<p class="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Total Penyewa</p>
					<p class="text-3xl font-bold font-mono text-[var(--color-earth)] mt-0.5">{stats.total}</p>
				</div>
			</div>
			<div class="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-[var(--color-sage)] opacity-10 group-hover:scale-110 transition-transform">
				<Users size={80} />
			</div>
		</Card>

		<!-- Card 2: Aktif -->
		<Card padding="md" class="border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-[var(--color-info-bg)] flex items-center justify-center text-[var(--color-info)] shrink-0">
					<Activity size={22} />
				</div>
				<div>
					<p class="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Aktif Menyewa</p>
					<p class="text-3xl font-bold font-mono text-[var(--color-earth)] mt-0.5">{stats.active}</p>
				</div>
			</div>
			<div class="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-[var(--color-info)] opacity-10 group-hover:scale-110 transition-transform">
				<Activity size={80} />
			</div>
		</Card>

		<!-- Card 3: Ada Denda / Bermasalah -->
		<Card padding="md" class="border border-[var(--color-border)] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-[var(--color-error-bg)] flex items-center justify-center text-[var(--color-error)] shrink-0">
					<AlertCircle size={22} />
				</div>
				<div>
					<p class="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-stone)]">Penyewa Bermasalah</p>
					<p class="text-3xl font-bold font-mono text-[var(--color-earth)] mt-0.5">{stats.bermasalah}</p>
				</div>
			</div>
			<div class="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-[var(--color-error)] opacity-10 group-hover:scale-110 transition-transform">
				<AlertCircle size={80} />
			</div>
		</Card>
	</div>

	<!-- Controls: Search and Filters -->
	<div class="bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-sm)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
		<!-- Search Field -->
		<div class="relative flex-grow max-w-lg">
			<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] pointer-events-none" />
			<input 
				type="text"
				placeholder="Cari nama, telepon, atau No. KTP..."
				bind:value={searchQuery}
				class="w-full bg-[var(--color-cream)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-[var(--color-earth)] transition-all placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
			/>
		</div>

		<!-- Status Category Filter pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
			<button 
				type="button"
				onclick={() => selectedStatus = 'all'}
				class="px-4 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0
					{selectedStatus === 'all' 
						? 'bg-[var(--color-forest)] text-white border-[var(--color-forest)] font-semibold shadow-sm' 
						: 'bg-[var(--color-sand-lightest)] text-[var(--color-stone)] border-[var(--color-border-light)] hover:border-[var(--color-stone)]'}"
			>
				Semua ({processedCustomers.length})
			</button>
			<button 
				type="button"
				onclick={() => selectedStatus = 'aktif'}
				class="px-4 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0
					{selectedStatus === 'aktif' 
						? 'bg-[var(--color-info)] text-white border-[var(--color-info)] font-semibold shadow-sm' 
						: 'bg-[var(--color-sand-lightest)] text-[var(--color-info)] border-[var(--color-border-light)] hover:bg-[var(--color-info-bg)] hover:border-[var(--color-info)]'}"
			>
				Aktif Menyewa ({processedCustomers.filter(c => c.status === 'Aktif Menyewa').length})
			</button>
			<button 
				type="button"
				onclick={() => selectedStatus = 'riwayat'}
				class="px-4 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0
					{selectedStatus === 'riwayat' 
						? 'bg-[var(--color-success)] text-white border-[var(--color-success)] font-semibold shadow-sm' 
						: 'bg-[var(--color-sand-lightest)] text-[var(--color-success)] border-[var(--color-border-light)] hover:bg-[var(--color-success-bg)] hover:border-[var(--color-success)]'}"
			>
				Riwayat ({processedCustomers.filter(c => c.status === 'Selesai').length})
			</button>
			<button 
				type="button"
				onclick={() => selectedStatus = 'bermasalah'}
				class="px-4 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0
					{selectedStatus === 'bermasalah' 
						? 'bg-[var(--color-error)] text-white border-[var(--color-error)] font-semibold shadow-sm' 
						: 'bg-[var(--color-sand-lightest)] text-[var(--color-error)] border-[var(--color-border-light)] hover:bg-[var(--color-error-bg)] hover:border-[var(--color-error)]'}"
			>
				Bermasalah ({processedCustomers.filter(c => c.status === 'Ada Denda').length})
			</button>
		</div>

		<!-- Sort dropdown -->
		<div class="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-[var(--color-border-light)] pt-3 lg:pt-0 lg:pl-4 shrink-0">
			<span class="text-[13px] text-[var(--color-stone)] whitespace-nowrap">Urutkan:</span>
			<select 
				bind:value={sortBy}
				class="bg-transparent font-semibold text-sm text-[var(--color-earth)] focus:outline-none cursor-pointer pr-4"
			>
				<option value="newest">Terbaru</option>
				<option value="alphabetical">Nama A-Z</option>
				<option value="total_rentals">Sewa Terbanyak</option>
			</select>
		</div>
	</div>

	<!-- Data Table Container -->
	<div class="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-[var(--color-sand)] border-b border-[var(--color-border)]">
						<th class="py-3 px-4 w-12"></th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">Nama Lengkap</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">No. HP</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">No. KTP</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)] text-right w-24">Total Sewa</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)] w-36">Status</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">Terakhir Sewa</th>
						<th class="py-3 px-4 font-heading text-xs font-bold uppercase tracking-wider text-[var(--color-stone)] text-right w-28">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border-light)]">
					{#if paginatedCustomers.length === 0}
						<tr>
							<td colspan="8" class="text-center py-16 text-[var(--color-stone)]">
								<Users size={36} class="mx-auto mb-2 opacity-30" />
								<p class="font-medium text-sm">Tidak ada data penyewa yang cocok</p>
							</td>
						</tr>
					{:else}
						{#each paginatedCustomers as customer (customer.id)}
							<tr class="hover:bg-[var(--color-sand)]/20 transition-colors group">
								<!-- Initials Avatar -->
								<td class="py-3 px-4">
									<div class="w-8 h-8 rounded-full bg-[var(--color-sand)] flex items-center justify-center font-bold text-xs text-[var(--color-forest)]">
										{getInitials(customer.full_name)}
									</div>
								</td>
								<!-- Full name -->
								<td class="py-3 px-4 font-semibold text-[var(--color-earth)] group-hover:text-[var(--color-forest)] transition-colors">
									{customer.full_name}
								</td>
								<!-- Phone -->
								<td class="py-3 px-4 font-mono text-[13px] text-[var(--color-stone)]">
									{customer.phone || '-'}
								</td>
								<!-- KTP Number -->
								<td class="py-3 px-4 font-mono text-[13px] text-[var(--color-stone)]">
									{customer.ktp_number || '-'}
								</td>
								<!-- Total Rentals -->
								<td class="py-3 px-4 font-mono text-[13px] text-[var(--color-earth)] text-right font-bold">
									{customer.total_rentals}x
								</td>
								<!-- Status badge -->
								<td class="py-3 px-4">
									{#if customer.status === 'Aktif Menyewa'}
										<Badge variant="info">Aktif Menyewa</Badge>
									{:else if customer.status === 'Ada Denda'}
										<Badge variant="error">Ada Denda</Badge>
									{:else if customer.status === 'Selesai'}
										<Badge variant="success">Selesai</Badge>
									{:else}
										<Badge variant="neutral">Baru</Badge>
									{/if}
								</td>
								<!-- Last rental date -->
								<td class="py-3 px-4 text-[13px] text-[var(--color-stone)]">
									{customer.last_rental_date ? formatDate(customer.last_rental_date, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
								</td>
								<!-- Action buttons -->
								<td class="py-3 px-4 text-right">
									<div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
										<button 
											type="button" 
											onclick={() => openDetailModal(customer)}
											class="p-1 text-[var(--color-stone)] hover:text-[var(--color-info)] hover:bg-[var(--color-info-bg)] rounded transition-all"
											title="Lihat Rincian"
										>
											<Eye size={18} />
										</button>
										<button 
											type="button" 
											onclick={() => openEditModal(customer)}
											class="p-1 text-[var(--color-stone)] hover:text-[var(--color-forest)] hover:bg-[var(--color-sage-10)] rounded transition-all"
											title="Ubah Data"
										>
											<Edit size={18} />
										</button>
										<button 
											type="button" 
											onclick={() => openDeleteModal(customer)}
											class="p-1 text-[var(--color-stone)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] rounded transition-all"
											title="Hapus Penyewa"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer -->
		{#if filteredAndSortedCustomers.length > 0}
			<div class="p-4 border-t border-[var(--color-border-light)] bg-white flex justify-between items-center text-[var(--color-stone)]">
				<span class="text-[13px]">
					Menampilkan <strong class="text-[var(--color-earth)]">{(currentPage - 1) * pageSize + 1}</strong> sampai 
					<strong class="text-[var(--color-earth)]">{Math.min(currentPage * pageSize, filteredAndSortedCustomers.length)}</strong> dari 
					<strong class="text-[var(--color-earth)]">{filteredAndSortedCustomers.length}</strong> penyewa
				</span>
				<div class="flex items-center gap-1">
					<button 
						type="button"
						onclick={() => currentPage = Math.max(1, currentPage - 1)}
						disabled={currentPage === 1}
						class="p-1.5 rounded-lg border border-[var(--color-border-light)] hover:bg-[var(--color-sand)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
					>
						<ChevronLeft size={16} />
					</button>
					<span class="text-[13px] px-2 font-mono">Hal {currentPage} / {totalPages}</span>
					<button 
						type="button"
						onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
						disabled={currentPage === totalPages}
						class="p-1.5 rounded-lg border border-[var(--color-border-light)] hover:bg-[var(--color-sand)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- ========================================== -->
<!-- MODAL: TAMBAH PENYEWA -->
<!-- ========================================== -->
<Modal bind:open={isAddModalOpen} title="Tambah Penyewa Baru" size="md">
	<form 
		method="POST" 
		action="?/createCustomer" 
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				await update();
				if (result.type === 'success') {
					isAddModalOpen = false;
					newCustomer = {
						full_name: '',
						phone: '',
						email: '',
						address: '',
						ktp_number: '',
						guarantee_type: 'KTP Asli',
						deposit_amount: 0,
						notes: ''
					};
				}
			};
		}}
		class="space-y-4"
	>
		<!-- hidden branch fields if role is staff -->
		<input type="hidden" name="branch_id" value={selectedBranchId} />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input 
				label="Nama Lengkap" 
				name="full_name" 
				placeholder="Budi Santoso" 
				required 
				bind:value={newCustomer.full_name} 
			/>
			<Input 
				label="Nomor Handphone" 
				name="phone" 
				placeholder="0812-xxxx-xxxx" 
				bind:value={newCustomer.phone} 
			/>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input 
				label="Nomor KTP (NIK)" 
				name="ktp_number" 
				placeholder="3374xxxxxxxxxxxx" 
				bind:value={newCustomer.ktp_number} 
			/>
			<Input 
				label="Email Address" 
				name="email" 
				type="email"
				placeholder="budi@example.com" 
				bind:value={newCustomer.email} 
			/>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Select 
				label="Jenis Jaminan" 
				name="guarantee_type" 
				bind:value={newCustomer.guarantee_type}
			>
				<option value="KTP Asli">KTP Asli</option>
				<option value="SIM Asli">SIM Asli</option>
				<option value="KTM (Kartu Mahasiswa)">KTM (Kartu Mahasiswa)</option>
				<option value="KK (Kartu Keluarga)">KK (Kartu Keluarga)</option>
				<option value="Passport">Passport</option>
				<option value="Lainnya">Lainnya</option>
				<option value="Tanpa Jaminan">Tanpa Jaminan</option>
			</Select>

			<Input 
				label="Jumlah Uang Jaminan (Rp)" 
				name="deposit_amount" 
				type="number"
				min="0"
				placeholder="50000" 
				bind:value={newCustomer.deposit_amount} 
			/>
		</div>

		<Input 
			label="Alamat Rumah" 
			name="address" 
			placeholder="Jl. Gunung Gede No. 42, Kota Bogor" 
			bind:value={newCustomer.address} 
		/>

		<div class="flex flex-col gap-1.5">
			<label class="text-[13px] font-medium text-[var(--color-earth)]" for="notes-add">Catatan Internal / Keterangan Tambahan</label>
			<textarea 
				id="notes-add"
				name="notes"
				placeholder="Tulis catatan tambahan disini (seperti kontak darurat, preferensi, atau info blacklist)"
				bind:value={newCustomer.notes}
				rows="3"
				class="w-full bg-white border border-[var(--color-border)] rounded-md px-3.5 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
			></textarea>
		</div>

		<div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]/50">
			<Button variant="ghost" onclick={() => isAddModalOpen = false} disabled={isSubmitting}>Batal</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Tambah Penyewa'}
			</Button>
		</div>
	</form>
</Modal>

<!-- ========================================== -->
<!-- MODAL: UBAH DATA PENYEWA -->
<!-- ========================================== -->
<Modal bind:open={isEditModalOpen} title="Ubah Data Penyewa" size="md">
	<form 
		method="POST" 
		action="?/updateCustomer" 
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				await update();
				if (result.type === 'success') {
					isEditModalOpen = false;
				}
			};
		}}
		class="space-y-4"
	>
		<input type="hidden" name="id" value={editCustomer.id} />
		<input type="hidden" name="branch_id" value={selectedBranchId} />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input 
				label="Nama Lengkap" 
				name="full_name" 
				required 
				bind:value={editCustomer.full_name} 
			/>
			<Input 
				label="Nomor Handphone" 
				name="phone" 
				bind:value={editCustomer.phone} 
			/>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input 
				label="Nomor KTP (NIK)" 
				name="ktp_number" 
				bind:value={editCustomer.ktp_number} 
			/>
			<Input 
				label="Email Address" 
				name="email" 
				type="email"
				bind:value={editCustomer.email} 
			/>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Select 
				label="Jenis Jaminan" 
				name="guarantee_type" 
				bind:value={editCustomer.guarantee_type}
			>
				<option value="KTP Asli">KTP Asli</option>
				<option value="SIM Asli">SIM Asli</option>
				<option value="KTM (Kartu Mahasiswa)">KTM (Kartu Mahasiswa)</option>
				<option value="KK (Kartu Keluarga)">KK (Kartu Keluarga)</option>
				<option value="Passport">Passport</option>
				<option value="Lainnya">Lainnya</option>
				<option value="Tanpa Jaminan">Tanpa Jaminan</option>
			</Select>

			<Input 
				label="Jumlah Uang Jaminan (Rp)" 
				name="deposit_amount" 
				type="number"
				min="0"
				bind:value={editCustomer.deposit_amount} 
			/>
		</div>

		<Input 
			label="Alamat Rumah" 
			name="address" 
			bind:value={editCustomer.address} 
		/>

		<div class="flex flex-col gap-1.5">
			<label class="text-[13px] font-medium text-[var(--color-earth)]" for="notes-edit">Catatan Internal / Keterangan Tambahan</label>
			<textarea 
				id="notes-edit"
				name="notes"
				bind:value={editCustomer.notes}
				rows="3"
				class="w-full bg-white border border-[var(--color-border)] rounded-md px-3.5 py-2 text-[14px] text-[var(--color-earth)] transition-colors focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
			></textarea>
		</div>

		<div class="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]/50">
			<Button variant="ghost" onclick={() => isEditModalOpen = false} disabled={isSubmitting}>Batal</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
			</Button>
		</div>
	</form>
</Modal>

<!-- ========================================== -->
<!-- MODAL: HAPUS PENYEWA -->
<!-- ========================================== -->
<Modal bind:open={isDeleteModalOpen} title="Hapus Data Penyewa" size="sm">
	{#if selectedCustomer}
		<form 
			method="POST" 
			action="?/deleteCustomer" 
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					isSubmitting = false;
					await update();
					if (result.type === 'success') {
						isDeleteModalOpen = false;
						selectedCustomer = null;
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedCustomer.id} />

			<div class="bg-[var(--color-error-bg)]/50 border border-[var(--color-error)]/20 p-4 rounded-xl flex items-start gap-3">
				<AlertCircle size={20} class="text-[var(--color-error)] shrink-0 mt-0.5" />
				<div>
					<h4 class="font-bold text-sm text-[var(--color-error)]">Tindakan ini tidak bisa dibatalkan</h4>
					<p class="text-xs text-[var(--color-stone)] mt-1">
						Apakah Anda yakin ingin menghapus data penyewa <strong class="text-[var(--color-earth)]">{selectedCustomer.full_name}</strong>?
						Data transaksi dan jaminan terkait akan terpengaruh jika data dihapus.
					</p>
				</div>
			</div>

			<div class="flex justify-end gap-3 pt-4">
				<Button variant="ghost" onclick={() => isDeleteModalOpen = false} disabled={isSubmitting}>Batal</Button>
				<Button type="submit" variant="danger" disabled={isSubmitting}>
					{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
				</Button>
			</div>
		</form>
	{/if}
</Modal>

<!-- ========================================== -->
<!-- MODAL: RINCIAN PENYEWA (DETAIL VIEW) -->
<!-- ========================================== -->
<Modal bind:open={isDetailModalOpen} title="Rincian Profil Penyewa" size="lg">
	{#if selectedCustomer}
		<div class="flex flex-col h-full gap-5 pb-4">
			
			<!-- Avatar & Brief Summary Header -->
			<div class="flex items-center gap-4 bg-[var(--color-sand)]/30 p-4 rounded-2xl border border-[var(--color-border-light)]">
				<div class="w-14 h-14 rounded-full bg-[var(--color-sand)] flex items-center justify-center font-bold text-xl text-[var(--color-forest)] border-2 border-white shadow-sm shrink-0">
					{getInitials(selectedCustomer.full_name)}
				</div>
				<div class="flex-grow min-w-0">
					<h2 class="text-xl font-bold font-heading text-[var(--color-earth)] truncate">{selectedCustomer.full_name}</h2>
					<div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[13px] text-[var(--color-stone)]">
						<span class="flex items-center gap-1"><Phone size={14} /> {selectedCustomer.phone || '-'}</span>
						<span class="flex items-center gap-1"><Mail size={14} /> {selectedCustomer.email || '-'}</span>
					</div>
				</div>
				<div class="shrink-0">
					{#if selectedCustomer.status === 'Aktif Menyewa'}
						<Badge variant="info">Aktif Menyewa</Badge>
					{:else if selectedCustomer.status === 'Ada Denda'}
						<Badge variant="error">Ada Denda</Badge>
					{:else if selectedCustomer.status === 'Selesai'}
						<Badge variant="success">Selesai</Badge>
					{:else}
						<Badge variant="neutral">Baru</Badge>
					{/if}
				</div>
			</div>

			<!-- Tab Selection Navigation -->
			<div class="flex border-b border-[var(--color-border-light)] gap-1 shrink-0">
				<button 
					type="button"
					onclick={() => detailActiveTab = 'general'}
					class="px-5 py-2.5 text-[14px] font-semibold border-b-2 transition-colors flex items-center gap-2
						{detailActiveTab === 'general' 
							? 'border-[var(--color-forest)] text-[var(--color-forest)]' 
							: 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
				>
					<User size={16} /> Informasi Umum
				</button>
				<button 
					type="button"
					onclick={() => detailActiveTab = 'active_rentals'}
					class="px-5 py-2.5 text-[14px] font-semibold border-b-2 transition-colors flex items-center gap-2 relative
						{detailActiveTab === 'active_rentals' 
							? 'border-[var(--color-forest)] text-[var(--color-forest)]' 
							: 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
				>
					<Activity size={16} /> Sewa Aktif
					{#if selectedCustomerActiveRentals.length > 0}
						<span class="bg-[var(--color-info)] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold font-mono">
							{selectedCustomerActiveRentals.length}
						</span>
					{/if}
				</button>
				<button 
					type="button"
					onclick={() => detailActiveTab = 'history'}
					class="px-5 py-2.5 text-[14px] font-semibold border-b-2 transition-colors flex items-center gap-2
						{detailActiveTab === 'history' 
							? 'border-[var(--color-forest)] text-[var(--color-forest)]' 
							: 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth)]'}"
				>
					<FileText size={16} /> Riwayat Transaksi
				</button>
			</div>

			<!-- Tab Contents Area -->
			<div class="flex-grow min-h-[300px] overflow-y-auto">
				<!-- TAB 1: GENERAL INFO -->
				{#if detailActiveTab === 'general'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
						<!-- Identity Info Card -->
						<div class="space-y-4">
							<div>
								<span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">No. KTP / NIK</span>
								<p class="font-mono font-medium text-sm text-[var(--color-earth)] mt-1 p-2.5 bg-[var(--color-cream)] rounded-lg border border-[var(--color-border-light)] select-all">
									{selectedCustomer.ktp_number || '-'}
								</p>
							</div>
							<div>
								<span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Alamat Rumah</span>
								<div class="flex gap-2 font-medium text-sm text-[var(--color-earth)] mt-1 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-border-light)]">
									<Home size={16} class="text-[var(--color-stone)] shrink-0 mt-0.5" />
									<span>{selectedCustomer.address || '-'}</span>
								</div>
							</div>
							<div>
								<span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Catatan Pelanggan / Internal</span>
								<p class="font-medium text-sm text-[var(--color-earth)] mt-1 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-border-light)] italic whitespace-pre-line">
									{selectedCustomer.customerNotes || 'Tidak ada catatan tambahan.'}
								</p>
							</div>
						</div>

						<!-- Guarantee Info Card -->
						<div class="space-y-4">
							<div>
								<span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Jaminan Tersimpan</span>
								<div class="flex gap-2 items-center font-medium text-sm text-[var(--color-earth)] mt-1 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-border-light)]">
									<CreditCard size={18} class="text-[var(--color-forest)] shrink-0" />
									<div>
										<span class="font-bold text-[var(--color-forest)]">{selectedCustomer.guarantee_type}</span>
										<span class="text-xs text-[var(--color-stone)] block">Diverifikasi saat checkout rental</span>
									</div>
								</div>
							</div>

							<div>
								<span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Uang Deposit</span>
								<div class="font-mono font-bold text-lg text-[var(--color-earth)] mt-1 p-3 bg-[var(--color-cream)] rounded-lg border border-[var(--color-border-light)] flex justify-between items-center">
									<span>{formatCurrency(selectedCustomer.deposit_amount)}</span>
									<span class="text-xs font-normal font-sans text-[var(--color-stone)]">Deposit Jaminan</span>
								</div>
							</div>

							<!-- Rent aggregates -->
							<div class="grid grid-cols-2 gap-3 pt-2">
								<div class="p-3 bg-[var(--color-sage-10)] rounded-xl text-center border border-[var(--color-forest)]/10">
									<span class="text-[11px] font-semibold text-[var(--color-forest)] uppercase tracking-wider block">Total Rental</span>
									<span class="font-mono text-2xl font-bold text-[var(--color-forest)] block mt-1">{selectedCustomer.total_rentals}x</span>
								</div>
								<div class="p-3 bg-[var(--color-sand)] rounded-xl text-center border border-[var(--color-border-light)]">
									<span class="text-[11px] font-semibold text-[var(--color-stone)] uppercase tracking-wider block">Denda Unpaid</span>
									<span class="font-mono text-2xl font-bold text-[var(--color-error)] block mt-1">{selectedCustomer.unpaid_penalties_count}x</span>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 2: ACTIVE RENTALS -->
				{:else if detailActiveTab === 'active_rentals'}
					{#if selectedCustomerActiveRentals.length === 0}
						<div class="text-center py-16 text-[var(--color-stone)]">
							<Calendar size={36} class="mx-auto mb-2 opacity-30" />
							<p class="font-semibold text-sm">Tidak ada barang sewa aktif saat ini</p>
							<p class="text-xs mt-1">Pelanggan telah mengembalikan semua barang atau belum pernah menyewa.</p>
						</div>
					{:else}
						<div class="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
							<table class="w-full text-left border-collapse text-sm">
								<thead>
									<tr class="bg-[var(--color-sand)] border-b border-[var(--color-border)]">
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">Nama Aset / Item</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">No Nota</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">Mulai</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">Selesai</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase w-28">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-[var(--color-border-light)]">
									{#each selectedCustomerActiveRentals as rent}
										<tr class="hover:bg-[var(--color-cream)]">
											<td class="p-3 font-medium text-[var(--color-earth)]">{rent.item_name}</td>
											<td class="p-3 font-mono text-[13px] text-[var(--color-stone)]">{rent.transaction_code}</td>
											<td class="p-3 text-[13px]">{rent.rental_start_date ? formatDate(rent.rental_start_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
											<td class="p-3 text-[13px]">{rent.rental_end_date ? formatDate(rent.rental_end_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
											<td class="p-3">
												{#if rent.rental_status === 'overdue'}
													<Badge variant="error">Terlambat</Badge>
												{:else}
													<Badge variant="info">Aktif</Badge>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}

				<!-- TAB 3: TRANSACTION HISTORY -->
				{:else if detailActiveTab === 'history'}
					{#if selectedCustomerHistoryRentals.length === 0}
						<div class="text-center py-16 text-[var(--color-stone)]">
							<FileText size={36} class="mx-auto mb-2 opacity-30" />
							<p class="font-semibold text-sm">Belum ada riwayat transaksi</p>
							<p class="text-xs mt-1">Transaksi yang dibayar lunas akan tercatat di riwayat ini.</p>
						</div>
					{:else}
						<div class="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
							<table class="w-full text-left border-collapse text-sm">
								<thead>
									<tr class="bg-[var(--color-sand)] border-b border(--color-border)">
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">Tanggal</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">No Nota</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase">Barang Sewa</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase text-right">Subtotal</th>
										<th class="p-3 font-heading text-xs font-bold text-[var(--color-stone)] uppercase w-28">Kondisi Kembali</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-[var(--color-border-light)]">
									{#each selectedCustomerHistoryRentals as hist}
										<tr class="hover:bg-[var(--color-cream)]">
											<td class="p-3 text-[13px] text-[var(--color-stone)]">
												{formatDate(hist.paid_at, { day: '2-digit', month: 'short', year: 'numeric' })}
											</td>
											<td class="p-3 font-mono text-[13px] text-[var(--color-stone)]">{hist.transaction_code}</td>
											<td class="p-3 font-medium text-[var(--color-earth)]">
												{hist.item_name} <span class="text-xs text-[var(--color-stone)] font-normal">(x{hist.quantity})</span>
											</td>
											<td class="p-3 font-mono text-right text-[13px]">{formatCurrency(hist.subtotal)}</td>
											<td class="p-3">
												{#if hist.rental_status === 'returned'}
													{#if hist.return_condition === 'good'}
														<Badge variant="success">Bagus</Badge>
													{:else if hist.return_condition === 'minor_damage'}
														<Badge variant="warning">Rusak Ringan</Badge>
													{:else if hist.return_condition === 'major_damage'}
														<Badge variant="error">Rusak Berat</Badge>
													{:else}
														<Badge variant="neutral">Kembali</Badge>
													{/if}
												{:else if hist.rental_status === 'lost'}
													<Badge variant="error">Hilang</Badge>
												{:else if hist.rental_status === 'active' || hist.rental_status === 'overdue'}
													<Badge variant="info">Disewa</Badge>
												{:else}
													<span class="text-xs text-[var(--color-stone)] capitalize">{hist.rental_status || '-'}</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{/if}
			</div>

			<div class="flex justify-end pt-4 border-t border-[var(--color-border-light)]/50 shrink-0">
				<Button variant="ghost" onclick={() => isDetailModalOpen = false}>Tutup</Button>
			</div>
		</div>
	{/if}
</Modal>
