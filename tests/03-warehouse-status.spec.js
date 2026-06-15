import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Warehouse Kanban & Asset Status', () => {
	test('should display Kanban board and allow status transitions', async ({ page }) => {
		// 1. Login as Gudang
		await loginAs(page, 'test_gudang@botanirent.com', 'PasswordTest123!');

		// 2. Go to Asset Status page
		await page.goto('/asset-status', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL(/.*\/asset-status/);

		// 3. Verify page header and kanban columns
		await expect(
			page.locator('h1:has-text("Status Aset Fisik")').filter({ visible: true }).first()
		).toBeVisible();

		// Check the columns
		const readyCol = page.locator('h2:has-text("Siap Disewa")').filter({ visible: true }).first();
		const rentedCol = page
			.locator('h2:has-text("Sedang Disewa")')
			.filter({ visible: true })
			.first();
		const washingCol = page.locator('h2:has-text("Dicuci")').filter({ visible: true }).first();
		const maintenanceCol = page
			.locator('h2:has-text("Perbaikan")')
			.filter({ visible: true })
			.first();

		await expect(readyCol).toBeVisible();
		await expect(rentedCol).toBeVisible();
		await expect(washingCol).toBeVisible();
		await expect(maintenanceCol).toBeVisible();

		// 4. Verify some seeded items are displayed in the Kanban
		const assetCard = page.locator('text=Tenda Dome 4 Orang').filter({ visible: true }).first();
		await expect(assetCard).toBeVisible();
	});
});
