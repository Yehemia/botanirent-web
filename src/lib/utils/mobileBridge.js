/**
 * ============================================================
 * FILE: mobileBridge.js
 * TUJUAN: "Jembatan" komunikasi antara Web App (SvelteKit)
 *         dan Aplikasi Mobile Native (Flutter).
 *
 * KONSEP HYBRID APP:
 *   BotaniRent bisa diakses lewat 2 cara:
 *   1. Browser biasa (Chrome, Safari) → web biasa
 *   2. Aplikasi Flutter (mobile app) → web dimuat di dalam WebView
 *
 *   Saat dimuat di Flutter WebView, aplikasi web mendapat akses ke
 *   fitur NATIVE yang tidak bisa dilakukan browser biasa:
 *   - Scan barcode lewat kamera HP
 *   - Cetak struk lewat printer Bluetooth
 *
 *   File ini menyediakan fungsi untuk memanggil fitur native tersebut.
 *
 * CARA KERJA:
 *   Flutter menyuntikkan objek 'flutter_inappwebview' ke dalam window
 *   Objek ini memiliki method 'callHandler' yang bisa memanggil kode Dart
 *   dari JavaScript.
 *
 *   JavaScript (Web)  ←→  flutter_inappwebview  ←→  Dart (Flutter)
 *
 * CARA PAKAI:
 *   import { isMobileApp, scanBarcodeFromMobile, printReceiptFromMobile } from '$lib/utils/mobileBridge';
 *
 *   if (isMobileApp()) {
 *     const barcode = await scanBarcodeFromMobile();
 *     if (barcode) {
 *       // Proses barcode...
 *     }
 *   }
 * ============================================================
 */

/**
 * Mengecek apakah aplikasi berjalan di dalam Webview Flutter.
 *
 * Cara kerjanya:
 *   Flutter WebView menyuntikkan objek global 'flutter_inappwebview'
 *   ke dalam window. Jika objek ini ada → kita tahu app berjalan di Flutter.
 *
 * @returns {boolean} true jika di dalam Flutter Webview
 */
export function isMobileApp() {
	// typeof window === 'undefined' → kode berjalan di server (SSR), bukan browser
	// Di server tidak ada 'window', jadi pasti bukan mobile app
	if (typeof window === 'undefined') return false;

	// Cast window ke 'any' agar TypeScript tidak error
	// (flutter_inappwebview bukan property standar dari Window)
	const win = /** @type {any} */ (window);

	// Cek keberadaan objek flutter_inappwebview DAN method callHandler
	return (
		win.flutter_inappwebview !== undefined &&
		typeof win.flutter_inappwebview.callHandler === 'function'
	);
}

/**
 * Memanggil scanner barcode NATIVE di Flutter.
 *
 * Alur eksekusi:
 *   1. JavaScript memanggil callHandler('scanBarcode')
 *   2. Flutter menerima pesan → membuka kamera → scan barcode
 *   3. User mengarahkan kamera ke barcode
 *   4. Flutter mengirim hasil scan kembali ke JavaScript
 *   5. Function ini mengembalikan string kode barcode
 *
 * @returns {Promise<string|null>} data barcode hasil scan, atau null jika gagal/bukan mobile
 */
export async function scanBarcodeFromMobile() {
	// Jika bukan mobile app, jangan coba memanggil fitur native
	if (!isMobileApp()) {
		console.warn('Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).');
		return null;
	}
	try {
		const win = /** @type {any} */ (window);
		// callHandler('scanBarcode') = panggil function 'scanBarcode' di sisi Dart/Flutter
		const result = await win.flutter_inappwebview.callHandler('scanBarcode');
		return result; // Mengembalikan string kode barcode (atau null jika dibatalkan user)
	} catch (error) {
		console.error('Gagal melakukan scan barcode native:', error);
		return null;
	}
}

/**
 * Mengirim data transaksi untuk DICETAK ke printer Bluetooth oleh Flutter.
 *
 * Alur eksekusi:
 *   1. JavaScript mengirim data struk (items, total, tanggal, dll)
 *   2. Flutter menerima data → format untuk printer thermal
 *   3. Flutter mengirim ke printer Bluetooth yang sudah terhubung
 *   4. Printer mencetak struk
 *   5. Function ini mengembalikan true jika berhasil
 *
 * @param {Object} receiptData — data struk belanja (items, total, customer, dll)
 * @returns {Promise<boolean>} true jika print berhasil, false jika gagal
 */
export async function printReceiptFromMobile(receiptData) {
	if (!isMobileApp()) {
		console.warn('Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).');
		return false;
	}
	try {
		const win = /** @type {any} */ (window);
		// callHandler('printReceipt', receiptData) = panggil function 'printReceipt'
		// di sisi Dart, dengan parameter receiptData
		const success = await win.flutter_inappwebview.callHandler('printReceipt', receiptData);
		return success;
	} catch (error) {
		console.error('Gagal mengirim perintah cetak ke Flutter:', error);
		return false;
	}
}
