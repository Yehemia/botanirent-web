/**
 * Generate an optimized URL for Supabase Storage images using the Image Resizing API.
 *
 * @param {string | null | undefined} url
 * @param {Object} options
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {number} [options.quality=80]
 * @param {'cover' | 'contain' | 'fill'} [options.resize='contain']
 * @returns {string}
 */
export function getOptimizedImageUrl(url, { width, height, quality = 80, resize = 'contain' } = {}) {
	if (!url) return '';

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
