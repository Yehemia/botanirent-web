/**
 * ============================================================
 * FILE: image.js
 * TUJUAN: Fungsi HELPER untuk mengoptimasi gambar dari Supabase Storage.
 *
 * KONSEP IMAGE OPTIMIZATION:
 *   Gambar asli di Supabase mungkin berukuran 5MB (3000x4000 piksel).
 *   Tapi di aplikasi kita hanya menampilkan thumbnail 200x200.
 *   Jika muat gambar asli → BOROS bandwidth & LAMBAT.
 *
 *   Supabase punya fitur "Image Resizing" yang bisa:
 *   - Mengecilkan gambar di server (bukan di browser)
 *   - Mengurangi kualitas (quality 80% vs 100%)
 *   - Hasilnya: gambar 50KB vs 5MB → 100x lebih kecil!
 *
 * CARA PAKAI:
 *   import { getOptimizedImageUrl } from '$lib/utils/image';
 *
 *   // Gambar asli: https://xxx.supabase.co/storage/v1/object/public/items/foto.jpg
 *   // Optimized:   https://xxx.supabase.co/storage/v1/render/image/public/items/foto.jpg?width=200&quality=80
 *
 *   const thumb = getOptimizedImageUrl(url, { width: 200 });
 *   const card = getOptimizedImageUrl(url, { width: 400, height: 300, resize: 'cover' });
 * ============================================================
 */

/**
 * Generate an optimized URL for Supabase Storage images using the Image Resizing API.
 *
 * Cara kerjanya:
 *   1. Cek apakah URL adalah URL Supabase Storage
 *   2. Jika ya: ubah path dari /object/ ke /render/image/ + tambahkan parameter resize
 *   3. Jika bukan: kembalikan URL apa adanya (untuk gambar dari sumber lain)
 *
 * @param {string | null | undefined} url - URL asli gambar dari Supabase
 * @param {Object} options - Opsi resize
 * @param {number} [options.width] - Lebar target dalam piksel
 * @param {number} [options.height] - Tinggi target dalam piksel
 * @param {number} [options.quality=80] - Kualitas gambar 1-100 (80 = 80% kualitas, hemat ukuran)
 * @param {'cover' | 'contain' | 'fill'} [options.resize='contain'] - Mode resize:
 *   - 'cover': gambar memenuhi area (crop jika perlu) — untuk thumbnail
 *   - 'contain': gambar muat seluruhnya (ada whitespace) — untuk preview
 *   - 'fill': gambar distretch (bisa distorsi) — jarang dipakai
 * @returns {string} URL gambar yang sudah dioptimasi
 */
export function getOptimizedImageUrl(url, { width, height, quality = 80, resize = 'contain' } = {}) {
	// Jika URL kosong/null → kembalikan string kosong (tidak error)
	if (!url) return '';

	// Only optimize public Supabase storage URLs
	// Hanya URL yang mengandung path Supabase Storage yang bisa dioptimasi
	// URL dari sumber lain (Google, CDN, dll) langsung dikembalikan apa adanya
	if (url.includes('/storage/v1/object/public/')) {
		// Ganti path: /object/public/ → /render/image/public/
		// Ini mengaktifkan fitur Image Resizing dari Supabase
		const optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

		// Bangun query parameters
		const params = [];
		if (width) params.push(`width=${width}`); // ?width=200
		if (height) params.push(`height=${height}`); // &height=300
		if (quality) params.push(`quality=${quality}`); // &quality=80
		if (resize) params.push(`resize=${resize}`); // &resize=contain

		// Gabungkan URL + parameters
		return `${optimizedUrl}?${params.join('&')}`;
	}

	// Bukan URL Supabase → kembalikan apa adanya
	return url;
}
