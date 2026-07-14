/**
 * Mengecek apakah aplikasi berjalan di dalam Webview Flutter.
 *
 * @returns {boolean}
 */
export function isMobileApp() {
	if (typeof window === 'undefined') return false;

	const win = /** @type {any} */ (window);

	return (
		win.flutter_inappwebview !== undefined &&
		typeof win.flutter_inappwebview.callHandler === 'function'
	);
}

/**
 * Memanggil scanner barcode NATIVE di Flutter.
 *
 * @returns {Promise<string|null>}
 */
export async function scanBarcodeFromMobile() {
	if (!isMobileApp()) {
		console.warn('Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).');
		return null;
	}
	try {
		const win = /** @type {any} */ (window);
		const result = await win.flutter_inappwebview.callHandler('scanBarcode');
		return result;
	} catch (error) {
		console.error('Gagal melakukan scan barcode native:', error);
		return null;
	}
}

/**
 * Mengirim data transaksi untuk DICETAK ke printer Bluetooth oleh Flutter.
 *
 * @param {Object} receiptData
 * @returns {Promise<boolean>}
 */
export async function printReceiptFromMobile(receiptData) {
	if (!isMobileApp()) {
		console.warn('Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).');
		return false;
	}
	try {
		const win = /** @type {any} */ (window);
		const success = await win.flutter_inappwebview.callHandler('printReceipt', receiptData);
		return success;
	} catch (error) {
		console.error('Gagal mengirim perintah cetak ke Flutter:', error);
		return false;
	}
}
