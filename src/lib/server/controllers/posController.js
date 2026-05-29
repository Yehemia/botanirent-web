import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { packageModel } from '../models/packageModel.js';
import { customerModel } from '../models/customerModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const posController = {
	/**
	 * Get all active assets, categories, packages, and customers for POS
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getPOSData(supabase, profile) {
		// If no branch_id is set (Semua Cabang), return empty datasets but flag it
		if (!profile.branch_id) {
			return {
				categories: [],
				items: [],
				packages: [],
				customers: [],
				currentBranchId: null
			};
		}

		const categories = await categoryModel.getCategories(supabase);
		const items = await itemModel.getActiveItems(supabase, profile.branch_id);
		const packages = await packageModel.getActivePackages(supabase, profile.branch_id);
		const customers = await customerModel.getCustomersMinimal(supabase, profile.branch_id);

		return {
			categories,
			items,
			packages,
			customers,
			currentBranchId: profile.branch_id
		};
	},

	/**
	 * Get required checkout page data
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string }} profile
	 */
	async getCheckoutData(supabase, profile) {
		const customers = await customerModel.getCustomersMinimal(supabase, profile.branch_id);
		const rentalSettings = await settingsModel.getRentalSettings(supabase);

		return {
			customers,
			rentalSettings
		};
	},

	/**
	 * Process order checkout (cash, transfer, or QRIS via Midtrans)
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string }} profile
	 * @param {FormData} formData
	 * @param {object} midtransConfig
	 * @param {string} midtransConfig.serverKey
	 * @param {string} midtransConfig.env
	 * @param {typeof fetch} midtransConfig.fetch
	 */
	async checkout(supabase, profile, formData, midtransConfig) {
		const payloadRaw = formData.get('payload');
		if (!payloadRaw) {
			return { success: false, status: 400, error: 'Data checkout kosong.' };
		}
		
		let payload;
		try {
			payload = JSON.parse(payloadRaw.toString());
		} catch (e) {
			const preview = payloadRaw.toString().substring(0, 200);
			console.error('[Checkout] Payload JSON parse failed. Raw value preview:', preview);
			return { success: false, status: 400, error: `Format data transaksi tidak valid. Preview: ${preview}` };
		}
		
		// Injeksi data server-side
		payload.branch_id = profile.branch_id;
		payload.cashier_id = profile.id;
		
		// Generate Transaction Code (e.g., TRX-1A2B-123456)
		const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
		const timeStr = Date.now().toString().slice(-6);
		payload.transaction_code = `TRX-${randomStr}-${timeStr}`;
		
		// Handle Customer (Jika pelanggan baru, insert dulu)
		if (payload.customer_name && !payload.customer_id) {
			try {
				const newCust = await customerModel.createCustomer(supabase, {
					branch_id: profile.branch_id,
					full_name: payload.customer_name,
					phone: payload.customer_phone
				});
				if (newCust) {
					payload.customer_id = newCust.id;
				}
			} catch (custErr) {
				console.error("Error creating customer in checkout:", custErr);
				// We can continue or fail. In original, if it fails to create customer, it continues but payload.customer_id will remain empty/null.
			}
		}

		// Jika QRIS, status awal adalah pending
		if (payload.payment_method === 'qris') {
			payload.payment_status = 'pending';
			payload.paid_amount = 0; // Belum dibayar
			payload.change_amount = 0;
		} else {
			// Validasi pembayaran tunai
			if (payload.paid_amount < payload.total_amount) {
				return { success: false, status: 400, error: 'Nominal pembayaran tunai tidak mencukupi.' };
			}
			payload.payment_status = 'paid';
		}

		let data;
		try {
			data = await transactionModel.checkoutTransaction(supabase, payload);
		} catch (error) {
			console.error("Checkout transaction error:", error);
			return { success: false, status: 500, error: `Gagal Checkout: ${error instanceof Error ? error.message : String(error)}` };
		}

		// Log activity
		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: 'transaction_completed',
			entityType: 'transaction',
			entityId: data.transaction_id,
			metadata: { code: payload.transaction_code, amount: payload.total_amount }
		});

		// JIKA QRIS -> Request ke Midtrans API
		if (payload.payment_method === 'qris') {
			try {
				const authString = btoa(`${midtransConfig.serverKey}:`);
				const isProduction = midtransConfig.env === 'production';
				const apiUrl = isProduction 
					? 'https://api.midtrans.com/v2/charge' 
					: 'https://api.sandbox.midtrans.com/v2/charge';
				
				const midtransPayload = {
					payment_type: 'qris',
					transaction_details: {
						order_id: payload.transaction_code,
						gross_amount: Math.round(payload.total_amount)
					},
					customer_details: {
						first_name: payload.customer_name || 'Pelanggan',
						phone: payload.customer_phone || '-'
					},
					custom_expiry: {
						expiry_duration: 5,
						unit: 'minute'
					}
				};

				const response = await midtransConfig.fetch(apiUrl, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Basic ${authString}`
					},
					body: JSON.stringify(midtransPayload)
				});

				const midtransData = await response.json();
				if (response.ok && midtransData.transaction_id) {
					const qr_string = midtransData.qr_string;
					const qr_url = midtransData.actions?.find((/** @type {any} */ act) => act.name === 'generate-qr-code')?.url || '';

					// Update database dengan ID transaksi Midtrans dan data QRIS (disimpan di midtrans_snap_token sebagai JSON)
					await transactionModel.updateTransaction(supabase, data.transaction_id, {
						midtrans_transaction_id: midtransData.transaction_id,
						midtrans_snap_token: JSON.stringify({ qr_string, qr_url })
					});

					return {
						success: true,
						payment_method: 'qris',
						transaction_id: data.transaction_id,
						transaction_code: payload.transaction_code,
						qr_string,
						qr_url
					};
				} else {
					console.error("Midtrans API Error:", midtransData);
					return { success: false, status: 400, error: midtransData.status_message || 'Gagal inisiasi pembayaran QRIS Midtrans.' };
				}
			} catch (e) {
				console.error("Midtrans Request Error:", e);
				return { success: false, status: 500, error: 'Kesalahan internal server saat menghubungi Midtrans.' };
			}
		}

		// Redirect ke halaman struk jika tunai atau transfer
		return {
			success: true,
			redirect: `/transactions/${data.transaction_id}?success=true`
		};
	}
};
