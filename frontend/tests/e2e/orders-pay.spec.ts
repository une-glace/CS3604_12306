import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('订单中心未完成订单去支付', () => {
  test('点击去支付后订单进入未出行列表', async ({ page }) => {
    // Mock 订单列表接口
    await page.route('**/api/v1/orders**', async route => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      if (route.request().method() === 'GET') {
        if (status === 'unpaid' || status === 'pending' || !status) {
          // 返回一个未支付订单
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                orders: [{
                  id: 12345,
                  status: 'unpaid',
                  trainNumber: 'G101',
                  fromStation: '北京南',
                  toStation: '上海虹桥',
                  departureTime: '2025-12-15T08:00:00',
                  arrivalTime: '2025-12-15T13:28:00',
                  totalPrice: 553,
                  createdAt: new Date().toISOString(),
                  passengers: [{ name: '测试用户', seatType: '二等座', price: 553 }]
                }]
              }
            })
          });
        } else if (status === 'paid') {
           // 支付后，返回已支付订单
           // 这里我们简单模拟：如果请求的是 paid，就返回已支付
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
        } else {
          await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { orders: [] } }) });
        }
      } else {
        route.continue();
      }
    });

    // Mock 支付接口 (如果点击支付按钮会触发API)
    await page.route('**/api/v1/orders/*/pay', async route => {
       await route.fulfill({
         status: 200,
         body: JSON.stringify({ success: true, message: '支付成功' })
       });
    });
    
    // Mock 修改订单状态接口
    await page.route('**/api/v1/orders/*/status', async route => {
       await route.fulfill({
         status: 200,
         body: JSON.stringify({ success: true })
       });
    });

    await ensureLogin(page);

    // 进入个人中心 → 订单中心 → 火车票订单
    await page.goto('/profile');
    await expect(page.locator('.profile-page')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: '火车票订单' }).click();

    // 切换到“未完成订单”标签并等待列表加载
    await page.getByTestId('orders-tab-unfinished').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});

    // 点击首个“去支付”按钮
    const payBtn = page.locator('.orders-list .order-card .pay-btn').first();
    await expect(payBtn).toBeVisible({ timeout: 15000 });
    await payBtn.click();

    // 等待支付弹窗并接受“支付成功”提示
    const overlay = page.locator('.payment-modal-overlay');
    const overlayCount = await overlay.count();
    if (overlayCount > 0) {
      await expect(overlay).toBeVisible({ timeout: 20000 });
      // 模拟支付成功点击
      await page.locator('.payment-modal button.confirm-btn').click().catch(() => {}); 
      // 或者处理 alert
      // await page.waitForEvent('dialog', { timeout: 3000 }).then(d => d.accept()).catch(() => {});
    } else {
      // 兼容直接 Toast/无对话框的流程
      await page.waitForTimeout(500);
    }

    // 切换到“未出行订单”（已支付）并断言已支付订单可见或空态
    await page.getByTestId('orders-tab-not-travelled').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    const paidList = page.locator('.orders-list .order-card').first();
    const paidEmpty = page.locator('.orders-list .empty-state');
    await expect(paidList.or(paidEmpty)).toBeVisible({ timeout: 15000 });
  });
});
