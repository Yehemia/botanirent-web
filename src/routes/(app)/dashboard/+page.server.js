import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { supabase } = locals;
	const { session, profile } = await locals.safeGetSession();

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	const isOwner = profile.role === 'owner';
	const branchId = profile.branch_id;
	const todayStr = new Date().toISOString().split('T')[0];

	// 1. Kumpulkan Status Aset Fisik
	let assetsQuery = supabase.from('rental_assets').select('status, item:items!inner(branch_id)');
	if (branchId) {
		assetsQuery = assetsQuery.eq('items.branch_id', branchId);
	}
	const { data: assets } = await assetsQuery;
	
	/** @type {{ ready: number; rented: number; maintenance: number; washing: number; }} */
	const assetStats = { ready: 0, rented: 0, maintenance: 0, washing: 0 };
	if (assets) {
		assets.forEach(a => {
			const status = /** @type {keyof typeof assetStats} */ (a.status);
			if (assetStats[status] !== undefined) assetStats[status]++;
		});
	}

	// 2. Ambil 5 Transaksi Terkini
	let trxQuery = supabase
		.from('transactions')
		.select('*, customer:customers(full_name), cashier:profiles(full_name)')
		.order('created_at', { ascending: false })
		.limit(5);
	
	if (branchId) {
		trxQuery = trxQuery.eq('branch_id', branchId);
	}
	const { data: recentTransactions } = await trxQuery;

	// 3. Data Khusus Owner
	let ownerData = null;
	if (isOwner) {
		// Dapatkan tanggal 7 hari lalu untuk grafik
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
		sevenDaysAgo.setHours(0,0,0,0);

		// Dapatkan tanggal 1 awal bulan untuk KPI Bulanan
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0,0,0,0);

		const queryDate = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;

		let trxsQuery = supabase
			.from('transactions')
			.select('created_at, total_amount, payment_status')
			.gte('created_at', queryDate.toISOString());
		if (branchId) {
			trxsQuery = trxsQuery.eq('branch_id', branchId);
		}

		let penaltiesQuery = supabase
			.from('penalties')
			.select('created_at, calculated_amount, payment_status')
			.eq('payment_status', 'paid')
			.gte('created_at', queryDate.toISOString());
		if (branchId) {
			penaltiesQuery = penaltiesQuery.eq('branch_id', branchId);
		}

		let staffQuery = supabase
			.from('profiles')
			.select('*', { count: 'exact', head: true });
		if (branchId) {
			staffQuery = staffQuery.eq('branch_id', branchId);
		}

		let customerQuery = supabase
			.from('customers')
			.select('*', { count: 'exact', head: true });
		if (branchId) {
			customerQuery = customerQuery.eq('branch_id', branchId);
		}

		let logsQuery = supabase
			.from('activity_logs')
			.select('*, profile:profiles(full_name, role), branch:branches(name)')
			.order('created_at', { ascending: false })
			.limit(5);
		if (branchId) {
			logsQuery = logsQuery.eq('branch_id', branchId);
		}

		// Jalankan query paralel untuk optimasi
		const [
			allTrxRes,
			allPenaltiesRes,
			staffCountRes,
			branchCountRes,
			customerCountRes,
			recentLogsRes,
			settingsRes
		] = await Promise.all([
			trxsQuery,
			penaltiesQuery,
			staffQuery,
			supabase
				.from('branches')
				.select('*', { count: 'exact', head: true }),
			customerQuery,
			logsQuery,
			supabase
				.from('settings')
				.select('*')
				.eq('key', 'rental')
				.single()
		]);

		const allTrx = allTrxRes.data;
		const allPenalties = allPenaltiesRes.data;
		const settingsData = settingsRes.data;
		
		const rentalSettings = settingsData?.value || { 
			default_rental_duration_days: 4, 
			late_fee_per_day_per_transaction: 10000,
			monthly_revenue_target: 20000000 
		};
		const monthlyRevenueTarget = Number(rentalSettings.monthly_revenue_target) || 20000000;
		
		let totalTxRevenueMonth = 0;
		let totalPenaltyRevenueMonth = 0;
		let successfulTrxCountMonth = 0;

		// Siapkan array 7 hari untuk chart
		/** @type {Array<{date: string, label: string, revenue: number, penalty: number}>} */
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			last7Days.push({
				date: d.toISOString().split('T')[0],
				label: new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d),
				revenue: 0,
				penalty: 0
			});
		}

		if (allTrx) {
			allTrx.forEach(t => {
				if (t.payment_status === 'paid') {
					const trxDateObj = new Date(t.created_at);
					
					if (trxDateObj >= startOfMonth) {
						totalTxRevenueMonth += Number(t.total_amount) || 0;
						successfulTrxCountMonth++;
					}

					const tDateStr = new Date(trxDateObj.getTime() - (trxDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
					const chartItem = last7Days.find(d => d.date === tDateStr);
					if (chartItem) {
						chartItem.revenue += Number(t.total_amount) || 0;
					}
				}
			});
		}

		if (allPenalties) {
			allPenalties.forEach(p => {
				const penaltyDateObj = new Date(p.created_at);
				const amount = Number(p.calculated_amount) || 0;

				if (penaltyDateObj >= startOfMonth) {
					totalPenaltyRevenueMonth += amount;
				}

				const pDateStr = new Date(penaltyDateObj.getTime() - (penaltyDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
				const chartItem = last7Days.find(d => d.date === pDateStr);
				if (chartItem) {
					chartItem.penalty += amount;
				}
			});
		}

		ownerData = {
			revenueData: {
				totalRevenueMonth: totalTxRevenueMonth + totalPenaltyRevenueMonth,
				totalTxRevenueMonth,
				totalPenaltyRevenueMonth,
				successfulTrxCountMonth,
				monthlyRevenueTarget
			},
			chartData: {
				labels: last7Days.map(d => d.label),
				revenueData: last7Days.map(d => d.revenue),
				penaltyData: last7Days.map(d => d.penalty)
			},
			staffCount: staffCountRes.count || 0,
			branchCount: branchCountRes.count || 0,
			customerCount: customerCountRes.count || 0,
			recentLogs: recentLogsRes.data || []
		};
	}

	// 4. Data Khusus Kasir
	let kasirData = null;
	if (profile.role === 'kasir') {
		// Fetch denda & transaksi hari ini untuk cabang kasir
		const startOfToday = new Date();
		startOfToday.setHours(0,0,0,0);

		const [
			todayTrxRes,
			activeRentalsRes,
			todaysPickupsRes,
			todaysReturnsDueRes
		] = await Promise.all([
			supabase
				.from('transactions')
				.select('total_amount')
				.eq('branch_id', branchId)
				.eq('payment_status', 'paid')
				.gte('created_at', startOfToday.toISOString()),
			supabase
				.from('transaction_items')
				.select('id, transaction:transactions!inner(branch_id)', { count: 'exact', head: true })
				.eq('rental_status', 'active')
				.eq('transactions.branch_id', branchId),
			supabase
				.from('transaction_items')
				.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
				.eq('rental_status', 'active')
				.eq('rental_start_date', todayStr)
				.eq('transactions.branch_id', branchId),
			supabase
				.from('transaction_items')
				.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
				.eq('rental_status', 'active')
				.lte('rental_end_date', todayStr)
				.eq('transactions.branch_id', branchId)
		]);

		const todayTrx = todayTrxRes.data || [];
		const todayRevenue = todayTrx.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

		kasirData = {
			todayRevenue,
			todayTrxCount: todayTrx.length,
			activeRentalsCount: activeRentalsRes.count || 0,
			todaysPickups: todaysPickupsRes.data || [],
			todaysReturnsDue: todaysReturnsDueRes.data || []
		};
	}

	// 5. Data Khusus Gudang
	let gudangData = null;
	if (profile.role === 'gudang') {
		const [
			washingAssetsRes,
			maintenanceAssetsRes,
			todaysShipmentsRes
		] = await Promise.all([
			supabase
				.from('rental_assets')
				.select('*, item:items!inner(name, branch_id)')
				.eq('status', 'washing')
				.eq('items.branch_id', branchId),
			supabase
				.from('rental_assets')
				.select('*, item:items!inner(name, branch_id)')
				.eq('status', 'maintenance')
				.eq('items.branch_id', branchId),
			supabase
				.from('transaction_items')
				.select('*, transaction:transactions!inner(customer:customers(full_name, phone), branch_id)')
				.eq('rental_status', 'active')
				.eq('rental_start_date', todayStr)
				.eq('transactions.branch_id', branchId)
		]);

		gudangData = {
			washingAssets: washingAssetsRes.data || [],
			maintenanceAssets: maintenanceAssetsRes.data || [],
			todaysShipments: todaysShipmentsRes.data || []
		};
	}

	return {
		role: profile.role,
		profile,
		assetStats,
		recentTransactions: recentTransactions || [],
		ownerData,
		kasirData,
		gudangData
	};
}
