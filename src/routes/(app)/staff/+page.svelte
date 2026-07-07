<script>
	import { enhance } from '$app/forms';
	import { UserPlus, Shield, Store, Mail, Power, CheckCircle2, Lock, User } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { data, form } = $props();

	let showModal = $state(false);
	let loading = $state(false);

	let formData = $state({
		email: '',
		full_name: '',
		role: 'kasir',
		branch_id: ''
	});

	function openAddModal() {
		formData = {
			email: '',
			full_name: '',
			role: 'kasir',
			branch_id: data.branches[0]?.id || ''
		};
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
		<h2 class="font-heading text-2xl font-bold text-[var(--color-earth)]">Manajemen Staff</h2>
		<p class="text-sm text-[var(--color-stone)]">
			Kelola akses Kasir dan Admin Gudang ke cabang-cabang Anda.
		</p>
	</div>

	<Button onclick={openAddModal}>
		{#snippet iconLeft()}<UserPlus size={18} />{/snippet}
		Tambah Staff
	</Button>
</div>

{#if form?.error}
	<div
		class="mb-6 rounded-md border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4 text-sm text-[var(--color-error)]"
	>
		{form.error}
	</div>
{/if}

{#if form?.success}
	<div
		class="mb-6 flex flex-col gap-2 rounded-md border border-[var(--color-success)]/20 bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success)]"
	>
		<div class="flex items-center gap-2 font-semibold">
			<CheckCircle2 size={18} /> 
			{#if form.isExisting}
				Detail & Peran Staff Berhasil Diperbarui!
			{:else}
				Staff baru berhasil diundang!
			{/if}
		</div>
		{#if form.inviteLink}
			<div class="mt-2 rounded bg-white p-3 border border-[var(--color-success)]/10 text-[var(--color-stone)]">
				<p class="text-xs font-semibold text-[var(--color-earth)] mb-1">
					{#if form.isExisting}
						Email ini sudah terdaftar sebelumnya. Peran/cabang berhasil diperbarui! Silakan kirimkan link reset password berikut agar mereka dapat mengatur kata sandi baru:
					{:else}
						Link Aktivasi (Salin dan kirimkan link ini ke staff agar mereka bisa membuat password):
					{/if}
				</p>
				<code class="break-all select-all block text-xs font-mono text-[var(--color-forest)] bg-[var(--color-sand-lightest)] px-2 py-1.5 rounded border border-[var(--color-border-light)]">{form.inviteLink}</code>
			</div>
		{/if}
	</div>
{/if}

<div
	class="overflow-hidden rounded-xl border border-[var(--color-border-light)] bg-white shadow-[var(--shadow-sm)]"
>
	<!-- Desktop View -->
	<div class="hidden overflow-x-auto sm:block">
		<table class="w-full border-collapse text-left">
			<thead>
				<tr
					class="border-b border-[var(--color-border-light)] bg-[var(--color-sand-lightest)] text-sm font-semibold text-[var(--color-stone)]"
				>
					<th class="px-6 py-4">Nama Lengkap</th>
					<th class="px-6 py-4">Role</th>
					<th class="px-6 py-4">Penempatan Cabang</th>
					<th class="px-6 py-4 text-center">Status</th>
					<th class="px-6 py-4 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.staff as staff}
					<tr
						class="border-b border-[var(--color-border-light)] transition-colors hover:bg-gray-50/50"
					>
						<td class="px-6 py-4">
							<div class="font-medium text-[var(--color-earth)]">
								{staff.full_name || 'Menunggu pendaftaran...'}
							</div>
						</td>
						<td class="px-6 py-4">
							<div class="flex items-center gap-2 text-sm text-[var(--color-stone)]">
								<Shield size={16} />
								<span class="capitalize">{staff.role}</span>
							</div>
						</td>
						<td class="px-6 py-4">
							{#if staff.branches}
								<div class="flex items-center gap-2 text-sm text-[var(--color-stone)]">
									<Store size={16} />
									<span>{staff.branches.name}</span>
								</div>
							{:else}
								<span class="text-sm text-gray-400">-</span>
							{/if}
						</td>
						<td class="px-6 py-4 text-center">
							<Badge variant={staff.is_active ? 'success' : 'neutral'}>
								{staff.is_active ? 'Aktif' : 'Nonaktif'}
							</Badge>
						</td>
						<td class="px-6 py-4 text-right">
							{#if staff.role !== 'owner'}
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={staff.id} />
									<input type="hidden" name="is_active" value={(!staff.is_active).toString()} />

									<Button
										variant="ghost"
										size="sm"
										type="submit"
										class={staff.is_active
											? 'text-[var(--color-error)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]'
											: 'text-[var(--color-success)] hover:bg-[var(--color-success-bg)] hover:text-[var(--color-success)]'}
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

	<!-- Mobile View -->
	<div class="block divide-y divide-[var(--color-border-light)] sm:hidden">
		{#each data.staff as staff}
			<div
				class="flex flex-col gap-3 p-4 transition-colors hover:bg-[var(--color-sand-lightest)]/30"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="truncate text-sm font-bold text-[var(--color-earth)]">
						{staff.full_name || 'Menunggu pendaftaran...'}
					</div>
					<Badge variant={staff.is_active ? 'success' : 'neutral'} class="shrink-0 text-[10px]">
						{staff.is_active ? 'Aktif' : 'Nonaktif'}
					</Badge>
				</div>

				<div class="flex flex-col gap-1.5 text-xs text-[var(--color-stone)]">
					<div class="flex items-center gap-2">
						<Shield size={14} class="shrink-0" />
						<span class="capitalize">{staff.role}</span>
					</div>
					{#if staff.branches}
						<div class="flex items-center gap-2">
							<Store size={14} class="shrink-0" />
							<span>{staff.branches.name}</span>
						</div>
					{/if}
				</div>

				{#if staff.role !== 'owner'}
					<div class="flex justify-end border-t border-gray-100 pt-1">
						<form method="POST" action="?/updateStatus" use:enhance class="w-full">
							<input type="hidden" name="id" value={staff.id} />
							<input type="hidden" name="is_active" value={(!staff.is_active).toString()} />

							<Button
								variant="ghost"
								size="sm"
								type="submit"
								class="w-full justify-center {staff.is_active
									? 'text-[var(--color-error)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]'
									: 'text-[var(--color-success)] hover:bg-[var(--color-success-bg)] hover:text-[var(--color-success)]'}"
							>
								{#snippet iconLeft()}<Power size={14} />{/snippet}
								{staff.is_active ? 'Nonaktifkan Staff' : 'Aktifkan Staff'}
							</Button>
						</form>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Modal Tambah Staff -->
<Modal bind:open={showModal} title="Tambah Staff Baru">
	<form
		id="add-staff-form"
		method="POST"
		action="?/invite"
		use:enhance={handleSubmit}
		class="space-y-4"
	>
		<p class="mb-4 text-sm text-[var(--color-stone)]">
			Undang staff baru melalui email. Supabase akan mengirimkan email berisi tautan/link bagi staff untuk membuat password dan mengaktifkan akun mereka.
		</p>

		<Input
			id="full_name"
			name="full_name"
			label="Nama Lengkap"
			placeholder="Contoh: Budi Santoso"
			bind:value={formData.full_name}
			required
		>
			{#snippet iconLeft()}<User size={18} />{/snippet}
		</Input>

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



		<Select id="role" name="role" label="Role / Jabatan" bind:value={formData.role} required>
			{#snippet iconLeft()}
				<Shield size={18} />
			{/snippet}
			<option value="kasir">Kasir (POS & Transaksi)</option>
			<option value="gudang">Admin Gudang (Inventaris & Aset)</option>
		</Select>

		<Select
			id="branch_id"
			name="branch_id"
			label="Penempatan Cabang"
			bind:value={formData.branch_id}
			required
		>
			{#snippet iconLeft()}
				<Store size={18} />
			{/snippet}
			<option value="" disabled>-- Pilih Cabang --</option>
			{#each data.branches as branch}
				<option value={branch.id}>{branch.name}</option>
			{/each}
		</Select>
	</form>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showModal = false)}>Batal</Button>
		<Button form="add-staff-form" type="submit" disabled={loading}>
			{loading ? 'Memproses...' : 'Buat Akun Staff'}
		</Button>
	{/snippet}
</Modal>
