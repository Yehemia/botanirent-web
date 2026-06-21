/**
 * ============================================================
 * FILE: posController.js
 * TUJUAN: Logic bisnis untuk halaman POS (Point of Sale) — kasir.
 *
 * APA ITU POS?
 *   Point of Sale = sistem kasir untuk memproses transaksi sewa.
 *   Kasir pilih barang → tambah ke keranjang → pilih pelanggan → checkout.
 *
 * ALUR CHECKOUT:
 *   1. Kasir buka POS → load data (barang, paket, pelanggan)
 *   2. Kasir tambah item ke keranjang
 *   3. Kasir pergi ke halaman checkout → isi data pembayaran
 *   4. Checkout diproses:
 *      a. Jika pelanggan BARU → insert dulu ke database
 *      b. Jika pelanggan LAMA → update jaminannya (jika berubah)
 *      c. Buat transaksi di database (via RPC)
 *      d. Jika QRIS → request ke Midtrans API untuk dapatkan QR Code
 *      e. Jika Tunai/Transfer → redirect ke struk langsung
 *
 * KONSEP MIDTRANS:
 *   Midtrans adalah payment gateway Indonesia yang memfasilitasi pembayaran QRIS.
 *   Alur QRIS: Server kita → Midtrans API → dapat QR code → tampilkan ke pelanggan
 *              → Pelanggan scan QRIS → Midtrans konfirmasi ke server kita (webhook)
 * ============================================================
 */

import { categoryModel } from '../models/categoryModel.js';
import { itemModel } from '../models/itemModel.js';
import { packageModel } from '../models/packageModel.js';
import { customerModel } from '../models/customerModel.js';
import { settingsModel } from '../models/settingsModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { activityLogModel } from '../models/activityLogModel.js';

