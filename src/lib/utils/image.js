/**
 * Generate an optimized URL for Supabase Storage images using the Image Resizing API.
 * 
 * @param {string | null | undefined} url - The original public URL of the image.
 * @param {Object} options - Resizing options.
 * @param {number} [options.width] - Target width in pixels.
 * @param {number} [options.height] - Target height in pixels.
 * @param {number} [options.quality=80] - Image quality (1-100).
 * @param {'cover' | 'contain' | 'fill'} [options.resize='contain'] - Resize mode.
 * @returns {string} The optimized image URL or the original URL if not a Supabase URL.
 */
export function getOptimizedImageUrl(url, { width, height, quality = 80, resize = 'contain' } = {}) {
	if (!url) return '';

	// Only optimize public Supabase storage URLs
	if (url.includes('/storage/v1/object/public/')) {
		const optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
		const params = [];
		if (width) params.push(`width=${width}`);
		if (height) params.push(`height=${height}`);
		if (quality) params.push(`quality=${quality}`);
		if (resize) params.push(`resize=${resize}`);

		return `${optimizedUrl}?${params.join('&')}`;
	}

	return url;
}
