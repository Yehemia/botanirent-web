/**
 * ============================================================
 * FILE: returnsController.js
 * TUJUAN: Logic bisnis untuk proses PENGEMBALIAN BARANG sewa.
 *
 * INI SALAH SATU CONTROLLER PALING KOMPLEKS karena:
 *   1. Menangani banyak kondisi barang (baik, rusak, hilang)
 *   2. Menghitung denda yang berlapis (keterlambatan + kerusakan per item)
 *   3. Mendukung banyak metode pembayaran denda (tunai, transfer, QRIS)
 *   4. Mengupdate status banyak tabel sekaligus
 *   5. Opsional mengintegrasikan dengan Midtrans untuk denda QRIS
 *
 * KONDISI BARANG YANG MUNGKIN:
 *   'good'         → Bagus → asset status: 'washing' (harus dicuci dulu)
 *   'minor_damage' → Rusak ringan → asset status: 'maintenance'
 *   'major_damage' → Rusak berat → asset status: 'maintenance'
 *   'lost'         → Hilang → asset status: 'maintenance' (dianggap tidak tersedia)
 *
 * JENIS DENDA:
 *   1. Denda keterlambatan → 1 denda per transaksi (bukan per item)
 *   2. Denda kerusakan/hilang → 1 denda per item yang rusak/hilang
 *
 * LOGIKA DENDA KETERLAMBATAN:
 *   Dihitung dari item dengan keterlambatan TERLAMA dalam satu transaksi.
 *   Contoh: Transaksi punya 3 item, terlambat 0/2/5 hari → denda untuk 5 hari.
 *   Ini lebih adil daripada denda per item (denda tidak berlipat untuk banyak item).
 * ============================================================
 */

