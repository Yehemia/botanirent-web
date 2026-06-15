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
		is_active: true
	});

	function openAddModal() {
		isEditing = false;
		formData = { id: '', name: '', address: '', phone: '', is_active: true };
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
			</div>

			<div class="mt-6 flex justify-end gap-2 border-t border-[var(--color-border-light)] pt-4">
				<Button variant="ghost" size="sm" onclick={() => openEditModal(branch)}>
					{#snippet iconLeft()}<Edit2 size={16} />{/snippet}
					Edit
				</Button>

				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={branch.id} />
					<Button
						variant="ghost"
						size="sm"
						type="submit"
						class="text-[var(--color-error)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
						onclick={(e) => {
							if (!confirm('Yakin ingin menghapus cabang ini?')) e.preventDefault();
						}}
					>
						{#snippet iconLeft()}<Trash2 size={16} />{/snippet}
					</Button>
				</form>
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
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showModal = false)}>Batal</Button>
		<Button form="branch-form" type="submit" disabled={loading}>
			{loading ? 'Menyimpan...' : 'Simpan Cabang'}
		</Button>
	{/snippet}
</Modal>
