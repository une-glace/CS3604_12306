import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('常用地址管理', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLogin(page);
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('增加地址并删除', async ({ page }) => {
    await page.getByRole('button', { name: '地址管理' }).click();
    await expect(page.getByRole('heading', { name: '地址管理' })).toBeVisible();

    await page.locator('button.add-action').click();
    await page.fill('#recipient', '收件人A');
    await page.fill('#phone', '13812345678');
    await page.selectOption('#province', '北京市');
    await page.selectOption('#city', '北京市');
    await page.selectOption('#district', '朝阳区');
    await page.selectOption('#town', '酒仙桥街道');
    await page.selectOption('#neighborhood', '酒仙桥路区域');
    await page.fill('#detail', '酒仙桥路10号');
    await page.check('#default-address');

    const beforeRows = await page.locator('.address-table .table-row').count();
    await page.locator('button.submit-btn').click();

    await expect(async () => {
      const afterRows = await page.locator('.address-table .table-row').count();
      expect(afterRows).toBeGreaterThan(beforeRows);
    }).toPass({ timeout: 20000 });

    const rowsBeforeDelete = await page.locator('.address-table .table-row').count();
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 5000 }).then(d => d.accept()),
      page.locator('.address-table .table-row').last().locator('button.op-btn.delete').click()
    ]);
    await expect(page.locator('.address-table .table-row')).toHaveCount(rowsBeforeDelete - 1);
  });
});

