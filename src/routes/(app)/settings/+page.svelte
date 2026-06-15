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

<div class="mx-auto max-w-3xl space-y-6 pb-12">
	<!-- Header -->
	<div class="flex items-start gap-3 sm:items-center sm:gap-4">
		<div class="shrink-0 rounded-xl bg-[var(--color-sand)] p-2.5 text-[var(--color-earth)]">
			<Settings class="h-6 w-6 sm:h-7 sm:w-7" />
		</div>
		<div>
			<h1 class="font-heading text-2xl font-bold text-[var(--color-earth)] sm:text-3xl">
				Pengaturan Aplikasi
			</h1>
			<p class="mt-1 text-xs text-[var(--color-stone)] sm:text-sm">
				Kelola konfigurasi global untuk transaksi dan operasional toko.
			</p>
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
			<div class="mb-6 flex items-center gap-2 border-b border-[var(--color-border)] pb-4">
				<Clock class="text-[var(--color-forest)]" size={24} />
				<h2 class="font-heading text-xl font-bold text-[var(--color-earth)]">Aturan Penyewaan</h2>
			</div>

			<div class="space-y-6">
				<!-- Durasi Siklus Sewa -->
				<div
					class="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-sand-lightest)] p-4"
				>
					<div class="mb-4">
						<h3 class="mb-1 text-lg font-semibold text-[var(--color-earth)]">
							Siklus Durasi Sewa Tetap
						</h3>
						<p class="text-sm text-[var(--color-stone)]">
							Setiap transaksi sewa akan dihitung berdasarkan siklus ini. Harga sewa yang diatur di
							inventaris berlaku untuk 1 siklus ini.
						</p>
					</div>
					<div class="w-full sm:max-w-xs">
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
				<div
					class="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4"
				>
					<div class="mb-4">
						<h3
							class="mb-1 flex items-center gap-2 text-lg font-semibold text-[var(--color-error)]"
						>
							<AlertCircle size={18} /> Denda Keterlambatan (Per Transaksi)
						</h3>
						<p class="text-sm text-[var(--color-error)]/80">
							Nominal denda tetap per hari yang akan ditambahkan secara otomatis jika penyewa
							mengembalikan barang melewati batas tanggal selesai.
						</p>
					</div>
					<div class="w-full sm:max-w-xs">
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

				<!-- Target Pendapatan Bulanan -->
				<div
					class="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-sand-lightest)] p-4"
				>
					<div class="mb-4">
						<h3
							class="mb-1 flex items-center gap-2 text-lg font-semibold text-[var(--color-earth)]"
						>
							📈 Target Pendapatan Bulanan
						</h3>
						<p class="text-sm text-[var(--color-stone)]">
							Target omzet bulanan cabang/toko yang akan ditampilkan sebagai progress bar di
							dashboard utama Owner.
						</p>
					</div>
					<div class="w-full sm:max-w-xs">
						<Input
							type="number"
							id="monthly_revenue_target"
							name="monthly_revenue_target"
							label="Target Pendapatan (Rp) / Bulan"
							value={rentalSettings.monthly_revenue_target || 20000000}
							min="0"
							required
						/>
					</div>
				</div>
			</div>

			<div class="mt-8 flex justify-end border-t border-[var(--color-border)] pt-4">
				<Button
					type="submit"
					disabled={loading}
					class="w-full justify-center sm:w-auto sm:min-w-[180px]"
				>
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
