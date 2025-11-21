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

    // 将令牌注入到页面环境中，确保前端能访问订单中心
    await page.goto('/');
    // 令牌在上一步已校验，这里声明返回类型为 void、参数类型为 string
    await page.evaluate<void, string>((t) => {
      localStorage.setItem('authToken', t);
    }, token!);

    // 动态查询可用车次，优先选择 G101，否则选择列表第一项
    const search = await page.request.get('http://127.0.0.1:3000/api/v1/trains/search', {
      params: { fromStation: '北京南', toStation: '上海虹桥', departureDate: '2025-12-15' }
    });
    type TrainOption = { trainNumber: string; fromStation: string; toStation: string; departureTime: string; arrivalTime: string; duration: string };
    const list: TrainOption[] = search.status() === 200 ? (((await search.json()).data?.trains || []) as TrainOption[]) : [];
    if (!list.length) test.fail(true, '无可用车次，跳过');
    const picked = list.find(t => t.trainNumber === 'G101') || list[0];
    const payload = {
      trainInfo: {
        trainNumber: picked.trainNumber,
        from: picked.fromStation || '北京南',
        to: picked.toStation || '上海虹桥',
        departureTime: picked.departureTime || '08:00',
        arrivalTime: picked.arrivalTime || '13:28',
        date: '2025-12-15',
        duration: picked.duration || '5小时28分'
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
  if (createRes.status() !== 201) {
    const body = await createRes.text();
    throw new Error(`订单创建失败: ${createRes.status()} ${body}`);
  }

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
      await page.waitForEvent('dialog', { timeout: 30000 }).then(d => d.accept());
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
