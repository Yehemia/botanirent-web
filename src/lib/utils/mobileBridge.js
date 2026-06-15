/**
 * Mengecek apakah aplikasi berjalan di dalam Webview Flutter
 * @returns {boolean} true jika di dalam Flutter Webview
 */
export function isMobileApp() {
  if (typeof window === 'undefined') return false;
  const win = /** @type {any} */ (window);
  return win.flutter_inappwebview !== undefined && 
         typeof win.flutter_inappwebview.callHandler === 'function';
}

/**
 * Memanggil scanner barcode native di Flutter
 * @returns {Promise<string|null>} data barcode hasil scan, atau null jika gagal/bukan mobile
 */
export async function scanBarcodeFromMobile() {
  if (!isMobileApp()) {
    console.warn("Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).");
    return null;
  }
  try {
    const win = /** @type {any} */ (window);
    const result = await win.flutter_inappwebview.callHandler('scanBarcode');
    return result; // Mengembalikan string kode barcode (atau null jika dibatalkan)
  } catch (error) {
    console.error("Gagal melakukan scan barcode native:", error);
    return null;
  }
}

/**
 * Mengirim data transaksi untuk dicetak ke printer bluetooth oleh Flutter
 * @param {Object} receiptData data struk belanja
 * @returns {Promise<boolean>} status sukses print
 */
export async function printReceiptFromMobile(receiptData) {
  if (!isMobileApp()) {
    console.warn("Aplikasi tidak berjalan di lingkungan mobile wrapper (Flutter).");
    return false;
  }
  try {
    const win = /** @type {any} */ (window);
    const success = await win.flutter_inappwebview.callHandler('printReceipt', receiptData);
    return success;
  } catch (error) {
    console.error("Gagal mengirim perintah cetak ke Flutter:", error);
    return false;
  }
}