import { transactionModel } from '../models/transactionModel.js';
import { penaltyModel } from '../models/penaltyModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { assetModel } from '../models/assetModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const returnsController = {
	/**
	 * Siapkan data untuk halaman Returns (pengembalian barang).
	 *
	 * DATA YANG DIMUAT:
	 *   - activeRentals  → semua item sewa yang belum dikembalikan
	 *   - penaltyRules   → aturan denda (untuk menghitung denda di UI)
	 *   - rentalSettings → pengaturan sewa (biaya keterlambatan per hari)
	 *
	 * PENGELOMPOKAN (GROUPING):
	 *   Data dari DB datang sebagai flat array (datar):
	 *   [item1-transaksi1, item2-transaksi1, item3-transaksi2, ...]
	 *
	 *   Kita perlu mengubahnya menjadi nested (bersarang):
	 *   [
	 *     { transaction_id: '1', items: [item1, item2] },
	 *     { transaction_id: '2', items: [item3] }
	 *   ]
	 *
	 *   Ini dilakukan dengan objek 'grouped' sebagai Map sederhana:
	 *   grouped['transaksi1'] = { ..., items: [] }
	 *   Setiap item di-push ke array items transaksinya.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getReturnsPageData(supabase, profile) {
		const activeRentals = await transactionModel.getActiveRentalsForReturns(
			supabase,
			profile.branch_id
		);

		// Kelompokkan item sewa berdasarkan transaksi
		/** @type {Record<string, any>} */
		const grouped = {}; // Key: transaction_id, Value: objek transaksi dengan items
		if (activeRentals) {
			activeRentals.forEach((item) => {
				const trxId = item.transaction_id;
				if (!grouped[trxId]) {
					// Buat entry baru untuk transaksi ini (jika belum ada)
					grouped[trxId] = {
						transaction_id: trxId,
						transaction_code: item.transaction.transaction_code,
						transaction_type: item.transaction.type,
						customer_name: item.transaction.customer?.full_name || 'Pelanggan Umum',
						customer_phone: item.transaction.customer?.phone || '-',
						items: [] // Awalnya kosong, akan diisi item-itemnya
					};
				}
				// Tambahkan item ini ke daftar items transaksi
				grouped[trxId].items.push(item);
			});
		}

		const penaltyRules = await penaltyModel.getPenaltyRules(supabase);
		const rentalSettings = await settingsModel.getRentalSettings(supabase);

		return {
			transactions: Object.values(grouped), // Konversi objek ke array
			penaltyRules,
			rentalSettings
		};
	},

	/**
	 * Proses pengembalian barang — inti dari seluruh fitur Returns.
	 *
	 * ALUR DETAIL:
	 * 1. Parse payload JSON dari form
	 * 2. Ambil pengaturan biaya keterlambatan dan aturan denda
	 * 3. Hitung denda keterlambatan (1 per transaksi, dari item paling terlambat)
	 *    a. Temukan jumlah hari terlambat maksimum
	 *    b. Hitung/simpan denda keterlambatan (bisa di-override manual oleh kasir)
	 * 4. Loop setiap item:
	 *    a. Update status transaction_item → 'returned' atau 'lost'
	 *    b. Update status booking → 'completed'
	 *    c. Jika kondisi bukan 'good' → hitung dan catat denda kerusakan/hilang
	 *       - Metode 'flat' = denda tetap (contoh: Rp 50.000)
	 *       - Metode 'percentage' = persentase dari harga jual (contoh: 75% × harga jual)
	 *    d. Update status asset fisik berdasarkan kondisi barang
	 *    e. Catat activity log per item
	 * 5. Jika denda > 0 dan metode QRIS → request QRIS ke Midtrans
	 * 6. Return hasil
	 *
	 * PAYLOAD FORMAT (dari form):
	 * {
	 *   items: [
	 *     { id: "uuid-ti", asset_id: "uuid-ra", condition: "good", late_days: 0, notes: "" },
	 *     { id: "uuid-ti", asset_id: "uuid-ra", condition: "minor_damage", late_days: 2, damage_penalty_amount: 50000 }
	 *   ],
	 *   payment_status: "paid" | "unpaid",
	 *   payment_method: "Tunai" | "Transfer" | "QRIS",
	 *   global_notes: "Catatan pengembalian",
	 *   total_late_penalty: 20000  // Optional override dari kasir
	 * }
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 * @param {object} [midtransConfig] - Config Midtrans untuk pembayaran QRIS
	 */
	async processReturn(supabase, profile, formData, midtransConfig) {
		try {
			console.log('[returnsController.processReturn] Starting processReturn with profile branch:', profile?.branch_id);

			// 1. Parse payload JSON
			const payloadStr = formData.get('payload');
			if (!payloadStr) {
				console.error('[returnsController.processReturn] Empty payload received');
				return { success: false, status: 400, error: 'Payload kosong' };
			}

			let parsed;
			try {
				parsed = JSON.parse(payloadStr.toString());
				console.log('[returnsController.processReturn] Parsed JSON payload:', parsed);
			} catch (e) {
				console.error('[returnsController.processReturn] Failed to parse return payload JSON:', e);
				return { success: false, status: 400, error: 'Format payload tidak valid.' };
			}

			let items = [];
			let paymentStatus = 'unpaid';
			let paymentMethod = 'Tunai';
			let globalNotes = '';
			let totalLatePenaltyOverridden = null; // Null = pakai kalkulasi otomatis

			// Support dua format payload: array langsung atau objek dengan property items
			if (Array.isArray(parsed)) {
				items = parsed; // Format lama: array langsung
			} else {
				items = parsed.items || [];
				paymentStatus = parsed.payment_status || 'unpaid';
				paymentMethod = parsed.payment_method || 'Tunai';
				globalNotes = parsed.global_notes || '';
				// Jika kasir override total denda keterlambatan secara manual
				totalLatePenaltyOverridden = parsed.total_late_penalty;
			}

			console.log('[returnsController.processReturn] Extracted parameters - items count:', items.length, 'paymentStatus:', paymentStatus, 'paymentMethod:', paymentMethod);

			// 2. Ambil pengaturan dan aturan denda
			const rentalSettings = await settingsModel.getRentalSettings(supabase);
			console.log('[returnsController.processReturn] Fetched rental settings:', rentalSettings);
			// Biaya keterlambatan per hari per transaksi (default: Rp 10.000)
			const lateRate =
				parseFloat(rentalSettings.late_fee_per_day_per_transaction?.toString() || '10000') || 10000;

			const penaltyRules = await penaltyModel.getPenaltyRules(supabase);
			console.log('[returnsController.processReturn] Fetched penalty rules count:', penaltyRules?.length);

			// 3. Hitung denda keterlambatan (1 per transaksi, dari item paling terlambat)
			let maxLateDays = 0; // Hari terlambat maksimum di antara semua item
			let latePenaltyItemId = null; // ID item pertama (untuk tabel referensi denda)

			for (const item of items) {
				// Item 'lost' tidak dihitung untuk keterlambatan (barang tidak ada = tidak kembali terlambat)
				if (item.condition !== 'lost' && item.late_days > maxLateDays) {
					maxLateDays = item.late_days;
				}
				// Simpan ID item pertama yang non-lost sebagai referensi di tabel penalties
				if (item.condition !== 'lost' && !latePenaltyItemId) {
					latePenaltyItemId = item.id;
				}
			}

			let totalPenalty = 0; // Akumulasi total denda (untuk Midtrans)

			// Insert denda keterlambatan jika ada
			if (maxLateDays > 0 && latePenaltyItemId) {
				// Gunakan override jika kasir mengubah manual, jika tidak hitung otomatis
				const calculatedLateAmount =
					totalLatePenaltyOverridden !== null && totalLatePenaltyOverridden !== undefined
						? parseFloat(totalLatePenaltyOverridden.toString())
						: maxLateDays * lateRate;

				const rule = penaltyRules?.find((r) => r.type === 'late');

				// Buat catatan denda keterlambatan
				let notesStr = `Keterlambatan transaksi selama ${maxLateDays} hari.`;
				if (calculatedLateAmount === 0) {
					notesStr += ` (Denda keterlambatan dibebaskan)`;
				} else if (totalLatePenaltyOverridden !== null && totalLatePenaltyOverridden !== undefined) {
					notesStr += ` (Denda disesuaikan manual dari ${maxLateDays * lateRate})`;
				}

				if (paymentStatus === 'paid' && paymentMethod !== 'QRIS') {
					notesStr += ` [Lunas via ${paymentMethod}]`;
				} else if (paymentStatus === 'paid' && paymentMethod === 'QRIS') {
					notesStr += ` [Menunggu Pembayaran QRIS]`;
				}

				if (globalNotes) {
					notesStr += ` Catatan: ${globalNotes}`;
				}

				try {
					console.log('[returnsController.processReturn] Inserting late penalty for transaction item ID:', latePenaltyItemId, 'amount:', calculatedLateAmount);
					await penaltyModel.insertPenalty(supabase, {
						transaction_item_id: latePenaltyItemId,
						penalty_rule_id: rule?.id,
						branch_id: profile.branch_id,
						type: 'late',
						late_days: maxLateDays,
						calculated_amount: calculatedLateAmount,
						// Status bayar:
						//   Denda 0 → langsung 'paid' (dibebaskan)
						//   QRIS   → 'unpaid' dulu (tunggu konfirmasi Midtrans)
						//   lainnya → sesuai pilihan kasir
						payment_status:
							calculatedLateAmount === 0
								? 'paid'
								: paymentMethod === 'QRIS'
									? 'unpaid'
									: paymentStatus,
						paid_at:
							calculatedLateAmount === 0 || (paymentStatus === 'paid' && paymentMethod !== 'QRIS')
								? new Date().toISOString()
								: null, // null jika belum bayar
						notes: notesStr
					});
					totalPenalty += calculatedLateAmount;
				} catch (err) {
					console.error('[returnsController.processReturn] Failed to insert late penalty in controller:', err);
					throw err; // Re-throw agar tertangkap catch terluar
				}
			}

			// 4. Loop dan proses setiap item yang dikembalikan
			for (const item of items) {
				console.log('[returnsController.processReturn] Processing item ID:', item.id);

				// Tentukan status akhir item
				let finalRentalStatus = 'returned'; // Default
				if (item.condition === 'lost') finalRentalStatus = 'lost'; // Barang hilang

				// Buat catatan kondisi pengembalian
				let returnNotes =
					item.condition === 'lost'
						? 'Barang dinyatakan hilang'
						: `Kondisi kembali: ${item.condition}`;
				if (item.notes) {
					returnNotes += ` (${item.notes})`;
				}

				try {
					console.log('[returnsController.processReturn] Updating transaction item status to:', finalRentalStatus, 'for item:', item.id);
					// a. Update status transaction_item → 'returned' atau 'lost'
					await transactionModel.updateTransactionItem(supabase, item.id, {
						rental_status: finalRentalStatus,
						returned_at: new Date().toISOString(), // Catat waktu pengembalian
						return_condition: item.condition,
						return_notes: returnNotes
					});

					// b. Update status booking di kalender → 'completed' (selesai)
					await bookingModel.updateBookingStatusByTransactionItem(supabase, item.id, 'completed');
				} catch (err) {
					console.error(
						`[returnsController.processReturn] Failed to update transaction item / booking status for item ID ${item.id}:`,
						err
					);
					throw err;
				}

				// c. Hitung dan catat denda kerusakan/hilang (per item)
				if (item.condition !== 'good') {
					// Cari aturan denda yang sesuai dengan kondisi barang
					const rule = penaltyRules?.find((r) => r.type === item.condition);
					if (rule) {
						let calculatedAmount = 0;

						if (item.damage_penalty_amount !== undefined && item.damage_penalty_amount !== null) {
							// Kasir sudah override nominal denda secara manual
							calculatedAmount = parseFloat(item.damage_penalty_amount.toString());
						} else {
							// Hitung otomatis berdasarkan aturan
							const amount = parseFloat(rule.amount || '0');
							// Ambil harga jual barang (untuk kalkulasi persentase)
							const sellPrice = await transactionModel.getTransactionItemSellPrice(supabase, item.id);

							if (rule.calculation_method === 'flat') {
								// Denda tetap: langsung pakai nilai rule.amount
								calculatedAmount = amount;
							} else if (rule.calculation_method === 'percentage') {
								// Denda persen: persentase × harga jual
								// Contoh: 75% × Rp 200.000 = Rp 150.000
								calculatedAmount = (amount / 100) * sellPrice;
							}
						}

						// Buat catatan denda kerusakan/hilang
						let itemNotesStr = `Denda ${rule.name}.`;
						if (item.notes) {
							itemNotesStr += ` Detail: ${item.notes}`;
						}
						if (calculatedAmount === 0) {
							itemNotesStr += ` (Denda kerusakan dibebaskan)`;
						}
						if (paymentStatus === 'paid' && paymentMethod !== 'QRIS') {
							itemNotesStr += ` [Lunas via ${paymentMethod}]`;
						} else if (paymentStatus === 'paid' && paymentMethod === 'QRIS') {
							itemNotesStr += ` [Menunggu Pembayaran QRIS]`;
						}

						try {
							console.log('[returnsController.processReturn] Inserting damage/lost penalty for item:', item.id, 'amount:', calculatedAmount);
							await penaltyModel.insertPenalty(supabase, {
								transaction_item_id: item.id,
								penalty_rule_id: rule.id,
								branch_id: profile.branch_id,
								type: item.condition,
								calculated_amount: calculatedAmount,
								payment_status:
									calculatedAmount === 0
										? 'paid'
										: paymentMethod === 'QRIS'
											? 'unpaid'
											: paymentStatus,
								paid_at:
									calculatedAmount === 0 || (paymentStatus === 'paid' && paymentMethod !== 'QRIS')
										? new Date().toISOString()
										: null,
								notes: itemNotesStr
							});
							totalPenalty += calculatedAmount;
						} catch (err) {
							console.error(`[returnsController.processReturn] Failed to insert damage/lost penalty for item ID ${item.id}:`, err);
							throw err;
						}
					}
				}

				// d. Update status asset fisik berdasarkan kondisi barang
				let assetStatus = 'ready'; // Default (tidak seharusnya terjadi)
				if (
					item.condition === 'minor_damage' ||
					item.condition === 'major_damage' ||
					item.condition === 'lost'
				) {
					assetStatus = 'maintenance'; // Perlu diperbaiki/dicatat
				} else if (item.condition === 'good') {
					assetStatus = 'washing'; // Kondisi baik → cuci dulu sebelum siap disewa lagi
				}

				if (item.asset_id) {
					try {
						console.log('[returnsController.processReturn] Updating asset status for asset:', item.asset_id, 'to:', assetStatus);
						await assetModel.updateAssetStatus(supabase, item.asset_id, assetStatus);
					} catch (err) {
						console.error(`[returnsController.processReturn] Failed to update asset status for asset ID ${item.asset_id}:`, err);
						throw err;
					}
				}

				// e. Catat activity log per item yang dikembalikan
				try {
					await activityLogModel.logActivity(supabase, {
						userId: profile.id,
						branchId: profile.branch_id,
						action: 'item_returned',
						entityType: 'transaction_item',
						entityId: item.id,
						metadata: {
							condition: item.condition
						}
					});
				} catch (err) {
					console.error('[returnsController.processReturn] Failed to log activity for returned item:', err);
					throw err;
				}
			}

			// 5. Jika ada denda & metode QRIS → Request QR Code ke Midtrans
			if (
				paymentStatus === 'paid' &&
				paymentMethod === 'QRIS' &&
				totalPenalty > 0 &&
				midtransConfig &&
				midtransConfig.fetch &&
				midtransConfig.serverKey
			) {
				try {
					console.log('[returnsController.processReturn] Initializing Midtrans QRIS payment request');

					// Ambil data pelanggan dari item pertama (untuk customer_details di Midtrans)
					const firstItemId = items[0]?.id;
					let customerName = 'Pelanggan';
					let customerPhone = '-';
					let transactionId = '';

					if (firstItemId) {
						const { data: itemData } = await supabase
							.from('transaction_items')
							.select('transaction:transactions(id, customer:customers(full_name, phone))')
							.eq('id', firstItemId)
							.maybeSingle();

						if (itemData?.transaction) {
							const tx = /** @type {any} */ (itemData.transaction);
							transactionId = tx.id;
							if (tx.customer) {
								customerName = tx.customer.full_name || customerName;
								customerPhone = tx.customer.phone || customerPhone;
							}
						}
					}

					if (!transactionId) {
						console.error('[returnsController.processReturn] Midtrans error: Transaction ID not found');
						return { success: false, status: 400, error: 'ID Transaksi tidak ditemukan' };
					}

					// Kode unik untuk pesanan denda di Midtrans
					const orderId = `DENDA-TX-${transactionId}`;

					const authString = btoa(`${midtransConfig.serverKey}:`); // Base64 API key
					const isProduction = midtransConfig.env === 'production';
					const apiUrl = isProduction
						? 'https://api.midtrans.com/v2/charge'
						: 'https://api.sandbox.midtrans.com/v2/charge';

					const midtransPayload = {
						payment_type: 'qris',
						transaction_details: {
							order_id: orderId,
							gross_amount: Math.round(totalPenalty) // Harus integer
						},
						customer_details: {
							first_name: customerName,
							phone: customerPhone
						},
						custom_expiry: {
							expiry_duration: 5, // QR kadaluarsa 5 menit
							unit: 'minute'
						}
					};

					console.log('[returnsController.processReturn] Calling Midtrans API:', apiUrl);
					const response = await midtransConfig.fetch(apiUrl, {
						method: 'POST',
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
							Authorization: `Basic ${authString}`
						},
						body: JSON.stringify(midtransPayload)
					});

					const midtransData = await response.json();
					console.log('[returnsController.processReturn] Midtrans response received:', midtransData);

					if (response.ok && midtransData.transaction_id) {
						// Midtrans berhasil → kembalikan data QR ke client
						const qr_string = midtransData.qr_string;
						const qr_url =
							midtransData.actions?.find((/** @type {any} */ act) => act.name === 'generate-qr-code')
								?.url || '';

						return {
							success: true,
							payment_method: 'qris',
							transaction_id: transactionId,
							order_id: orderId,
							totalPenalty,
							qr_string,
							qr_url
						};
					} else {
						console.error('[Returns Midtrans] Midtrans API Error:', midtransData);
						return {
							success: false,
							status: 400,
							error: midtransData.status_message || 'Gagal inisiasi pembayaran QRIS Midtrans.'
						};
					}
				} catch (e) {
					console.error('[Returns Midtrans] Request Error:', e);
					return {
						success: false,
						status: 500,
						error: 'Kesalahan internal server saat menghubungi Midtrans.'
					};
				}
			}

			// 6. Selesai — kembalikan total denda (untuk ditampilkan di UI)
			console.log('[returnsController.processReturn] Completed return processing successfully. Total Penalty:', totalPenalty);
			return { success: true, totalPenalty };
		} catch (err) {
			// Error tidak terduga — tangkap dan return error yang informatif
			console.error('[returnsController.processReturn] Critical exception during processing:', err);
			return {
				success: false,
				status: 500,
				error: err instanceof Error ? err.message : String(err)
			};
		}
	}
};
