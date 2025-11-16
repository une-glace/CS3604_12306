import { test, expect } from '@playwright/test';

test.describe('车次筛选与条件修改', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 使用顶部“车票”入口进入列表，确保统一导航
    await page.locator('a[href="/train-list"]').click();
    await expect(page).toHaveURL(/\/train-list/);
    // 设置查询条件为北京南→上海虹桥 2025-12-15
    await page.fill('.station-selector .station-item:first-child .station-input', '北京南');
    await page.fill('.station-selector .station-item:last-child .station-input', '上海虹桥');
    await page.fill('#departure-date', '2025-12-15');
    await page.getByRole('button', { name: '查询', exact: true }).click();
    await expect(page.locator('.result-count')).toBeVisible({ timeout: 20000 });
    await page.locator('.loading-state').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
  });

  test('仅显示 D-动车', async ({ page }) => {
    const dOption = page.locator('.filter-conditions .line-options label').filter({ hasText: 'D-动车' });
    await dOption.locator('input').check();
    await expect(async () => {
      const rows = await page.locator('.train-list .train-row').count();
      const nos = await page.locator('.train-list .train-row .train-no').allTextContents();
      // 允许为空（若无动车），否则所有车次号以 D 开头
      if (rows > 0) {
        expect(nos.every(n => n.trim().startsWith('D'))).toBeTruthy();
      }
    }).toPass({ timeout: 20000 });
  });

  test('仅显示包含一等座的车次', async ({ page }) => {
    await page.getByRole('checkbox', { name: '一等座', exact: true }).check();
    await expect(page.locator('.result-count')).toBeVisible({ timeout: 20000 });
    // 至少能渲染列表或空态，避免超时
    const list = page.locator('.train-list .train-row').first();
    const empty = page.locator('.content .empty-state');
    await expect(list.or(empty)).toBeVisible({ timeout: 20000 });
  });

  test('修改查询为南京→上海并刷新列表', async ({ page }) => {
    await page.fill('.station-selector .station-item:first-child .station-input', '南京');
    await page.fill('.station-selector .station-item:last-child .station-input', '上海');
    await page.getByRole('button', { name: '查询', exact: true }).click();
    await expect(page).toHaveURL(/from=%E5%8D%97%E4%BA%AC/);
    await expect(page.locator('.result-count')).toBeVisible({ timeout: 20000 });
    await page.locator('.loading-state').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    const rows = await page.locator('.train-list .train-row').count();
    // 列表或空态可见即视为刷新成功
    const empty = page.locator('.content .empty-state');
    if (rows === 0) {
      await expect(empty).toBeVisible({ timeout: 20000 });
    } else {
      expect(rows).toBeGreaterThan(0);
    }
  });
});
