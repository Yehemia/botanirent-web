/**
 * @param {number | null | undefined} amount
 */
export function formatCurrency(amount) {
	if (amount == null) return '-';
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(amount);
}

/**
 * @param {string | Date} dateStr
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(dateStr, options) {
	if (!dateStr) return '-';
	const opt = options || {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};
	return new Intl.DateTimeFormat('id-ID', opt).format(new Date(dateStr));
}
