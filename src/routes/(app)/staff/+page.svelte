<script>
	import { enhance } from '$app/forms';
	import { UserPlus, Shield, Store, Mail, Power, CheckCircle2 } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	
	let showModal = $state(false);
	let loading = $state(false);
	
	let formData = $state({
		email: '',
		full_name: '',
		role: 'kasir',
		branch_id: ''
	});

	function openInviteModal() {
		formData = { email: '', full_name: '', role: 'kasir', branch_id: data.branches[0]?.id || '' };
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

<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
	<div>
		<h2 class="text-2xl font-bold font-heading text-[var(--color-earth)]">Manajemen Staff</h2>
		<p class="text-[var(--color-stone)] text-sm">Kelola akses Kasir dan Admin Gudang ke cabang-cabang Anda.</p>
	</div>
	
	<Button onclick={openInviteModal}>
		{#snippet iconLeft()}<UserPlus size={18} />{/snippet}
		Undang Staff
	</Button>
</div>

{#if form?.error}
	<div class="bg-[var(--color-error-bg)] text-[var(--color-error)] text-sm p-4 rounded-md mb-6 border border-[var(--color-error)]/20">
		{form.error}
	</div>
{/if}

{#if form?.success}
	<div class="bg-[var(--color-success-bg)] text-[var(--color-success)] text-sm p-4 rounded-md mb-6 border border-[var(--color-success)]/20 flex items-center gap-2">
		<CheckCircle2 size={18} /> Undangan berhasil dikirim ke email staff!
	</div>
{/if}

<div class="bg-white rounded-xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-[var(--color-sand-lightest)] border-b border-[var(--color-border-light)] text-sm font-semibold text-[var(--color-stone)]">
					<th class="py-4 px-6">Nama Lengkap</th>
					<th class="py-4 px-6">Role</th>
					<th class="py-4 px-6">Penempatan Cabang</th>
					<th class="py-4 px-6 text-center">Status</th>
					<th class="py-4 px-6 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.staff as staff}
					<tr class="border-b border-[var(--color-border-light)] hover:bg-gray-50/50 transition-colors">
						<td class="py-4 px-6">
							<div class="font-medium text-[var(--color-earth)]">{staff.full_name || 'Menunggu pendaftaran...'}</div>
						</td>
						<td class="py-4 px-6">
							<div class="flex items-center gap-2 text-sm text-[var(--color-stone)]">
								<Shield size={16} />
								<span class="capitalize">{staff.role}</span>
							</div>
						</td>
						<td class="py-4 px-6">
							{#if staff.branches}
								<div class="flex items-center gap-2 text-sm text-[var(--color-stone)]">
									<Store size={16} />
									<span>{staff.branches.name}</span>
								</div>
							{:else}
								<span class="text-sm text-gray-400">-</span>
							{/if}
						</td>
						<td class="py-4 px-6 text-center">
							<Badge variant={staff.is_active ? 'success' : 'neutral'}>
								{staff.is_active ? 'Aktif' : 'Nonaktif'}
							</Badge>
						</td>
						<td class="py-4 px-6 text-right">
							{#if staff.role !== 'owner'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={staff.id}>
									<input type="hidden" name="is_active" value={(!staff.is_active).toString()}>
									
									<Button variant="ghost" size="sm" type="submit" 
										class={staff.is_active ? "text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)]" : "text-[var(--color-success)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-bg)]"}
									>
										{#snippet iconLeft()}<Power size={16} />{/snippet}
										{staff.is_active ? 'Nonaktifkan' : 'Aktifkan'}
									</Button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Invite -->
<Modal 
	bind:open={showModal} 
	title="Undang Staff Baru"
>
	<form id="invite-form" method="POST" action="?/invite" use:enhance={handleSubmit} class="space-y-4">
		
		<p class="text-sm text-[var(--color-stone)] mb-4">
			Staff akan menerima email undangan berisi link untuk mengatur password mereka sendiri.
		</p>

		<Input 
			id="full_name" 
			name="full_name" 
			label="Nama Lengkap" 
			placeholder="Contoh: Budi Santoso" 
			bind:value={formData.full_name}
			required
		/>

		<Input 
			id="email" 
			name="email" 
			type="email"
			label="Alamat Email" 
			placeholder="budi@example.com" 
			bind:value={formData.email}
			required
		>
			{#snippet iconLeft()}<Mail size={18} />{/snippet}
		</Input>
		
		<div class="flex flex-col gap-1.5">
			<label for="role" class="text-[13px] font-medium text-[var(--color-earth)]">Role / Jabatan</label>
			<div class="relative">
				<select 
					id="role" 
					name="role" 
					bind:value={formData.role}
					class="w-full bg-white border border-[var(--color-border)] rounded-md pl-10 pr-3 py-2 text-sm appearance-none focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
					required
				>
					<option value="kasir">Kasir (POS & Transaksi)</option>
					<option value="gudang">Admin Gudang (Inventaris & Aset)</option>
				</select>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
					<Shield size={18} />
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="branch_id" class="text-[13px] font-medium text-[var(--color-earth)]">Penempatan Cabang</label>
			<div class="relative">
				<select 
					id="branch_id" 
					name="branch_id" 
					bind:value={formData.branch_id}
					class="w-full bg-white border border-[var(--color-border)] rounded-md pl-10 pr-3 py-2 text-sm appearance-none focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-[3px] focus:ring-[var(--color-sage-20)]"
					required
				>
					<option value="" disabled>-- Pilih Cabang --</option>
					{#each data.branches as branch}
						<option value={branch.id}>{branch.name}</option>
					{/each}
				</select>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-stone)]">
					<Store size={18} />
				</div>
			</div>
		</div>

	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showModal = false}>Batal</Button>
		<Button form="invite-form" type="submit" disabled={loading}>
			{loading ? 'Mengirim...' : 'Kirim Undangan'}
		</Button>
	{/snippet}
</Modal>
