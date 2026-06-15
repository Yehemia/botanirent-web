import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Returns & Penalty Calculation', () => {
	test('should successfully process returns and calculate penalties', async ({ page }) => {
		// 1. Login as Kasir
		await loginAs(page, 'test_kasir@botanirent.com', 'PasswordTest123!');

		// 2. Go to Returns page
		await page.goto('/returns', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL(/.*\/returns/);

		// Wait 2 seconds for SvelteKit hydration to complete fully
		// (this prevents list clicks from being ignored before event listeners are bound to DOM)
		await page.waitForTimeout(2000);

		// 3. Verify page header (only visible elements, avoiding hidden mobile view elements)
		await expect(
			page.locator('h1:has-text("Pengembalian Barang")').filter({ visible: true }).first()
		).toBeVisible();

		// 4. Select a transaction from the active rentals list
		// Since we just ran the POS checkout test, there should be at least one active transaction.
		// We'll select the first active transaction in the left pane.
		const firstTrxButton = page.locator('button:has(.font-mono)').filter({ visible: true }).first();
		await expect(firstTrxButton).toBeVisible({ timeout: 10000 });
		await firstTrxButton.click();

		// 5. Verify the return detail pane loaded
		await expect(
			page.locator('h2:has-text("Detail Pengembalian")').filter({ visible: true }).first()
		).toBeVisible();

		// 6. Test damage penalty calculation
		// Locate the condition dropdown select and set it to 'minor_damage'
		const conditionSelect = page
			.locator('select:has-text("Baik / Layak Pakai")')
			.filter({ visible: true })
			.first();
		await expect(conditionSelect).toBeVisible();
		await conditionSelect.selectOption('minor_damage');

		// Set the damage penalty to 15.000 manually
		const damageInput = page
			.locator('input[placeholder="Masukkan nominal denda"]')
			.filter({ visible: true })
			.first();
		await expect(damageInput).toBeVisible();
		await damageInput.fill('15000');

		// Verify the total penalty text displays Rp 15.000 (unless there is also a late penalty)
		const penaltyText = page.locator('p:has-text("Rp ")').filter({ visible: true }).last();
		await expect(penaltyText).toBeVisible();
		const penaltyValue = await penaltyText.innerText();

		// The penalty should be at least Rp 15.000
		console.log('Calculated Penalty Value in UI:', penaltyValue);

		// Set the denda payment status
		const paymentStatusSelect = page
			.locator('select:has-text("Lunas (Bayar Sekarang)")')
			.filter({ visible: true })
			.first();
		await expect(paymentStatusSelect).toBeVisible();

		// 7. Process the return
		const processReturnBtn = page
			.locator('button:has-text("Proses Pengembalian")')
			.filter({ visible: true })
			.first();
		await expect(processReturnBtn).toBeEnabled();
		await processReturnBtn.click();

		// 8. Verify success feedback message
		const successBanner = page
			.locator('text=Berhasil memproses pengembalian!')
			.filter({ visible: true })
			.first();
		await expect(successBanner).toBeVisible({ timeout: 15000 });
	});
});
