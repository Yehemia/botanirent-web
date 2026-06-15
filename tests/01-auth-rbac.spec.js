import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Role-Based Access Control (RBAC) & Authentication', () => {
	test('should redirect unauthenticated users to login page', async ({ page }) => {
		await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL(/.*\/login/);
	});

	test('should login as Kasir and only see Kasir menus', async ({ page }) => {
		await loginAs(page, 'test_kasir@botanirent.com', 'PasswordTest123!');

		// Verify profile name & role in user area (filtering visible elements)
		await expect(page.locator('text=Test Kasir').filter({ visible: true }).first()).toBeVisible();
		await expect(page.locator('text=kasir').filter({ visible: true }).first()).toBeVisible();

		// Kasir links should be visible
		await expect(page.locator('text=POS').filter({ visible: true }).first()).toBeVisible();
		await expect(page.locator('text=Data Penyewa').filter({ visible: true }).first()).toBeVisible();
		await expect(
			page.locator('text=Kalender Booking').filter({ visible: true }).first()
		).toBeVisible();
		await expect(page.locator('text=Pengembalian').filter({ visible: true }).first()).toBeVisible();
		await expect(page.locator('text=Riwayat').filter({ visible: true }).first()).toBeVisible();

		// Gudang & Owner specific links should NOT be visible
		await expect(page.locator('text=Inventaris')).not.toBeVisible();
		await expect(page.locator('text=Status Aset')).not.toBeVisible();
		await expect(page.locator('text=Manajemen Staff')).not.toBeVisible();
		await expect(page.locator('text=Pengaturan Sistem')).not.toBeVisible();
	});

	test('should login as Gudang and only see Gudang menus', async ({ page }) => {
		await loginAs(page, 'test_gudang@botanirent.com', 'PasswordTest123!');

		// Verify profile name & role in user area
		await expect(page.locator('text=Test Gudang').filter({ visible: true }).first()).toBeVisible();
		await expect(page.locator('text=gudang').filter({ visible: true }).first()).toBeVisible();

		// Gudang links should be visible
		await expect(page.locator('text=Inventaris').filter({ visible: true }).first()).toBeVisible();
		await expect(
			page.locator('text=Paket Bundling').filter({ visible: true }).first()
		).toBeVisible();
		await expect(page.locator('text=Status Aset').filter({ visible: true }).first()).toBeVisible();
		await expect(
			page.locator('text=Kalender Booking').filter({ visible: true }).first()
		).toBeVisible();

		// Kasir & Owner specific links should NOT be visible
		await expect(page.locator('text=POS')).not.toBeVisible();
		await expect(page.locator('text=Pengembalian')).not.toBeVisible();
		await expect(page.locator('text=Manajemen Staff')).not.toBeVisible();
	});

	test('should login as Owner and only see Owner menus', async ({ page }) => {
		await loginAs(page, 'test_owner@botanirent.com', 'PasswordTest123!');

		// Verify profile name & role in user area
		await expect(page.locator('text=Test Owner').filter({ visible: true }).first()).toBeVisible();
		await expect(page.locator('text=owner').filter({ visible: true }).first()).toBeVisible();

		// Owner links should be visible
		await expect(page.locator('text=Statistik').filter({ visible: true }).first()).toBeVisible();
		await expect(
			page.locator('text=Manajemen Cabang').filter({ visible: true }).first()
		).toBeVisible();
		await expect(
			page.locator('text=Manajemen Staff').filter({ visible: true }).first()
		).toBeVisible();
		await expect(
			page.locator('text=Pengaturan Sistem').filter({ visible: true }).first()
		).toBeVisible();
		await expect(
			page.locator('text=Log Aktivitas').filter({ visible: true }).first()
		).toBeVisible();

		// Kasir & Gudang specific links should NOT be visible
		await expect(page.locator('text=POS')).not.toBeVisible();
		await expect(page.locator('text=Inventaris')).not.toBeVisible();
		await expect(page.locator('text=Status Aset')).not.toBeVisible();
	});
});
