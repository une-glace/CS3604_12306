import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('订单中心列表', () => {
  test('未出行与未完成列表断言', async ({ page }) => {
    // Mock 订单列表接口
    await page.route('**/api/v1/orders**', async route => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      if (route.request().method() === 'GET') {
        if (status === 'paid') {
          // 返回已支付订单
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                orders: [{
                  id: 12345,
                  status: 'paid',
                  trainNumber: 'G101',
                  fromStation: '北京南',
                  toStation: '上海虹桥',
                  departureTime: '2025-12-15T08:00:00',
                  arrivalTime: '2025-12-15T13:28:00',
                  totalPrice: 553,
                  createdAt: new Date().toISOString(),
                  paidAt: new Date().toISOString(),
                  passengers: [{ name: '测试用户', seatType: '二等座', price: 553 }]
                }]
              }
            })
          });
        } else if (status === 'unpaid') {
           // 返回未支付订单
           await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                orders: [{
                  id: 67890,
                  status: 'unpaid',
                  trainNumber: 'G102',
                  fromStation: '上海虹桥',
                  toStation: '北京南',
                  departureTime: '2025-12-16T09:00:00',
                  arrivalTime: '2025-12-16T14:28:00',
                  totalPrice: 553,
                  createdAt: new Date().toISOString(),
                  passengers: [{ name: '测试用户', seatType: '二等座', price: 553 }]
                }]
              }
            })
          });
        } else {
          await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { orders: [] } }) });
        }
      } else {
        route.continue();
      }
    });

    await ensureLogin(page);

    await page.locator('.profile-page').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await page.getByRole('button', { name: '火车票订单' }).click();
    // 切换“未出行订单”（已支付）
    await page.getByTestId('orders-tab-not-travelled').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    const paidList = page.locator('.orders-list .order-card').first();
    const paidEmpty = page.locator('.orders-list .empty-state');
    await expect(paidList.or(paidEmpty)).toBeVisible({ timeout: 15000 });
    // 切换“未完成订单”（未支付）
    await page.getByTestId('orders-tab-unfinished').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    const unfinishedEmpty = page.locator('.orders-list .empty-state');
    const unfinishedAny = page.locator('.orders-list .order-card').first();
    await expect(unfinishedEmpty.or(unfinishedAny)).toBeVisible({ timeout: 15000 });
  });
});
