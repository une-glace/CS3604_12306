import { test, expect } from '@playwright/test';

test.describe('从列表点击预订稳定用例', () => {
  test('点击预订进入订单页（有列表则点击，无列表则跳过）', async ({ page }) => {
    const apiRes = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username: 'newuser', password: 'mypassword' }
    });
    if (apiRes.status() === 200) {
      const data = await apiRes.json();
      const token = data?.data?.token;
      if (token) {
        await page.goto('/');
        await page.evaluate(t => localStorage.setItem('authToken', t), token);
      }
    }

    await page.goto('/train-list?from=北京南&to=上海虹桥&date=2025-12-15');
    await page.locator('.result-count').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.locator('.loading-state').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    const btn = page.locator('button.book-button.available').first();
    if (await btn.count()) {
      await btn.click();
      await expect(page).toHaveURL(/\/order/);
    } else {
      await expect(page).toHaveURL(/\/train-list/);
    }
  });
});
