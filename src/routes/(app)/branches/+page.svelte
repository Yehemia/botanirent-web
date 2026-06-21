<script>
	import { enhance } from '$app/forms';
	import { Plus, Edit2, Trash2, Store, MapPin, Phone } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();

	// State untuk modal
	let showModal = $state(false);
	let isEditing = $state(false);
	let loading = $state(false);

	// State form data
	let formData = $state({
		id: '',
		name: '',
		address: '',
		phone: '',
		is_active: true,
		deactivation_notes: ''
	});

	// State untuk modal deaktifasi
	let showDeactivateModal = $state(false);
	let deactivateId = $state('');
	let deactivateNotes = $state('');
	let deactivateLoading = $state(false);

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleDeactivateSubmit() {
		deactivateLoading = true;
		return async ({ update, result }) => {
			deactivateLoading = false;
			if (result.type === 'success') {
				showDeactivateModal = false;
			}
			update();
		};
	}

	function openAddModal() {
		isEditing = false;
		formData = { id: '', name: '', address: '', phone: '', is_active: true, deactivation_notes: '' };
		showModal = true;
	}

	/** @param {any} branch */
	function openEditModal(branch) {
		isEditing = true;
		formData = { ...branch };
		showModal = true;
	}

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleSubmit() {
		loading = true;
		return async ({ update, result }) => {
			loading = false;
			if (result.type === 'success') {
				showModal = false;
			}
			update();
		};
	}
</script>

