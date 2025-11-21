import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('个人信息编辑', () => {
  test('修改邮箱并保存', async ({ page }) => {
    await ensureLogin(page);
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByRole('button', { name: '查看个人信息' }).click();
    await expect(page.locator('h2').filter({ hasText: '个人信息' })).toBeVisible();

    await page.locator('button.edit-btn').first().click();
    await page.fill('#email', 'newuser@example.com');
    page.once('dialog', async d => d.accept());
    await page.locator('button.save-btn').click();
    const emailRow = page.locator('.kv-item').filter({ hasText: '邮箱：' });
    await expect(emailRow.locator('.kv-value')).toHaveText('newuser@example.com', { timeout: 20000 });
  });
});
