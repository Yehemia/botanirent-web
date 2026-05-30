/**
 * Mengecek apakah aplikasi berjalan di dalam Webview Flutter
 * @returns {boolean} true jika di dalam Flutter Webview
 */
export function isMobileApp() {
  return typeof window !== 'undefined' && 
         window['flutter_inappwebview'] !== undefined && 
         typeof window['flutter_inappwebview'].callHandler === 'function';
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
    const result = await window['flutter_inappwebview'].callHandler('scanBarcode');
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
    const success = await window['flutter_inappwebview'].callHandler('printReceipt', receiptData);
    return success;
  } catch (error) {
    console.error("Gagal mengirim perintah cetak ke Flutter:", error);
    return false;
  }
}