<div class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
	<div>
		<h2 class="font-heading text-2xl font-bold text-[var(--color-earth)]">Manajemen Cabang</h2>
		<p class="text-sm text-[var(--color-stone)]">
			Kelola lokasi toko dan status operasional cabang Anda.
		</p>
	</div>

	<Button onclick={openAddModal}>
		{#snippet iconLeft()}<Plus size={18} />{/snippet}
		Tambah Cabang
	</Button>
</div>

{#if form?.error}
	<div
		class="mb-6 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm text-[var(--color-error)]"
	>
		{form.error}
	</div>
{/if}

<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
	{#each data.branches as branch}
		<Card hoverable class="relative flex h-full flex-col">
			<div class="mb-4 flex items-start justify-between">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-sage-10)] text-[var(--color-forest)]"
				>
					<Store size={24} />
				</div>
				<Badge variant={branch.is_active ? 'success' : 'neutral'}>
					{branch.is_active ? 'Aktif' : 'Nonaktif'}
				</Badge>
			</div>

			<h3 class="mb-1 text-lg font-bold text-[var(--color-earth)]">{branch.name}</h3>

			<div class="mt-4 flex-grow space-y-2 text-sm text-[var(--color-stone)]">
				<div class="flex items-start gap-2">
					<MapPin size={16} class="mt-0.5 shrink-0" />
					<span>{branch.address || 'Belum ada alamat'}</span>
				</div>
				<div class="flex items-center gap-2">
					<Phone size={16} class="shrink-0" />
					<span>{branch.phone || '-'}</span>
				</div>
				{#if !branch.is_active && branch.deactivation_notes}
					<div class="mt-3 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/15 p-3 text-xs text-[var(--color-error)]">
						<strong class="block mb-0.5">Alasan Nonaktif:</strong>
						{branch.deactivation_notes}
					</div>
				{/if}
			</div>

			<div class="mt-6 flex justify-end gap-2 border-t border-[var(--color-border-light)] pt-4">
				<Button variant="ghost" size="sm" onclick={() => openEditModal(branch)}>
					{#snippet iconLeft()}<Edit2 size={16} />{/snippet}
					Edit
				</Button>

				{#if branch.is_active}
					<Button
						variant="ghost"
						size="sm"
						class="text-[var(--color-error)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
						onclick={() => {
							deactivateId = branch.id;
							deactivateNotes = '';
							showDeactivateModal = true;
						}}
					>
						{#snippet iconLeft()}<Trash2 size={16} />{/snippet} Nonaktifkan
					</Button>
				{:else}
					<form method="POST" action="?/activate" use:enhance>
						<input type="hidden" name="id" value={branch.id} />
						<Button
							variant="ghost"
							size="sm"
							type="submit"
							class="text-[var(--color-forest)] hover:bg-[var(--color-sage-10)]"
						>
							Aktifkan Kembali
						</Button>
					</form>
				{/if}
			</div>
		</Card>
	{:else}
		<div
			class="col-span-full py-12 text-center text-[var(--color-stone)] bg-white rounded-lg border border-dashed border-[var(--color-border)]"
		>
			<Store size={48} class="mx-auto mb-4 opacity-50" />
			<p>Belum ada cabang terdaftar.</p>
		</div>
	{/each}
</div>

<!-- Form Modal -->
<Modal bind:open={showModal} title={isEditing ? 'Edit Cabang' : 'Tambah Cabang Baru'}>
	<form id="branch-form" method="POST" action="?/save" use:enhance={handleSubmit} class="space-y-4">
		{#if isEditing}
			<input type="hidden" name="id" value={formData.id} />
		{/if}

		<Input
			id="name"
			name="name"
			label="Nama Cabang"
			placeholder="Contoh: Botani Outdoor - Bogor"
			bind:value={formData.name}
			required
		/>

		<div class="flex flex-col gap-1.5">
			<label for="address" class="text-[13px] font-medium text-[var(--color-earth)]"
				>Alamat Lengkap</label
			>
			<textarea
				id="address"
				name="address"
				rows="3"
				class="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)] focus:outline-none"
				placeholder="Alamat jalan, kota..."
				bind:value={formData.address}
			></textarea>
		</div>

		<Input
			id="phone"
			name="phone"
			type="tel"
			label="Nomor Telepon"
			placeholder="Contoh: 081234567890"
			bind:value={formData.phone}
		/>

		<div class="pt-2">
			<label class="flex cursor-pointer items-center gap-3">
				<div class="relative">
					<input type="hidden" name="is_active" value={formData.is_active.toString()} />
					<input type="checkbox" bind:checked={formData.is_active} class="peer sr-only" />
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[var(--color-forest)] peer-focus:ring-4 peer-focus:ring-[var(--color-sage-20)] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</div>
				<span class="text-sm font-medium text-[var(--color-earth)]">
					{formData.is_active ? 'Cabang Aktif' : 'Cabang Nonaktif'}
				</span>
			</label>
		</div>

		{#if !formData.is_active}
			<div class="flex flex-col gap-1.5 animate-fade-in">
				<label for="deactivation_notes" class="text-[13px] font-medium text-[var(--color-error)]"
					>Catatan Penonaktifan <span class="text-[var(--color-error)]">*</span></label
				>
				<textarea
					id="deactivation_notes"
					name="deactivation_notes"
					rows="2"
					class="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)] focus:outline-none"
					placeholder="Tuliskan alasan penonaktifan cabang..."
					bind:value={formData.deactivation_notes}
					required={!formData.is_active}
				></textarea>
			</div>
		{/if}
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showModal = false)}>Batal</Button>
		<Button form="branch-form" type="submit" disabled={loading}>
			{loading ? 'Menyimpan...' : 'Simpan Cabang'}
		</Button>
	{/snippet}
</Modal>

<!-- Modal Konfirmasi Nonaktifkan Cabang -->
<Modal bind:open={showDeactivateModal} title="Nonaktifkan Cabang">
	<form id="deactivate-form" method="POST" action="?/delete" use:enhance={handleDeactivateSubmit} class="space-y-4">
		<input type="hidden" name="id" value={deactivateId} />
		<div class="flex flex-col gap-3">
			<p class="text-sm leading-relaxed text-[var(--color-stone)]">
				Apakah Anda yakin ingin menonaktifkan cabang ini? Cabang yang dinonaktifkan tidak akan muncul di kasir (POS) dan menu pemilih cabang.
			</p>
			
			<div class="flex flex-col gap-1.5">
				<label for="modal_deactivation_notes" class="text-[13px] font-medium text-[var(--color-error)]"
					>Alasan Penonaktifan <span class="text-[var(--color-error)]">*</span></label
				>
				<textarea
					id="modal_deactivation_notes"
					name="deactivation_notes"
					rows="3"
					class="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-error)] focus:ring-[3px] focus:ring-[var(--color-error-bg)] focus:outline-none"
					placeholder="Tuliskan alasan mengapa cabang ini dinonaktifkan..."
					bind:value={deactivateNotes}
					required
				></textarea>
			</div>
		</div>
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showDeactivateModal = false)}>Batal</Button>
		<Button form="deactivate-form" type="submit" disabled={deactivateLoading} class="bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90">
			{deactivateLoading ? 'Memproses...' : 'Nonaktifkan Cabang'}
		</Button>
	{/snippet}
</Modal>
