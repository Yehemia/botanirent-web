<script>
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Settings, Save, Clock, AlertCircle } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { data, form } = $props();
	
	let rentalSettings = $derived(data.rentalSettings);
	let loading = $state(false);

</script>

<div class="space-y-6 max-w-3xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<div class="p-3 bg-[var(--color-sand)] text-[var(--color-earth)] rounded-xl">
			<Settings size={28} />
		</div>
		<div>
			<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)]">Pengaturan Aplikasi</h1>
			<p class="text-[var(--color-stone)] mt-1">Kelola konfigurasi global untuk transaksi dan operasional toko.</p>
		</div>
	</div>

	<!-- Form Pengaturan -->
	<form 
		method="POST" 
		action="?/updateRental"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				loading = false;
				if (result.type === 'success' || result.type === 'redirect') {
					toast.success('Pengaturan penyewaan berhasil diperbarui!');
				} else if (result.type === 'error' || result.type === 'failure') {
					toast.error('Gagal memperbarui pengaturan.');
				}
			};
		}}
	>
		<Card padding="lg">
			<div class="flex items-center gap-2 mb-6 border-b border-[var(--color-border)] pb-4">
				<Clock class="text-[var(--color-forest)]" size={24} />
				<h2 class="text-xl font-bold font-heading text-[var(--color-earth)]">Aturan Penyewaan</h2>
			</div>

			<div class="space-y-6">
				<!-- Durasi Siklus Sewa -->
				<div class="bg-[var(--color-sand-lightest)] p-4 rounded-xl border border-[var(--color-border-light)]">
					<div class="mb-4">
						<h3 class="font-semibold text-[var(--color-earth)] text-lg mb-1">Siklus Durasi Sewa Tetap</h3>
						<p class="text-sm text-[var(--color-stone)]">
							Setiap transaksi sewa akan dihitung berdasarkan siklus ini. Harga sewa yang diatur di inventaris berlaku untuk 1 siklus ini.
						</p>
					</div>
					<div class="max-w-xs">
						<Input 
							type="number"
							id="default_rental_duration_days"
							name="default_rental_duration_days"
							label="Jumlah Hari per Siklus"
							value={rentalSettings.default_rental_duration_days}
							min="1"
							required
						/>
					</div>
				</div>

				<!-- Denda Keterlambatan -->
				<div class="bg-[var(--color-error-bg)] p-4 rounded-xl border border-[var(--color-error)]/20">
					<div class="mb-4">
						<h3 class="font-semibold text-[var(--color-error)] text-lg mb-1 flex items-center gap-2">
							<AlertCircle size={18} /> Denda Keterlambatan (Per Transaksi)
						</h3>
						<p class="text-sm text-[var(--color-error)]/80">
							Nominal denda tetap per hari yang akan ditambahkan secara otomatis jika penyewa mengembalikan barang melewati batas tanggal selesai.
						</p>
					</div>
					<div class="max-w-xs">
						<Input 
							type="number"
							id="late_fee_per_day_per_transaction"
							name="late_fee_per_day_per_transaction"
							label="Nominal Denda (Rp) / Hari"
							value={rentalSettings.late_fee_per_day_per_transaction}
							min="0"
							required
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-end mt-8 pt-4 border-t border-[var(--color-border)]">
				<Button type="submit" disabled={loading} class="min-w-[180px]">
					{#if loading}
						Menyimpan...
					{:else}
						<Save size={18} class="mr-2" /> Simpan Pengaturan
					{/if}
				</Button>
			</div>
		</Card>
	</form>
</div>
