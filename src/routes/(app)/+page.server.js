import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/auth/login');
	}

	const isOwner = profile.role === 'owner';
	const branchId = profile.branch_id;

	// 1. Kumpulkan Status Aset Fisik
	let assetsQuery = supabase.from('rental_assets').select('status, item:items!inner(branch_id)');
	if (!isOwner) {
		assetsQuery = assetsQuery.eq('items.branch_id', branchId);
	}
	const { data: assets } = await assetsQuery;
	
	const assetStats = { ready: 0, rented: 0, maintenance: 0, washing: 0 };
	if (assets) {
		assets.forEach(a => {
			if (assetStats[a.status] !== undefined) assetStats[a.status]++;
		});
	}

	// 2. Ambil 5 Transaksi Terkini
	let trxQuery = supabase
		.from('transactions')
		.select('*, customer:customers(full_name), cashier:profiles(full_name)')
		.order('created_at', { ascending: false })
		.limit(5);
	
	if (!isOwner) {
		trxQuery = trxQuery.eq('branch_id', branchId);
	}
	const { data: recentTransactions } = await trxQuery;

	// 3. Khusus Owner: Ambil data Pendapatan (Revenue) untuk metrik dan grafik
	let revenueData = null;
	let chartData = null;

	if (isOwner) {
		// Dapatkan tanggal 7 hari lalu untuk grafik
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 hari (termasuk hari ini)
		sevenDaysAgo.setHours(0,0,0,0);

		// Dapatkan tanggal 1 awal bulan untuk KPI Bulanan
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0,0,0,0);

		// Kita query semua transaksi sejak awal bulan ATAU sejak 7 hari lalu (ambil yang paling tua)
		const queryDate = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;

		const { data: allTrx } = await supabase
			.from('transactions')
			.select('created_at, total_amount, payment_status')
			.gte('created_at', queryDate.toISOString());
		
		let totalRevenueMonth = 0;
		let successfulTrxCountMonth = 0;

		// Siapkan array 7 hari untuk chart
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			last7Days.push({
				date: d.toISOString().split('T')[0], // YYYY-MM-DD local timezone approximation
				label: new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d),
				revenue: 0
			});
		}

		if (allTrx) {
			allTrx.forEach(t => {
				if (t.payment_status === 'paid') {
					const trxDateObj = new Date(t.created_at);
					
					// Jika transaksi terjadi bulan ini
					if (trxDateObj >= startOfMonth) {
						totalRevenueMonth += t.total_amount;
						successfulTrxCountMonth++;
					}

					// Coba masukkan ke data Chart jika masuk dalam 7 hari terakhir
					const tDateStr = new Date(trxDateObj.getTime() - (trxDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
					const chartItem = last7Days.find(d => d.date === tDateStr);
					if (chartItem) {
						chartItem.revenue += t.total_amount;
					}
				}
			});
		}

		revenueData = {
			totalRevenueMonth,
			successfulTrxCountMonth
		};
		
		chartData = {
			labels: last7Days.map(d => d.label),
			data: last7Days.map(d => d.revenue)
		};
	}

	return {
		role: profile.role,
		assetStats,
		recentTransactions: recentTransactions || [],
		revenueData,
		chartData
	};
}
