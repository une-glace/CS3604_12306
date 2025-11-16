import { test, expect } from '@playwright/test';

test.describe('常用乘车人管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'mypassword');
    await Promise.all([
      page.waitForEvent('dialog').then(d => d.accept()),
      page.locator('button.login-button').click()
    ]);
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('添加两名乘车人并删除其中一名', async ({ page }) => {
    await page.getByRole('button', { name: '乘车人' }).click();
    await expect(page.getByRole('heading', { name: '乘车人管理' })).toBeVisible();

    // 添加 张三
    await page.locator('button.add-action').click();
    await page.fill('#name', '张三');
    await page.selectOption('#passengerType', { label: '成人' });
    await page.fill('#idCard', '110105194912310021');
    await page.fill('#phone', '13812341235');
    const beforeRows = await page.locator('.passenger-table .table-row').count();
    await page.locator('button.submit-btn').click();
    await expect(async () => {
      const afterRows = await page.locator('.passenger-table .table-row').count();
      expect(afterRows).toBeGreaterThan(beforeRows);
    }).toPass();

    // 添加 李四
    await page.locator('button.add-action').click();
    await page.fill('#name', '李四');
    await page.selectOption('#passengerType', { label: '成人' });
    await page.fill('#idCard', '110105194912310022');
    await page.fill('#phone', '13812341236');
    const beforeRows2 = await page.locator('.passenger-table .table-row').count();
    await page.locator('button.submit-btn').click();
    await expect(async () => {
      const afterRows2 = await page.locator('.passenger-table .table-row').count();
      expect(afterRows2).toBeGreaterThan(beforeRows2);
    }).toPass();

    // 删除 张三
    const row = page.locator('.passenger-table .table-row').filter({ hasText: '张三' });
    await Promise.all([
      page.waitForEvent('dialog').then(d => d.accept()),
      row.locator('button.op-btn.delete').click()
    ]);
    await expect(row).toHaveCount(0);
  });
});
