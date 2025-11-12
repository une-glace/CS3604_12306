import { test, expect } from '@playwright/test';

test.describe('车票查询与筛选', () => {
  test('查询北京南→上海虹桥 2025-12-15', async ({ page }) => {
    await page.goto('/train-list?from=北京南&to=上海虹桥&date=2025-12-15');
    await expect(page.locator('.result-count')).toBeVisible({ timeout: 20000 });
    await page.locator('.loading-state').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    const rows = await page.locator('.train-list .train-row').count();
    if (rows === 0) {
      await expect(page.locator('.empty-state .empty-text')).toHaveText('暂无符合条件的车次');
    } else {
      expect(rows).toBeGreaterThan(0);
    }
  });
});
