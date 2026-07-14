import { transactionModel } from '../models/transactionModel.js';
import { penaltyModel } from '../models/penaltyModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { assetModel } from '../models/assetModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { cacheGet, invalidateDashboardCache } from '../cache.js';
import { supabaseAdmin } from '../supabase.js';

export const returnsController = {
	/**
	 * Siapkan data untuk halaman Returns.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getReturnsPageData(supabase, profile) {
		const activeRentals = await transactionModel.getActiveRentalsForReturns(
			supabase,
			profile.branch_id
		);

		/** @type {Record<string, any>} */
		const grouped = {};
		if (activeRentals) {
			activeRentals.forEach((item) => {
				const trxId = item.transaction_id;
				if (!grouped[trxId]) {
					grouped[trxId] = {
						transaction_id: trxId,
						transaction_code: item.transaction.transaction_code,
						transaction_type: item.transaction.type,
						customer_name: item.transaction.customer?.full_name || 'Pelanggan Umum',
						customer_phone: item.transaction.customer?.phone || '-',
						items: []
					};
				}
				grouped[trxId].items.push(item);
			});
		}

		const penaltyRules = await cacheGet(
			'penalty_rules',
			() => penaltyModel.getPenaltyRules(supabase),
			60000
		);
		const rentalSettings = await cacheGet(
			'rental_settings',
			() => settingsModel.getRentalSettings(supabase),
			60000
		);

		return {
			transactions: Object.values(grouped),
			penaltyRules,
			rentalSettings
		};
	},

	/**
	 * Proses pengembalian barang.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 * @param {{ fetch?: any, serverKey?: string, env?: string }} [midtransConfig]
	 */
	async processReturn(supabase, profile, formData, midtransConfig) {
		try {
			console.log('[returnsController.processReturn] Starting processReturn with profile branch:', profile?.branch_id);

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
			let totalLatePenaltyOverridden = null;

			if (Array.isArray(parsed)) {
				items = parsed;
			} else {
				items = parsed.items || [];
				paymentStatus = parsed.payment_status || 'unpaid';
				paymentMethod = parsed.payment_method || 'Tunai';
				globalNotes = parsed.global_notes || '';
				totalLatePenaltyOverridden = parsed.total_late_penalty;
			}

			console.log('[returnsController.processReturn] Extracted parameters - items count:', items.length, 'paymentStatus:', paymentStatus, 'paymentMethod:', paymentMethod);

			const rentalSettings = await cacheGet(
				'rental_settings',
				() => settingsModel.getRentalSettings(supabase),
				60000
			);
			console.log('[returnsController.processReturn] Fetched rental settings:', rentalSettings);
			const lateRate =
				parseFloat(rentalSettings.late_fee_per_day_per_transaction?.toString() || '10000') || 10000;

			const penaltyRules = await cacheGet(
				'penalty_rules',
				() => penaltyModel.getPenaltyRules(supabase),
				60000
			);
			console.log('[returnsController.processReturn] Fetched penalty rules count:', penaltyRules?.length);

			let maxLateDays = 0;
			let latePenaltyItemId = null;

			for (const item of items) {
				if (item.condition !== 'lost' && item.late_days > maxLateDays) {
					maxLateDays = item.late_days;
				}
				if (item.condition !== 'lost' && !latePenaltyItemId) {
					latePenaltyItemId = item.id;
				}
			}

			let totalPenalty = 0;

			if (maxLateDays > 0 && latePenaltyItemId) {
				const calculatedLateAmount =
					totalLatePenaltyOverridden !== null && totalLatePenaltyOverridden !== undefined
						? parseFloat(totalLatePenaltyOverridden.toString())
						: maxLateDays * lateRate;

				const rule = penaltyRules?.find((r) => r.type === 'late');

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
						payment_status:
							calculatedLateAmount === 0
								? 'paid'
								: paymentMethod === 'QRIS'
									? 'unpaid'
									: paymentStatus,
						paid_at:
							calculatedLateAmount === 0 || (paymentStatus === 'paid' && paymentMethod !== 'QRIS')
								? new Date().toISOString()
								: null,
						notes: notesStr
					});
					totalPenalty += calculatedLateAmount;
				} catch (err) {
					console.error('[returnsController.processReturn] Failed to insert late penalty in controller:', err);
					throw err;
				}
			}

			for (const item of items) {
				console.log('[returnsController.processReturn] Processing item ID:', item.id);

				let finalRentalStatus = 'returned';
				if (item.condition === 'lost') finalRentalStatus = 'lost';

				let returnNotes =
					item.condition === 'lost'
						? 'Barang dinyatakan hilang'
						: `Kondisi kembali: ${item.condition}`;
				if (item.notes) {
					returnNotes += ` (${item.notes})`;
				}

				try {
					console.log('[returnsController.processReturn] Updating transaction item status to:', finalRentalStatus, 'for item:', item.id);
					await transactionModel.updateTransactionItem(supabase, item.id, {
						rental_status: finalRentalStatus,
						returned_at: new Date().toISOString(),
						return_condition: item.condition,
						return_notes: returnNotes
					});

					await bookingModel.updateBookingStatusByTransactionItem(supabase, item.id, 'completed');
				} catch (err) {
					console.error(
						`[returnsController.processReturn] Failed to update transaction item / booking status for item ID ${item.id}:`,
						err
					);
					throw err;
				}

				if (item.condition !== 'good') {
					const rule = penaltyRules?.find((r) => r.type === item.condition);
					if (rule) {
						let calculatedAmount = 0;

						if (item.damage_penalty_amount !== undefined && item.damage_penalty_amount !== null) {
							calculatedAmount = parseFloat(item.damage_penalty_amount.toString());
						} else {
							const amount = parseFloat(rule.amount || '0');
							const sellPrice = await transactionModel.getTransactionItemSellPrice(supabase, item.id);

							if (rule.calculation_method === 'flat') {
								calculatedAmount = amount;
							} else if (rule.calculation_method === 'percentage') {
								calculatedAmount = (amount / 100) * sellPrice;
							}
						}

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

				let assetStatus = 'ready';
				if (
					item.condition === 'minor_damage' ||
					item.condition === 'major_damage' ||
					item.condition === 'lost'
				) {
					assetStatus = 'maintenance';
				} else if (item.condition === 'good') {
					assetStatus = 'washing';
				}

				if (item.asset_id) {
					try {
						console.log('[returnsController.processReturn] Updating asset status for asset:', item.asset_id, 'to:', assetStatus);
						await assetModel.updateAssetStatus(supabaseAdmin, item.asset_id, assetStatus);
					} catch (err) {
						console.error(`[returnsController.processReturn] Failed to update asset status for asset ID ${item.asset_id}:`, err);
						throw err;
					}
				}

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

					const orderId = `DENDA-TX-${transactionId}`;
					const authString = btoa(`${midtransConfig.serverKey}:`);
					const isProduction = midtransConfig.env === 'production';
					const apiUrl = isProduction
						? 'https://api.midtrans.com/v2/charge'
						: 'https://api.sandbox.midtrans.com/v2/charge';

					const midtransPayload = {
						payment_type: 'qris',
						transaction_details: {
							order_id: orderId,
							gross_amount: Math.round(totalPenalty)
						},
						customer_details: {
							first_name: customerName,
							phone: customerPhone
						},
						custom_expiry: {
							expiry_duration: 5,
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
						const qr_string = midtransData.qr_string;
						const qr_url =
							midtransData.actions?.find(/** @param {any} act */ (act) => act.name === 'generate-qr-code')
								?.url || '';

						invalidateDashboardCache(profile.branch_id);

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

			console.log('[returnsController.processReturn] Completed return processing successfully. Total Penalty:', totalPenalty);
			
			invalidateDashboardCache(profile.branch_id);

			return { success: true, totalPenalty };
		} catch (err) {
			console.error('[returnsController.processReturn] Critical exception during processing:', err);
			return {
				success: false,
				status: 500,
				error: err instanceof Error ? err.message : String(err)
			};
		}
	}
};
