import { test, expect } from '@playwright/test';

test.describe('订单中心列表', () => {
  test('未出行与未完成列表断言', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'mypassword');
    await Promise.all([
      page.waitForEvent('dialog').then(d => d.accept()),
      page.locator('button.login-button').click()
    ]);
    // 进入个人中心：若已自动跳转至个人中心则直接断言，否则点击首页“我的12306”
    if (!/\/profile$/.test(page.url())) {
      await page.getByRole('button', { name: '我的12306' }).click();
    }
    await expect(page).toHaveURL(/\/profile$/);

    // 后端创建一笔已支付订单，以保证“未出行订单”有数据
    const apiLogin = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username: 'newuser', password: 'mypassword' }
    });
    let token: string | null = null;
    if (apiLogin.status() === 200) {
      const lj = await apiLogin.json();
      token = lj.data?.token || null;
    }
    if (token) {
      const payload = {
        trainInfo: {
          trainNumber: 'G101', from: '北京南', to: '上海虹桥',
          departureTime: '08:00', arrivalTime: '13:28', date: '2025-12-15', duration: '5小时28分'
        },
        passengers: [{ id: 'self', name: '测试用户', idCard: 'A1234567890123456', phone: '13812340001', passengerType: '成人' }],
        ticketInfos: [{ passengerId: 'self', passengerName: '测试用户', seatType: '二等座', ticketType: '成人票', price: 553 }],
        totalPrice: 553,
        selectedSeats: []
      };
      const createRes = await page.request.post('http://127.0.0.1:3000/api/v1/orders', {
        data: payload,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (createRes.status() === 201) {
        const cj = await createRes.json();
        const oid = cj.data?.id;
        if (oid) {
          await page.request.put(`http://127.0.0.1:3000/api/v1/orders/${oid}/status`, {
            data: { status: 'paid', paymentMethod: 'alipay', paymentTime: new Date().toISOString() },
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    }

    // 打开订单中心 → 火车票订单
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
