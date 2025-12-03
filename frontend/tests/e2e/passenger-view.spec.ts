// filepath: frontend/tests/e2e/passenger-view.spec.ts
import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('常用乘车人-查看', () => {
  test('鉴于用户已登录；当进入乘车人管理；那么默认乘客显示在列表中；并且至少一条记录', async ({ page }) => {
    await ensureLogin(page, 'newuser', 'my_password1');
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByRole('button', { name: '乘车人' }).click();
    await page.locator('.loading-container .loading').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    await expect(page.getByRole('heading', { name: '乘车人管理' })).toBeVisible();

    const rows = page.locator('.passenger-table .table-row');
    await expect(rows.first().or(page.locator('.passenger-table .empty-state'))).toBeVisible({ timeout: 20000 });
    const texts = await rows.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.join('\n')).toContain('测试用户');
  });
});
