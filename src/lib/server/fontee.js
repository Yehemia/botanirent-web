import { env } from '$env/dynamic/private';

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

	const token = env.FONTEE_API_TOKEN || '';
	if (!token || token === 'your_fontee_token_here' || token.trim() === '') {
		console.warn('[WA-Fonnte] API token is not configured.');
		return { success: false, message: 'Token API Fonnte belum dikonfigurasi di file .env.' };
	}

	try {
		const formData = new FormData();
		formData.append('target', cleanTarget);
		formData.append('message', message);
		formData.append('countryCode', '62');

		console.log(`[WA-Fonnte] Sending WA to ${cleanTarget} via Fonnte...`);
		const response = await fetch('https://api.fonnte.com/send', {
			method: 'POST',
			headers: {
				'Authorization': token
			},
			body: formData
		});

		const result = await response.json();
		if (response.ok && result.status === true) {
			console.log(`[WA-Fonnte] Message successfully sent to ${cleanTarget}`);
			return { success: true };
		} else {
			console.error('[WA-Fonnte] API failed:', result);
			return { success: false, message: result.detail || result.reason || 'Gagal mengirim pesan via Fonnte.' };
		}
	} catch (error) {
		console.error('[WA-Fonnte] Connection error:', error);
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, message: message || 'Koneksi ke Fonnte gagal.' };
	}
}
