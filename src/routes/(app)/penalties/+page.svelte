<script>
	import { enhance } from '$app/forms';
	import { Settings, Save, AlertCircle, CheckCircle, Scale, ShieldAlert, HeartCrack, HelpCircle } from '@lucide/svelte';
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

<div class="space-y-6 max-w-5xl mx-auto pb-12">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold font-heading text-[var(--color-earth)] flex items-center gap-2">
			<Settings size={28} /> Pengaturan Denda Dinamis
		</h1>
		<p class="text-[var(--color-stone)] mt-1">Kelola aturan denda untuk keterlambatan, kerusakan, dan barang hilang secara global.</p>
	</div>

	{#if form?.error}
		<div class="bg-[var(--color-error)]/10 text-[var(--color-error)] p-4 rounded-xl border border-[var(--color-error)]/20 font-medium flex items-center gap-2">
			<AlertCircle size={20} /> 
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="bg-[var(--color-success)]/10 text-[var(--color-success)] p-4 rounded-xl border border-[var(--color-success)]/20 font-medium flex items-center gap-2">
			<CheckCircle size={20} /> 
			Berhasil memperbarui aturan denda!
		</div>
	{/if}

	<!-- Rules Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		{#each penaltyRules as rule (rule.id)}
			{@const Icon = getIcon(rule.type)}
			<Card padding="lg" class="flex flex-col justify-between border-[1.5px] border-[var(--color-border)]">
				<div class="space-y-4">
					<!-- Icon & Title -->
					<div class="flex justify-between items-start">
						<div class="flex items-center gap-3">
							<div class="p-2.5 rounded-xl bg-[var(--color-sand)] text-[var(--color-earth)]">
								<Icon size={22} />
							</div>
							<div>
								<h3 class="font-bold text-lg text-[var(--color-earth)] font-heading">{rule.name}</h3>
								<span class="inline-block text-xs px-2 py-0.5 mt-1 border rounded-md capitalize {getBadgeBg(rule.type)}">
									Tipe: {rule.type.replace('_', ' ')}
								</span>
							</div>
						</div>
					</div>

					<!-- Method & Description -->
					<div class="text-sm space-y-1 text-[var(--color-stone)]">
						<p>
							<span class="font-medium text-[var(--color-earth)]">Metode Hitung:</span> 
							{#if rule.calculation_method === 'per_day'}
								Per Hari
							{:else}
								{rule.calculation_method.toUpperCase()}
							{/if}
						</p>
						<p class="text-xs italic bg-[var(--color-sand-lightest)] p-2.5 rounded-lg border border-[var(--color-border-light)] mt-2">
							{#if rule.type === 'late'}
								Denda dikenakan setiap hari keterlambatan penyelesaian penyewaan.
							{:else if rule.type === 'minor_damage'}
								Denda flat jika barang dikembalikan dalam kondisi rusak ringan (misal: tali tenda putus).
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
					class="mt-6 pt-4 border-t border-[var(--color-border-light)] flex items-end gap-3"
				>
					<input type="hidden" name="id" value={rule.id} />
					
					<div class="flex-1">
						<Input 
							id="amount-{rule.id}"
							name="amount"
							type="number"
							label="Jumlah / Nilai Aturan"
							value={rule.amount}
							required
							min="0"
							placeholder="misal: 10000"
						>
							{#snippet iconLeft()}
								<span class="text-xs text-[var(--color-muted)] font-bold">
									{rule.calculation_method === 'percentage' ? '%' : 'Rp'}
								</span>
							{/snippet}
						</Input>
					</div>

					<Button 
						type="submit" 
						variant="primary" 
						disabled={loading === rule.id}
						class="shrink-0 mb-[1.5px]"
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