export const posController = {
	/**
	 * Ambil semua data yang dibutuhkan halaman POS.
	 *
	 * Data yang dimuat:
	 *   - categories → untuk mengelompokkan item di tampilan
	 *   - items      → semua barang aktif yang bisa disewa/dijual
	 *   - packages   → paket bundling yang tersedia
	 *   - customers  → daftar pelanggan (untuk dropdown pilih pelanggan)
	 *
	 * GUARD: Jika kasir tidak punya branch_id → return data kosong.
	 *   Ini kondisi tidak normal yang bisa terjadi jika konfigurasi staf salah.
	 *
	 * PARALEL QUERY: Promise.all([...]) → 4 query database dijalankan bersamaan.
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ branch_id: string|null }} profile
	 */
	async getPOSData(supabase, profile) {
		// Guard: kasir HARUS punya cabang
		if (!profile.branch_id) {
			return {
				categories: [],
				items: [],
				packages: [],
				customers: [],
				currentBranchId: null
			};
		}

		// Jalankan 4 query secara paralel (lebih cepat dari sekuensial)
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
	 * Data yang dimuat:
	 *   - customers     → daftar pelanggan untuk dropdown
	 *   - rentalSettings → pengaturan sewa (durasi default, dll)
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
	 * Proses CHECKOUT — inti dari seluruh fitur POS.
	 *
	 * ALUR DETAIL:
	 * 1. Parse payload JSON dari FormData
	 * 2. Inject data server-side (branch_id, cashier_id, transaction_code)
	 * 3. Handle customer:
	 *    - Baru (ada customer_name, tidak ada customer_id) → insert customer dulu
	 *    - Lama (ada customer_id) + ada customer_guarantee → update data jaminan
	 * 4. Set payment_status berdasarkan metode bayar:
	 *    - QRIS → 'pending' (belum dibayar sampai Midtrans konfirmasi)
	 *    - Cash/Transfer → validasi nominal, set 'paid'
	 * 5. Eksekusi transaksi via RPC (checkout_transaction di PostgreSQL)
	 * 6. Catat activity log
	 * 7. Jika QRIS → request QR code ke Midtrans, simpan hasilnya ke DB
	 * 8. Return hasil (redirect URL atau data QRIS)
	 *
	 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
	 * @param {{ id: string, branch_id: string }} profile
	 * @param {FormData} formData - Berisi 1 field 'payload' berisi JSON string
	 * @param {object} midtransConfig - Konfigurasi Midtrans dari environment variables
	 * @param {string} midtransConfig.serverKey - API key Midtrans (rahasia, dari .env)
	 * @param {string} midtransConfig.env - 'sandbox' atau 'production'
	 * @param {typeof fetch} midtransConfig.fetch - Fungsi fetch dari SvelteKit
	 */
	async checkout(supabase, profile, formData, midtransConfig) {
		// 1. Ambil dan parse payload JSON dari form
		const payloadRaw = formData.get('payload');
		if (!payloadRaw) {
			return { success: false, status: 400, error: 'Data checkout kosong.' };
		}

		let payload;
		try {
			payload = JSON.parse(payloadRaw.toString());
		} catch (e) {
			// Tampilkan preview payload mentah jika gagal di-parse (untuk debugging)
			const preview = payloadRaw.toString().substring(0, 200);
			console.error('[Checkout] Payload JSON parse failed. Raw value preview:', preview);
			return {
				success: false,
				status: 400,
				error: `Format data transaksi tidak valid. Preview: ${preview}`
			};
		}

		// 2. Inject data SERVER-SIDE (tidak boleh dari client, ini keamanan!)
		//    Client tidak boleh menentukan siapa kasirnya atau cabang mana
		payload.branch_id = profile.branch_id;
		payload.cashier_id = profile.id;

		// Generate kode transaksi unik: TRX-XXXX-000000
		// Math.random().toString(36) → string acak berbasis base36 (0-9 + a-z)
		const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 karakter acak
		const timeStr = Date.now().toString().slice(-6); // 6 digit terakhir timestamp
		payload.transaction_code = `TRX-${randomStr}-${timeStr}`;

		// 3a. PELANGGAN BARU (ada nama tapi tidak ada ID pelanggan) → insert dulu
		if (payload.customer_name && !payload.customer_id) {
			try {
				// Sanitasi nama dan telepon pelanggan baru
				const clean_name = payload.customer_name.trim().replace(/<\/?[^>]+(>|$)/g, '');
				const clean_phone = payload.customer_phone ? payload.customer_phone.trim().replace(/[^0-9+\-\s]/g, '') : '';
				const clean_guarantee = payload.customer_guarantee ? payload.customer_guarantee.trim().replace(/<\/?[^>]+(>|$)/g, '') : 'Tanpa Jaminan';

				// Buat objek notes untuk pelanggan baru
				const notesObj = {
					guarantee_type: clean_guarantee,
					deposit_amount: 0,
					notes: ''
				};
				const notesJson = JSON.stringify(notesObj);

				// Insert pelanggan baru ke database
				const newCust = await customerModel.createCustomer(supabase, {
					branch_id: profile.branch_id,
					full_name: clean_name,
					phone: clean_phone || null,
					notes: notesJson
				});
				if (newCust) {
					payload.customer_id = newCust.id; // Simpan ID pelanggan baru ke payload
				}
			} catch (custErr) {
				console.error('Error creating customer in checkout:', custErr);
				// Tidak fatal — transaksi bisa lanjut meski gagal simpan pelanggan
			}
		} else if (payload.customer_id && payload.customer_guarantee) {
			// 3b. PELANGGAN LAMA: Update data jaminan jika berbeda dari sebelumnya
			try {
				const { data: existingCustomer } = await supabase
					.from('customers')
					.select('notes')
					.eq('id', payload.customer_id)
					.single();

				// Buat objek notes baru berdasarkan data lama + update jaminan
				let notesObj = {
					guarantee_type: payload.customer_guarantee,
					deposit_amount: 0,
					notes: ''
				};

				if (existingCustomer?.notes) {
					try {
						const json = JSON.parse(existingCustomer.notes);
						if (json && typeof json === 'object') {
							// Spread data lama, tapi override guarantee_type dengan yang baru
							notesObj = {
								...json,
								guarantee_type: payload.customer_guarantee
							};
						}
					} catch (e) {
						// Jika notes lama bukan JSON, simpan sebagai notes text biasa
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

		// 4. Set payment status berdasarkan metode pembayaran
		if (payload.payment_method === 'qris') {
			// QRIS: Status awal 'pending' karena pembayaran belum dikonfirmasi Midtrans
			payload.payment_status = 'pending';
			payload.paid_amount = 0;  // Belum ada yang dibayarkan
			payload.change_amount = 0;
		} else {
			// Cash/Transfer: Validasi apakah uang yang dibayar cukup
			if (payload.paid_amount < payload.total_amount) {
				return { success: false, status: 400, error: 'Nominal pembayaran tunai tidak mencukupi.' };
			}
			payload.payment_status = 'paid'; // Langsung lunas
		}

		// 5. Eksekusi transaksi via RPC (PostgreSQL function)
		//    Ini yang membuat record di tabel: transactions, transaction_items, bookings
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

		// 6. Catat activity log
		//    QRIS masih pending → action 'transaction_created'
		//    Cash/Transfer sudah lunas → action 'transaction_completed'
		await activityLogModel.logActivity(supabase, {
			userId: profile.id,
			branchId: profile.branch_id,
			action: payload.payment_method === 'qris' ? 'transaction_created' : 'transaction_completed',
			entityType: 'transaction',
			entityId: data.transaction_id,
			metadata: { code: payload.transaction_code, amount: payload.total_amount }
		});

		// 7. Jika QRIS → request QR Code ke Midtrans API
		if (payload.payment_method === 'qris') {
			try {
				// Encode server key ke Base64 untuk HTTP Basic Auth
				// Format Basic Auth: Base64("serverKey:")
				const authString = btoa(`${midtransConfig.serverKey}:`);
				const isProduction = midtransConfig.env === 'production';
				// Pilih URL API Midtrans: sandbox (testing) atau production (live)
				const apiUrl = isProduction
					? 'https://api.midtrans.com/v2/charge'
					: 'https://api.sandbox.midtrans.com/v2/charge';

				// Data yang dikirim ke Midtrans
				const midtransPayload = {
					payment_type: 'qris',
					transaction_details: {
						order_id: payload.transaction_code, // Kode transaksi kita sebagai ID pesanan Midtrans
						gross_amount: Math.round(payload.total_amount) // Harus integer (Midtrans tidak terima desimal)
					},
					customer_details: {
						first_name: payload.customer_name || 'Pelanggan',
						phone: payload.customer_phone || '-'
					},
					custom_expiry: {
						expiry_duration: 5, // QR Code kadaluarsa dalam 5 menit
						unit: 'minute'
					}
				};

				// Kirim request ke Midtrans API
				const response = await midtransConfig.fetch(apiUrl, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${authString}` // HTTP Basic Auth
					},
					body: JSON.stringify(midtransPayload)
				});

				const midtransData = await response.json();

				if (response.ok && midtransData.transaction_id) {
					// Midtrans berhasil → ambil data QR
					const qr_string = midtransData.qr_string; // String data QR (untuk di-render di browser)
					// URL gambar QR code (alternatif, dari Midtrans)
					const qr_url =
						midtransData.actions?.find((/** @type {any} */ act) => act.name === 'generate-qr-code')
							?.url || '';

					// Simpan ID Midtrans dan data QR ke database
					// (disimpan di kolom midtrans_snap_token sebagai JSON string)
					await transactionModel.updateTransaction(supabase, data.transaction_id, {
						midtrans_transaction_id: midtransData.transaction_id,
						midtrans_snap_token: JSON.stringify({ qr_string, qr_url })
					});

					// Return data QR ke client untuk ditampilkan ke pelanggan
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

		// 8. Cash/Transfer: Redirect ke halaman struk transaksi
		return {
			success: true,
			redirect: `/transactions/${data.transaction_id}?success=true`
		};
	}
};
