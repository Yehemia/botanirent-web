/**
 * Helper to perform login in Playwright E2E tests
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function loginAs(page, email, password) {
	await page.goto('/login', { waitUntil: 'domcontentloaded' });

	// Wait for the login page to be loaded
	await page.waitForSelector('#email');

	// Fill credentials
	await page.fill('#email', email);
	await page.fill('#password', password);

	// Submit form
	await page.click('button[type="submit"]');

	// Wait for redirect to dashboard (increased to 20s for database tolerance)
	await page.waitForURL('**/dashboard', { timeout: 20000 });
}

/**
 * Logout the user
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
	await page.goto('/logout', { waitUntil: 'domcontentloaded' });
	await page.waitForURL('**/login', { timeout: 15000 });
}
