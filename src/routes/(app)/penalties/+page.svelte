<script>
	import { enhance } from '$app/forms';
	import {
		Settings,
		Save,
		AlertCircle,
		CheckCircle,
		Scale,
		ShieldAlert,
		HeartCrack,
		HelpCircle
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { formatCurrency } from '$lib/utils/format';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	let penaltyRules = $derived(data.penaltyRules);

	let loading = $state('');

	/**
	 * @param {string} type
	 */
	function getIcon(type) {
		switch (type) {
			case 'late':
				return Scale;
			case 'minor_damage':
				return HelpCircle;
			case 'major_damage':
				return HeartCrack;
			case 'lost':
				return ShieldAlert;
			default:
				return Settings;
		}
	}

	/**
	 * @param {string} type
	 */
	function getBadgeBg(type) {
		switch (type) {
			case 'late':
				return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/20';
			case 'minor_damage':
				return 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/20';
			case 'major_damage':
				return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/20';
			case 'lost':
				return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]/20';
			default:
				return 'bg-[var(--color-sand)] text-[var(--color-earth)] border-[var(--color-border)]';
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 pb-12">
	<!-- Header -->
	<div>
		<h1 class="flex items-center gap-2 font-heading text-3xl font-bold text-[var(--color-earth)]">
			<Settings size={28} /> Pengaturan Denda Dinamis
		</h1>
		<p class="mt-1 text-[var(--color-stone)]">
			Kelola aturan denda untuk keterlambatan, kerusakan, dan barang hilang secara global.
		</p>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 p-4 font-medium text-[var(--color-error)]"
		>
			<AlertCircle size={20} />
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div
			class="flex items-center gap-2 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 p-4 font-medium text-[var(--color-success)]"
		>
			<CheckCircle size={20} />
			Berhasil memperbarui aturan denda!
		</div>
	{/if}

	<!-- Rules Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#each penaltyRules as rule (rule.id)}
			{@const Icon = getIcon(rule.type)}
			<Card
				padding="lg"
				class="flex flex-col justify-between border-[1.5px] border-[var(--color-border)]"
			>
				<div class="space-y-4">
					<!-- Icon & Title -->
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="rounded-xl bg-[var(--color-sand)] p-2.5 text-[var(--color-earth)]">
								<Icon size={22} />
							</div>
							<div>
								<h3 class="font-heading text-lg font-bold text-[var(--color-earth)]">
									{rule.name}
								</h3>
								<span
									class="mt-1 inline-block rounded-md border px-2 py-0.5 text-xs capitalize {getBadgeBg(
										rule.type
									)}"
								>
									Tipe: {rule.type.replace('_', ' ')}
								</span>
							</div>
						</div>
					</div>

					<!-- Method & Description -->
					<div class="space-y-1 text-sm text-[var(--color-stone)]">
						<p>
							<span class="font-medium text-[var(--color-earth)]">Metode Hitung:</span>
							{#if rule.calculation_method === 'per_day'}
								Per Hari
							{:else}
								{rule.calculation_method.toUpperCase()}
							{/if}
						</p>
						<p
							class="mt-2 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-sand-lightest)] p-2.5 text-xs italic"
						>
							{#if rule.type === 'late'}
								Denda dikenakan setiap hari keterlambatan penyelesaian penyewaan.
							{:else if rule.type === 'minor_damage'}
								Denda flat jika barang dikembalikan dalam kondisi rusak ringan (misal: tali tenda
								putus).
							{:else if rule.type === 'major_damage'}
								Denda berbasis persentase dari harga sewa/jual jika rusak berat.
							{:else if rule.type === 'lost'}
								Denda jika barang hilang. Secara default membebankan harga jual retail barang.
							{/if}
						</p>
					</div>
				</div>

				<!-- Edit Amount Form -->
				<form
					method="POST"
					action="?/updateRule"
					use:enhance={() => {
						loading = rule.id;
						return async ({ update }) => {
							await update();
							loading = '';
						};
					}}
					class="mt-6 flex items-end gap-3 border-t border-[var(--color-border-light)] pt-4"
				>
					<input type="hidden" name="id" value={rule.id} />

					<div class="flex-1">
						<Input
							id="amount-{rule.id}"
							name="amount"
							label="Jumlah / Nilai Aturan"
							value={rule.amount}
							required
							placeholder="misal: 10000"
							isCurrency={rule.calculation_method !== 'percentage'}
						>
							{#snippet iconLeft()}
								<span class="text-xs font-bold text-[var(--color-muted)]">
									{rule.calculation_method === 'percentage' ? '%' : 'Rp'}
								</span>
							{/snippet}
						</Input>
					</div>

					<Button
						type="submit"
						variant="primary"
						disabled={loading === rule.id}
						class="mb-[1.5px] shrink-0"
					>
						{#if loading === rule.id}
							...
						{:else}
							<Save size={16} class="mr-1" /> Simpan
						{/if}
					</Button>
				</form>
			</Card>
		{/each}
	</div>
</div>
