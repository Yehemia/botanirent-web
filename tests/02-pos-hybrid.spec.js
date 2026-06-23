import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('POS Hybrid Transaction & Checkout', () => {
	test('should successfully execute a hybrid rental & retail transaction', async ({ page }) => {
		// 1. Login as Kasir
		await loginAs(page, 'test_kasir@botanirent.com', 'PasswordTest123!');

		// 2. Go to POS page and wait for domcontentloaded
		await page.goto('/pos', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL(/.*\/pos/);

		// Wait 2 seconds for SvelteKit hydration to complete fully
		// (this prevents clicks from being ignored before event listeners are bound to DOM)
		await page.waitForTimeout(2000);

		// 3. Select Bogotá branch items (Bogor branch should be active)
		const tendaItem = page
			.locator('button:has-text("Tenda Dome 4 Orang")')
			.filter({ visible: true })
			.first();
		const gasItem = page
			.locator('button:has-text("Gas Kaleng Hi-Cook 230g")')
			.filter({ visible: true })
			.first();

		await expect(tendaItem).toBeVisible();
		await expect(gasItem).toBeVisible();

		// 4. Add items to cart
		await tendaItem.click();
		await page.waitForTimeout(500); // short pause between clicks
		await gasItem.click();

		// 5. Verify items are added to cart
		const cartSection = page.locator('h2:has-text("Keranjang")').filter({ visible: true }).first();
		await expect(cartSection).toBeVisible();

		// Verify individual items and prices in the cart list
		await expect(
			page.locator('span:has-text("Tenda Dome 4 Orang")').filter({ visible: true }).first()
		).toBeVisible();
		await expect(
			page.locator('span:has-text("Gas Kaleng Hi-Cook 230g")').filter({ visible: true }).first()
		).toBeVisible();

		// 6. Proceed to payment page
		const payButton = page
			.locator('button:has-text("Lanjut ke Pembayaran")')
			.filter({ visible: true })
			.first();
		await expect(payButton).toBeEnabled();
		await payButton.click();

		// 7. Verify we are on checkout page
		await page.waitForURL(/.*\/pos\/checkout/, { timeout: 10000 });
		await expect(
			page.locator('h1:has-text("Checkout Pembayaran")').filter({ visible: true }).first()
		).toBeVisible();

		// 8. Fill checkout form
		// Set Tanggal Mulai to tomorrow's date
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().split('T')[0];

		await page.fill('#startDate', tomorrowStr);

		// Select Customer Mode: Baru (New)
		const customerNewBtn = page
			.locator('button:has-text("Baru")')
			.filter({ visible: true })
			.first();
		await customerNewBtn.click();

		await page.fill('#customerName', 'Test Customer E2E');
		await page.fill('#customerPhone', '089999999999');

		// Select Payment Method: Tunai (should be default, let's click it to be sure)
		const cashMethodBtn = page
			.locator('button:has-text("Tunai")')
			.filter({ visible: true })
			.first();
		await cashMethodBtn.click();

		// Enter cash amount paid
		// The total should be Rp 73.000 (48.000 + 25.000), let's pay 100.000
		await page.fill('#paidAmountInput', '100000');

		// Verify change amount display (Kembalian: Rp 27.000)
		const changeDisplay = page.locator('text=Kembalian').filter({ visible: true }).first();
		await expect(changeDisplay).toBeVisible();
		await expect(page.locator('text=Rp 27.000').filter({ visible: true }).first()).toBeVisible();

		// 9. Submit/Selesaikan Transaksi
		const submitBtn = page
			.locator('button:has-text("Selesaikan Transaksi")')
			.filter({ visible: true })
			.first();
		await expect(submitBtn).toBeEnabled();
		await submitBtn.click();

		// 10. Verify redirect to the receipt / transaction details page
		await page.waitForURL(/.*\/transactions\/[0-9a-fA-F-]+\?success=true/, { timeout: 15000 });
		// Verify brand title and printed customer name in receipt view
		await expect(page.locator('text=BOTANIRENT').filter({ visible: true }).first()).toBeVisible();
		await expect(
			page.locator('text=Test Customer E2E').filter({ visible: true }).first()
		).toBeVisible();
	});
});
