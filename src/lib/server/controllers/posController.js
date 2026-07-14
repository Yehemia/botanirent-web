import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { packageModel } from '../models/packageModel.js';
import { customerModel } from '../models/customerModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { activityLogModel } from '../models/activityLogModel.js';
import { invalidateDashboardCache } from '../cache.js';

export const posController = {
	/**
	 * Ambil semua data yang dibutuhkan halaman POS.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getPOSData(supabase, profile) {
		if (!profile.branch_id) {
			return {
				categories: [],
				items: [],
				packages: [],
				customers: [],
				currentBranchId: null
			};
		}

		const [categories, items, packages, customers] = await Promise.all([
			categoryModel.getCategories(supabase),
			itemModel.getActiveItems(supabase, profile.branch_id),
			packageModel.getActivePackages(supabase, profile.branch_id),
			customerModel.getCustomersMinimal(supabase, profile.branch_id)
		]);

		return {
			categories,
			items,
			packages,
			customers,
			currentBranchId: profile.branch_id
		};
	},

	/**
	 * Ambil data yang dibutuhkan halaman CHECKOUT.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string }} profile
	 */
	async getCheckoutData(supabase, profile) {
		const [customers, rentalSettings] = await Promise.all([
			customerModel.getCustomersMinimal(supabase, profile.branch_id),
			settingsModel.getRentalSettings(supabase)
		]);

		return {
			customers,
			rentalSettings
		};
	},

	/**
	 * Proses CHECKOUT.
	 *
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
			console.error('[Checkout] Payload JSON parse failed:', e, 'Raw value preview:', preview);
			return {
				success: false,
				status: 400,
				error: `Format data transaksi tidak valid. Preview: ${preview}`
			};
		}

		// Validation: Rental or Hybrid transactions must have a customer associated
		const containsRental = payload.cart && payload.cart.some((/** @type {any} */ c) => c.type === 'rental' || c.type === 'package');
		if (containsRental) {
			const hasExistingCustomer = !!payload.customer_id;
			const hasNewCustomer = payload.customer_name && payload.customer_name.trim() && payload.customer_phone && payload.customer_phone.trim();
			if (!hasExistingCustomer && !hasNewCustomer) {
				return {
					success: false,
					status: 400,
					error: 'Untuk transaksi penyewaan barang (Rental/Hybrid), wajib menyertakan data pelanggan (baik pelanggan baru maupun terdaftar).'
				};
			}
		}

		payload.branch_id = profile.branch_id;
		payload.cashier_id = profile.id;

		const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
		const timeStr = Date.now().toString().slice(-6);
		payload.transaction_code = `TRX-${randomStr}-${timeStr}`;

		if (payload.customer_name && !payload.customer_id) {
			try {
				const clean_name = payload.customer_name.trim().replace(/<\/?[^>]+(>|$)/g, '');
				const clean_phone = payload.customer_phone ? payload.customer_phone.trim().replace(/[^0-9+\-\s]/g, '') : '';
				const clean_guarantee = payload.customer_guarantee ? payload.customer_guarantee.trim().replace(/<\/?[^>]+(>|$)/g, '') : 'Tanpa Jaminan';

				const notesObj = {
					guarantee_type: clean_guarantee,
					deposit_amount: 0,
					notes: ''
				};
				const notesJson = JSON.stringify(notesObj);

				const newCust = await customerModel.createCustomer(supabase, {
					branch_id: profile.branch_id,
					full_name: clean_name,
					phone: clean_phone || null,
					notes: notesJson
				});
				if (newCust) {
					payload.customer_id = newCust.id;
				}
			} catch (custErr) {
				console.error('Error creating customer in checkout:', custErr);
			}
		} else if (payload.customer_id && payload.customer_guarantee) {
			try {
				const { data: existingCustomer } = await supabase
					.from('customers')
					.select('notes')
					.eq('id', payload.customer_id)
					.single();

				let notesObj = {
					guarantee_type: payload.customer_guarantee,
					deposit_amount: 0,
					notes: ''
				};

				if (existingCustomer?.notes) {
					try {
						const json = JSON.parse(existingCustomer.notes);
						if (json && typeof json === 'object') {
							notesObj = {
								...json,
								guarantee_type: payload.customer_guarantee
							};
						}
					} catch {
						notesObj.notes = existingCustomer.notes;
					}
				}

				await customerModel.updateCustomer(supabase, payload.customer_id, {
					notes: JSON.stringify(notesObj)
				});
			} catch (updateErr) {
				console.error('Error updating customer guarantee in checkout:', updateErr);
			}
		}

		if (payload.payment_method === 'qris') {
			payload.payment_status = 'pending';
			payload.paid_amount = 0;
			payload.change_amount = 0;
		} else {
			if (payload.paid_amount < payload.total_amount) {
				return { success: false, status: 400, error: 'Nominal pembayaran tunai tidak mencukupi.' };
			}
			payload.payment_status = 'paid';
		}

		let data;
		try {
			data = await transactionModel.checkoutTransaction(supabase, payload);
		} catch (error) {
			console.error('Checkout transaction error:', error);
			return {
				success: false,
				status: 500,
				error: `Gagal Checkout: ${error instanceof Error ? error.message : String(error)}`
			};
		}

		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: payload.payment_method === 'qris' ? 'transaction_created' : 'transaction_completed',
			entityType: 'transaction',
			entityId: data.transaction_id,
			metadata: { code: payload.transaction_code, amount: payload.total_amount }
		});

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
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${authString}`
					},
					body: JSON.stringify(midtransPayload)
				});

				const midtransData = await response.json();

				if (response.ok && midtransData.transaction_id) {
					const qr_string = midtransData.qr_string;
					const qr_url =
						midtransData.actions?.find(/** @param {any} act */ (act) => act.name === 'generate-qr-code')
							?.url || '';

					await transactionModel.updateTransaction(supabase, data.transaction_id, {
						midtrans_transaction_id: midtransData.transaction_id,
						midtrans_snap_token: JSON.stringify({ qr_string, qr_url })
					});

					invalidateDashboardCache(profile.branch_id);

					return {
						success: true,
						payment_method: 'qris',
						transaction_id: data.transaction_id,
						transaction_code: payload.transaction_code,
						qr_string,
						qr_url
					};
				} else {
					console.error('Midtrans API Error:', midtransData);
					return {
						success: false,
						status: 400,
						error: midtransData.status_message || 'Gagal inisiasi pembayaran QRIS Midtrans.'
					};
				}
			} catch (e) {
				console.error('Midtrans Request Error:', e);
				return {
					success: false,
					status: 500,
					error: 'Kesalahan internal server saat menghubungi Midtrans.'
				};
			}
		}

		invalidateDashboardCache(profile.branch_id);

		return {
			success: true,
			redirect: `/transactions/${data.transaction_id}?success=true`
		};
	}
};
