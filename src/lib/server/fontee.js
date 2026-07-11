import { FONTEE_API_TOKEN } from '$env/static/private';

/**
 * Sends a WhatsApp message via Fontee API.
 * @param {string} target Recipient phone number (e.g. 0812xxx or 62812xxx)
 * @param {string} message The text message to send
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function sendWhatsApp(target, message) {
	// Clean the phone number (remove space, dash, ensure country code 62)
	let cleanTarget = target.replace(/[^0-9]/g, '');
	if (cleanTarget.startsWith('0')) {
		cleanTarget = '62' + cleanTarget.slice(1);
	}

	const token = FONTEE_API_TOKEN || '';
	if (!token || token === 'your_fontee_token_here' || token.trim() === '') {
		console.warn('[WA-Fontee] API token is not configured.');
		return { success: false, message: 'Token API Fontee belum dikonfigurasi di file .env.' };
	}

	try {
		const formData = new FormData();
		formData.append('target', cleanTarget);
		formData.append('message', message);
		formData.append('countryCode', '62');

		console.log(`[WA-Fontee] Sending WA to ${cleanTarget} via Fontee...`);
		const response = await fetch('https://api.fontee.com/send', {
			method: 'POST',
			headers: {
				'Authorization': token
			},
			body: formData
		});

		const result = await response.json();
		if (response.ok && result.status === true) {
			console.log(`[WA-Fontee] Message successfully sent to ${cleanTarget}`);
			return { success: true };
		} else {
			console.error('[WA-Fontee] API failed:', result);
			return { success: false, message: result.detail || result.reason || 'Gagal mengirim pesan via Fontee.' };
		}
	} catch (error) {
		console.error('[WA-Fontee] Connection error:', error);
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, message: message || 'Koneksi ke Fontee gagal.' };
	}
}
