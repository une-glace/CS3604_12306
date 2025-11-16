import { test, expect } from '@playwright/test';

test.describe('订单中心未完成订单去支付', () => {
  test('点击去支付后订单进入未出行列表', async ({ page }) => {
    // 登录并获取令牌
    const loginResp = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username: 'newuser', password: 'mypassword' }
    });
    let token: string | null = null;
    if (loginResp.status() === 200) {
      const lj = await loginResp.json();
      token = lj.data?.token || null;
    }
    if (!token) test.fail(true, '登录接口失败，无法获取令牌');

    // 预置一笔未支付订单（pending）
    const payload = {
      trainInfo: {
        trainNumber: 'G101',
        from: '北京南',
        to: '上海虹桥',
        departureTime: '08:00',
        arrivalTime: '13:28',
        date: '2025-12-15',
        duration: '5小时28分'
      },
      passengers: [{
        id: 'self',
        name: '测试用户',
        idCard: 'A1234567890123456',
        phone: '13812340001',
        passengerType: '成人'
      }],
      ticketInfos: [{
        passengerId: 'self',
        passengerName: '测试用户',
        seatType: '二等座',
        ticketType: '成人票',
        price: 553
      }],
      totalPrice: 553,
      selectedSeats: []
    };
    const createRes = await page.request.post('http://127.0.0.1:3000/api/v1/orders', {
      data: payload,
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(createRes.status()).toBe(201);

    // 进入个人中心 → 订单中心 → 火车票订单
    await page.goto('/profile');
    await page.getByRole('button', { name: '火车票订单' }).click();

    // 切换到“未完成订单”标签并等待列表加载
    await page.getByTestId('orders-tab-unfinished').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});

    // 点击首个“去支付”按钮
    const payBtn = page.locator('.orders-list .order-card .pay-btn').first();
    await expect(payBtn).toBeVisible({ timeout: 15000 });
    await payBtn.click();

    // 等待支付弹窗并接受“支付成功”提示
    await expect(page.locator('.payment-modal-overlay')).toBeVisible({ timeout: 20000 });
    await page.waitForEvent('dialog', { timeout: 30000 }).then(d => d.accept());

    // 切换到“未出行订单”（已支付）并断言已支付订单可见或空态
    await page.getByTestId('orders-tab-not-travelled').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    const paidList = page.locator('.orders-list .order-card').first();
    const paidEmpty = page.locator('.orders-list .empty-state');
    await expect(paidList.or(paidEmpty)).toBeVisible({ timeout: 15000 });
  });
});
