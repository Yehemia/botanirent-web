/**
 * ============================================================
 * FILE: format.js
 * TUJUAN: Fungsi HELPER untuk memformat angka dan tanggal
 *         ke format INDONESIA (Rupiah, tanggal Indonesia).
 *
 * CARA PAKAI:
 *   import { formatCurrency, formatDate } from '$lib/utils/format';
 *
 *   formatCurrency(150000)    → "Rp150.000"
 *   formatCurrency(null)      → "-"
 *   formatDate('2025-01-15')  → "15 Jan 2025 00:00"
 *   formatDate(null)          → "-"
 *
 * KONSEP: Intl.NumberFormat & Intl.DateTimeFormat
 *   Ini adalah API bawaan JavaScript (tanpa library tambahan!)
 *   untuk memformat angka dan tanggal sesuai LOCALE (bahasa/negara).
 *   'id-ID' = locale Indonesia.
 * ============================================================
 */

/**
 * Format angka menjadi mata uang Rupiah Indonesia.
 *
 * Contoh:
 *   formatCurrency(150000)   → "Rp150.000"
 *   formatCurrency(2500000)  → "Rp2.500.000"
 *   formatCurrency(0)        → "Rp0"
 *   formatCurrency(null)     → "-"
 *
 * @param {number | null | undefined} amount - angka yang akan diformat
 */
export function formatCurrency(amount) {
	// Jika amount null/undefined → tampilkan strip (data kosong)
	// == null menangkap KEDUA null DAN undefined (bukan === null)
	if (amount == null) return '-';

	// Intl.NumberFormat = API bawaan JS untuk format angka sesuai locale
	// 'id-ID' = Indonesia (pakai titik sebagai pemisah ribuan, bukan koma)
	// style: 'currency' = format sebagai mata uang
	// currency: 'IDR' = Rupiah Indonesia
	// minimumFractionDigits: 0 = TANPA desimal (Rp150.000 bukan Rp150.000,00)
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(amount);
}

/**
 * Format tanggal menjadi format Indonesia.
 *
 * Contoh (dengan default options):
 *   formatDate('2025-01-15T10:30:00')  → "15 Jan 2025 10.30"
 *   formatDate(new Date())             → "20 Jun 2025 13.30"
 *   formatDate(null)                   → "-"
 *
 * Bisa dikustomisasi:
 *   formatDate('2025-01-15', { day: 'numeric', month: 'long', year: 'numeric' })
 *   → "15 Januari 2025"
 *
 * @param {string | Date} dateStr - tanggal (string ISO atau objek Date)
 * @param {Intl.DateTimeFormatOptions} [options] - opsi format (opsional)
 */
export function formatDate(dateStr, options) {
	if (!dateStr) return '-';

	// Default opsi: tanggal pendek + jam
	const opt = options || {
		day: '2-digit', // Hari: 01, 15, 30
		month: 'short', // Bulan pendek: Jan, Feb, Mar
		year: 'numeric', // Tahun: 2025
		hour: '2-digit', // Jam: 00-23
		minute: '2-digit' // Menit: 00-59
	};

	// Intl.DateTimeFormat = API bawaan JS untuk format tanggal sesuai locale
	// 'id-ID' = Indonesia (bulan dalam bahasa Indonesia)
	// new Date(dateStr) = konversi string tanggal menjadi objek Date
	return new Intl.DateTimeFormat('id-ID', opt).format(new Date(dateStr));
}
