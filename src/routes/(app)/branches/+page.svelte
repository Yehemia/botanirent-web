<script>
	import { enhance } from '$app/forms';
	import { Plus, Edit2, Trash2, Store, MapPin, Phone } from 'lucide-svelte';
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

	function openEditModal(branch) {
		isEditing = true;
		formData = { ...branch };
		showModal = true;
	}

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

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
	<div>
		<h2 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Manajemen Cabang</h2>
		<p class="text-[var(--color-stone)] text-sm">Kelola lokasi toko dan status operasional cabang Anda.</p>
	</div>
	
	<Button onclick={openAddModal}>
		{#snippet iconLeft()}<Plus size={18} />{/snippet}
		Tambah Cabang
	</Button>
</div>

{#if form?.error}
	<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm p-4 rounded-md mb-6 border border-[var(--color-error)]/20">
		{form.error}
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
	{#each data.branches as branch}
		<Card hoverable class="flex flex-col h-full relative">
			<div class="flex justify-between items-start mb-4">
				<div class="w-12 h-12 rounded-full bg-[var(--color-sage-10)] flex items-center justify-center text-[var(--color-forest)]">
					<Store size={24} />
				</div>
				<Badge variant={branch.is_active ? 'success' : 'neutral'}>
					{branch.is_active ? 'Aktif' : 'Nonaktif'}
				</Badge>
			</div>
			
			<h3 class="text-lg font-bold text-[var(--color-earth)] mb-1">{branch.name}</h3>
			
			<div class="space-y-2 mt-4 flex-grow text-sm text-[var(--color-stone)]">
				<div class="flex items-start gap-2">
					<MapPin size={16} class="shrink-0 mt-0.5" />
					<span>{branch.address || 'Belum ada alamat'}</span>
				</div>
				<div class="flex items-center gap-2">
					<Phone size={16} class="shrink-0" />
					<span>{branch.phone || '-'}</span>
				</div>
			</div>
			
			<div class="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-border-light)]">
				<Button variant="ghost" size="sm" onclick={() => openEditModal(branch)}>
					{#snippet iconLeft()}<Edit2 size={16} />{/snippet}
					Edit
				</Button>
				
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={branch.id}>
					<Button variant="ghost" size="sm" type="submit" class="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" onclick={(e) => {
						if(!confirm('Yakin ingin menghapus cabang ini?')) e.preventDefault();
					}}>
						{#snippet iconLeft()}<Trash2 size={16} />{/snippet}
					</Button>
				</form>
			</div>
		</Card>
	{:else}
		<div class="col-span-full py-12 text-center text-[var(--color-stone)] bg-white rounded-lg border border-dashed border-[var(--color-border)]">
			<Store size={48} class="mx-auto mb-4 opacity-50" />
			<p>Belum ada cabang terdaftar.</p>
		</div>
	{/each}
</div>

<!-- Form Modal -->
<Modal 
	bind:open={showModal} 
	title={isEditing ? 'Edit Cabang' : 'Tambah Cabang Baru'}
>
	<form id="branch-form" method="POST" action="?/save" use:enhance={handleSubmit} class="space-y-4">
		{#if isEditing}
			<input type="hidden" name="id" value={formData.id}>
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
			<label for="address" class="text-[13px] font-medium text-[var(--color-earth)]">Alamat Lengkap</label>
			<textarea 
				id="address" 
				name="address" 
				rows="3" 
				class="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
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
			<label class="flex items-center gap-3 cursor-pointer">
				<div class="relative">
					<input type="hidden" name="is_active" value={formData.is_active.toString()} />
					<input type="checkbox" bind:checked={formData.is_active} class="sr-only peer">
					<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-sage-20)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-forest)]"></div>
				</div>
				<span class="text-sm font-medium text-[var(--color-earth)]">
					{formData.is_active ? 'Cabang Aktif' : 'Cabang Nonaktif'}
				</span>
			</label>
		</div>
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showModal = false}>Batal</Button>
		<Button form="branch-form" type="submit" disabled={loading}>
			{loading ? 'Menyimpan...' : 'Simpan Cabang'}
		</Button>
	{/snippet}
</Modal>
