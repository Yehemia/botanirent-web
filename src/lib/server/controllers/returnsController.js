import { transactionModel } from '../models/transactionModel.js';
import { penaltyModel } from '../models/penaltyModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { assetModel } from '../models/assetModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const returnsController = {
	/**
	 * Get data needed for returns page (active rentals grouped by transaction, penalty rules, rental settings)
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getReturnsPageData(supabase, profile) {
		const activeRentals = await transactionModel.getActiveRentalsForReturns(supabase, profile.branch_id);

		// Group by transaction
		/** @type {Record<string, any>} */
		const grouped = {};
		if (activeRentals) {
			activeRentals.forEach(item => {
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

		const penaltyRules = await penaltyModel.getPenaltyRules(supabase);
		const rentalSettings = await settingsModel.getRentalSettings(supabase);

		return {
			transactions: Object.values(grouped),
			penaltyRules,
			rentalSettings
		};
	},

	/**
	 * Process item returns and calculate penalties
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string|null }} profile
	 * @param {FormData} formData
	 */
	async processReturn(supabase, profile, formData) {
		const payloadStr = formData.get('payload');
		if (!payloadStr) {
			return { success: false, status: 400, error: 'Payload kosong' };
		}

		let parsed;
		try {
			parsed = JSON.parse(payloadStr.toString());
		} catch (e) {
			console.error('[Returns] Failed to parse return payload JSON:', e);
			return { success: false, status: 400, error: 'Format payload tidak valid.' };
		}
		
		let items = [];
		let paymentStatus = 'unpaid';
		let paymentMethod = 'Tunai';
		let globalNotes = '';
		let totalLatePenaltyOverridden = null;

		// Support both array and object formats
		if (Array.isArray(parsed)) {
			items = parsed;
		} else {
			items = parsed.items || [];
			paymentStatus = parsed.payment_status || 'unpaid';
			paymentMethod = parsed.payment_method || 'Tunai';
			globalNotes = parsed.global_notes || '';
			totalLatePenaltyOverridden = parsed.total_late_penalty;
		}

		// Fetch settings for late fee per day per transaction
		const rentalSettings = await settingsModel.getRentalSettings(supabase);
		const lateRate = parseFloat(rentalSettings.late_fee_per_day_per_transaction?.toString() || '10000') || 10000;

		// Fetch penalty rules for damage/lost
		const penaltyRules = await penaltyModel.getPenaltyRules(supabase);

		// 1. Calculate late penalty once per transaction
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

		// Insert transaction-wide late penalty if any
		if (maxLateDays > 0 && latePenaltyItemId) {
			const calculatedLateAmount = totalLatePenaltyOverridden !== null && totalLatePenaltyOverridden !== undefined
				? parseFloat(totalLatePenaltyOverridden.toString())
				: maxLateDays * lateRate;

			const rule = penaltyRules?.find(r => r.type === 'late');
			
			// Build late penalty notes
			let notesStr = `Keterlambatan transaksi selama ${maxLateDays} hari.`;
			if (calculatedLateAmount === 0) {
				notesStr += ` (Denda keterlambatan dibebaskan)`;
			} else if (totalLatePenaltyOverridden !== null && totalLatePenaltyOverridden !== undefined) {
				notesStr += ` (Denda disesuaikan manual dari ${maxLateDays * lateRate})`;
			}
			if (paymentStatus === 'paid') {
				notesStr += ` [Lunas via ${paymentMethod}]`;
			}
			if (globalNotes) {
				notesStr += ` Catatan: ${globalNotes}`;
			}

			try {
				await penaltyModel.insertPenalty(supabase, {
					transaction_item_id: latePenaltyItemId,
					penalty_rule_id: rule?.id,
					branch_id: profile.branch_id,
					type: 'late',
					late_days: maxLateDays,
					calculated_amount: calculatedLateAmount,
					payment_status: calculatedLateAmount === 0 ? 'paid' : paymentStatus,
					paid_at: (paymentStatus === 'paid' || calculatedLateAmount === 0) ? new Date().toISOString() : null,
					notes: notesStr
				});
				totalPenalty += calculatedLateAmount;
			} catch (err) {
				console.error("Failed to insert late penalty in controller:", err);
			}
		}

		// 2. Loop and process individual items
		for (const item of items) {
			let finalRentalStatus = 'returned';
			if (item.condition === 'lost') finalRentalStatus = 'lost';

			let returnNotes = item.condition === 'lost' 
				? 'Barang dinyatakan hilang' 
				: `Kondisi kembali: ${item.condition}`;
			if (item.notes) {
				returnNotes += ` (${item.notes})`;
			}

			try {
				// Update status transaction_items
				await transactionModel.updateTransactionItem(supabase, item.id, {
					rental_status: finalRentalStatus,
					returned_at: new Date().toISOString(),
					return_condition: item.condition,
					return_notes: returnNotes
				});

				// Update calendar booking status to 'completed'
				await bookingModel.updateBookingStatusByTransactionItem(supabase, item.id, 'completed');
			} catch (err) {
				console.error(`Failed to update transaction item / booking status for item ID ${item.id}:`, err);
			}

			// Insert damage/lost penalty per-item if applicable
			if (item.condition !== 'good') {
				const rule = penaltyRules?.find(r => r.type === item.condition);
				if (rule) {
					let calculatedAmount = 0;
					
					if (item.damage_penalty_amount !== undefined && item.damage_penalty_amount !== null) {
						calculatedAmount = parseFloat(item.damage_penalty_amount.toString());
					} else {
						const amount = parseFloat(rule.amount || '0');
						// Fetch sell price
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
					if (paymentStatus === 'paid') {
						itemNotesStr += ` [Lunas via ${paymentMethod}]`;
					}

					try {
						await penaltyModel.insertPenalty(supabase, {
							transaction_item_id: item.id,
							penalty_rule_id: rule.id,
							branch_id: profile.branch_id,
							type: item.condition,
							calculated_amount: calculatedAmount,
							payment_status: calculatedAmount === 0 ? 'paid' : paymentStatus,
							paid_at: (paymentStatus === 'paid' || calculatedAmount === 0) ? new Date().toISOString() : null,
							notes: itemNotesStr
						});
						totalPenalty += calculatedAmount;
					} catch (err) {
						console.error(`Failed to insert damage/lost penalty for item ID ${item.id}:`, err);
					}
				}
			}

			// Update physical asset status
			let assetStatus = 'ready'; // Default Good
			if (item.condition === 'minor_damage' || item.condition === 'major_damage' || item.condition === 'lost') {
				assetStatus = 'maintenance';
			} else if (item.condition === 'good') {
				assetStatus = 'washing'; // default wash first
			}

			if (item.asset_id) {
				try {
					await assetModel.updateAssetStatus(supabase, item.asset_id, assetStatus);
				} catch (err) {
					console.error(`Failed to update asset status for asset ID ${item.asset_id}:`, err);
				}
			}

			// Log activity
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
				console.error("Failed to log activity for returned item:", err);
			}
		}

		return { success: true, totalPenalty };
	}
};
