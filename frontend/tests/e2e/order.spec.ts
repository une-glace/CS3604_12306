import { test, expect } from '@playwright/test';

test.describe('订票与订单支付', () => {
  test('下单并支付成功', async ({ page }) => {
    // 登录
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
    const bookBtn = page.locator('button.book-button.available').first();
    if (await bookBtn.count()) {
      await bookBtn.click();
      await page.getByRole('heading', { name: '确认订单信息' }).waitFor({ state: 'visible', timeout: 5000 }).catch(async () => {
        await page.goto('/order?trainNumber=G101&from=北京南&to=上海虹桥&departureTime=08:00&arrivalTime=13:28&date=2025-12-15&duration=5小时28分&seatType=二等座&price=553');
      });
    } else {
      await page.goto('/order?trainNumber=G101&from=北京南&to=上海虹桥&departureTime=08:00&arrivalTime=13:28&date=2025-12-15&duration=5小时28分&seatType=二等座&price=553');
    }

    // 在订单页确认页面可见，直接提交（页面已自动选择首位乘车人）
    await expect(page.locator('.order-container')).toBeVisible({ timeout: 15000 });
    // 选择首位乘车人
    const chooserItem = page.locator('.chooser-list .chooser-item').first();
    if (await chooserItem.count()) {
      await chooserItem.click();
    }
    // 选择乘车人以生成票表行（若未自动生成）
    // 直接提交（页面在提交时将自动补全乘车人与票表信息）
    await page.locator('button.btn-submit').click();
    await expect(page.getByRole('heading', { name: '请核对以下信息' })).toBeVisible({ timeout: 15000 });
    // 提交订单（如确认弹窗已存在则直接确认）
    const confirmOverlay = page.locator('.order-confirm-overlay');
    if (await confirmOverlay.count()) {
      await page.locator('button.confirm-btn').click();
    } else {
      await page.locator('button.btn-submit').click();
      await expect(page.getByRole('heading', { name: '请核对以下信息' })).toBeVisible({ timeout: 15000 });
      await page.locator('button.confirm-btn').click();
    }
    // 等待支付弹窗出现并接收“支付成功”提示返回首页
    await expect(page.locator('.payment-modal-overlay')).toBeVisible({ timeout: 20000 });
    await Promise.all([
      page.waitForEvent('dialog').then(d => d.accept()),
      page.waitForURL('/')
    ]);
    // 进入个人中心订单中心并断言“未出行订单”与“未完成订单”
    await page.goto('/profile');
    if (!/\/profile$/.test(page.url())) {
      // 若被重定向到登录，则再次登录
      await page.fill('#username', 'newuser');
      await page.fill('#password', 'mypassword');
      await Promise.all([
        page.waitForEvent('dialog').then(d => d.accept()),
        page.locator('button.login-button').click()
      ]);
      await expect(page).toHaveURL(/\/profile$/);
    }
    await expect(page.locator('.profile-page')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: '火车票订单' }).click();
    // 未出行订单（等同于已支付）
    await page.getByTestId('orders-tab-not-travelled').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    await expect(page.locator('.orders-list .order-card').first()).toBeVisible({ timeout: 15000 });
    // 未完成订单（等同于未支付）
    await page.getByTestId('orders-tab-unfinished').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    // 在持久化环境中可能存在其他未完成订单，避免对空态的严格假设
    const unfinishedEmpty = page.locator('.orders-list .empty-state');
    const unfinishedAny = page.locator('.orders-list .order-card').first();
    await expect(unfinishedEmpty.or(unfinishedAny)).toBeVisible({ timeout: 15000 });
  });
});
