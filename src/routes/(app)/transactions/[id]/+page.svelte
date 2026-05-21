<script>
	import { ArrowLeft, Printer, CheckCircle, Store, User, Clock, FileText } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	let { transaction } = data;

	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
	}

	function formatDate(dateStr) {
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
		}).format(new Date(dateStr));
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="space-y-6 max-w-4xl mx-auto pb-12">
	<!-- Action Bar (Hidden on Print) -->
	<div class="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<!-- eslint-disable-next-line -->
		<a href="/transactions" class="inline-flex items-center gap-2 text-[var(--color-stone)] hover:text-[var(--color-earth)] font-medium transition-colors">
			<ArrowLeft size={18} /> Kembali ke Riwayat
		</a>
		<Button onclick={handlePrint} variant="outline" class="border-[var(--color-forest)] text-[var(--color-forest)] hover:bg-[var(--color-forest)]/10">
			<Printer size={18} class="mr-2" /> Cetak Struk
		</Button>
	</div>

	<!-- Kertas Struk / Invoice -->
	<Card padding="none" class="bg-white overflow-hidden print:shadow-none print:border-none">
		
		<!-- Header Invoice -->
		<div class="bg-[var(--color-sand-lightest)] p-6 sm:p-8 border-b border-[var(--color-border)]">
			<div class="flex flex-col md:flex-row justify-between items-start gap-6">
				<div>
					<h1 class="text-3xl font-bold font-heading text-[var(--color-forest)]">BotaniRent</h1>
					<p class="text-[var(--color-stone)] text-sm mt-1 max-w-xs">Penyewaan Alat Camping & Outdoor Terpercaya</p>
					
					<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
						<div class="flex items-center gap-1.5 text-sm text-[var(--color-earth)]">
							<FileText size={16} class="text-[var(--color-stone)]" />
							<span class="font-mono font-bold">{transaction.transaction_code}</span>
						</div>
						<div class="flex items-center gap-1.5 text-sm text-[var(--color-earth)]">
							<Clock size={16} class="text-[var(--color-stone)]" />
							<span>{formatDate(transaction.created_at)}</span>
						</div>
					</div>
				</div>
				
				<div class="bg-white px-4 py-3 rounded-xl border border-[var(--color-border-light)] text-right">
					<p class="text-xs text-[var(--color-stone)] uppercase tracking-wider font-semibold mb-1">Status Pembayaran</p>
					{#if transaction.payment_status === 'paid'}
						<div class="flex items-center justify-end gap-1.5 text-[var(--color-success)] font-bold text-lg">
							<CheckCircle size={20} /> LUNAS
						</div>
					{:else}
						<div class="font-bold text-lg text-[var(--color-warning)] uppercase">{transaction.payment_status}</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Info Pelanggan & Kasir -->
		<div class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[var(--color-border)]">
			<div>
				<h3 class="text-xs text-[var(--color-stone)] uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
					<User size={14} /> Data Pelanggan
				</h3>
				{#if transaction.customer}
					<p class="font-bold text-[var(--color-earth)] text-lg">{transaction.customer.full_name}</p>
					<p class="text-[var(--color-stone)]">{transaction.customer.phone || '-'}</p>
				{:else}
					<p class="text-[var(--color-stone)] italic">Pelanggan Umum (Tidak terdaftar)</p>
				{/if}
			</div>
			<div>
				<h3 class="text-xs text-[var(--color-stone)] uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
					<Store size={14} /> Detail Layanan
				</h3>
				<div class="grid grid-cols-2 gap-y-2 text-sm">
					<div class="text-[var(--color-stone)]">Kasir</div>
					<div class="font-medium text-[var(--color-earth)] text-right">{transaction.cashier?.full_name || '-'}</div>
					
					<div class="text-[var(--color-stone)]">Tipe Transaksi</div>
					<div class="font-medium text-[var(--color-earth)] text-right capitalize">
						{transaction.type === 'rental' ? 'Sewa Alat' : transaction.type === 'retail' ? 'Penjualan' : 'Hybrid (Sewa+Jual)'}
					</div>
					
					<div class="text-[var(--color-stone)]">Metode Bayar</div>
					<div class="font-medium text-[var(--color-earth)] text-right capitalize">{transaction.payment_method}</div>
				</div>
			</div>
		</div>

		<!-- Tabel Item -->
		<div class="p-6 sm:p-8">
			<h3 class="font-bold text-[var(--color-earth)] mb-4">Rincian Barang</h3>
			
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm mb-6">
					<thead class="text-[var(--color-stone)] border-b-2 border-[var(--color-border)]">
						<tr>
							<th class="py-3 font-semibold w-full">Deskripsi Barang</th>
							<th class="py-3 px-4 font-semibold text-center whitespace-nowrap">Qty</th>
							<th class="py-3 px-4 font-semibold text-right whitespace-nowrap">Harga/Hari</th>
							<th class="py-3 px-4 font-semibold text-center whitespace-nowrap">Hari</th>
							<th class="py-3 font-semibold text-right whitespace-nowrap">Subtotal</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-border-light)]">
						{#each transaction.items as item}
							<!-- Tampilkan komponen paket tanpa subtotal (harga sudah include di header paket) jika harganya 0 -->
							<tr class="{item.unit_price === 0 && item.type === 'package' ? 'text-[var(--color-stone)] text-xs italic bg-[var(--color-sand-lightest)]/30' : 'text-[var(--color-earth)]'}">
								<td class="py-4 pr-4">
									<div class="font-medium">{item.item_name}</div>
									{#if item.type === 'rental'}
										<div class="text-[10px] text-[var(--color-info)] mt-0.5">Masa Sewa: {item.rental_start_date} s/d {item.rental_end_date}</div>
									{:else if item.type === 'package' && item.unit_price > 0}
										<div class="text-[10px] text-[var(--color-success)] mt-0.5">Masa Sewa: {item.rental_start_date} s/d {item.rental_end_date}</div>
									{/if}
								</td>
								<td class="py-4 px-4 text-center">{item.quantity}</td>
								<td class="py-4 px-4 text-right">{item.unit_price > 0 ? formatCurrency(item.unit_price) : '-'}</td>
								<td class="py-4 px-4 text-center">{item.rental_days || '-'}</td>
								<td class="py-4 font-bold text-right">{item.subtotal > 0 ? formatCurrency(item.subtotal) : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Ringkasan Harga -->
			<div class="w-full md:w-1/2 ml-auto space-y-3 text-sm">
				<div class="flex justify-between text-[var(--color-stone)]">
					<span>Subtotal</span>
					<span class="font-medium">{formatCurrency(transaction.subtotal)}</span>
				</div>
				{#if transaction.discount_amount > 0}
					<div class="flex justify-between text-[var(--color-success)]">
						<span>Diskon</span>
						<span class="font-medium">-{formatCurrency(transaction.discount_amount)}</span>
					</div>
				{/if}
				<div class="flex justify-between items-center text-lg pt-3 border-t-2 border-[var(--color-border)]">
					<span class="font-bold text-[var(--color-earth)]">Total Tagihan</span>
					<span class="font-bold text-[var(--color-forest)]">{formatCurrency(transaction.total_amount)}</span>
				</div>
				<div class="flex justify-between text-[var(--color-stone)] pt-3">
					<span>Dibayar ({transaction.payment_method})</span>
					<span class="font-medium">{formatCurrency(transaction.paid_amount)}</span>
				</div>
				{#if transaction.change_amount > 0}
					<div class="flex justify-between text-[var(--color-stone)]">
						<span>Kembalian</span>
						<span class="font-medium">{formatCurrency(transaction.change_amount)}</span>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Footer -->
		<div class="bg-[var(--color-sand-lightest)]/50 p-6 text-center border-t border-[var(--color-border-light)] print:mt-12">
			<p class="text-sm font-medium text-[var(--color-earth)]">Terima kasih telah mempercayakan petualangan Anda pada kami!</p>
			<p class="text-xs text-[var(--color-stone)] mt-1">Simpan struk ini sebagai bukti transaksi yang sah. Barang sewa yang rusak/hilang menjadi tanggung jawab penyewa sesuai dengan S&K yang berlaku.</p>
		</div>

	</Card>
</div>

<!-- Print Styles -->
<style>
	@media print {
		:global(body) {
			background-color: white !important;
		}
		:global(nav), :global(aside) {
			display: none !important;
		}
		:global(main) {
			padding: 0 !important;
			margin: 0 !important;
		}
	}
</style>
