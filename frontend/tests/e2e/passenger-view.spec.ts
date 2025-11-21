// filepath: frontend/tests/e2e/passenger-view.spec.ts
import { test, expect } from '@playwright/test';

test.describe('常用乘车人-查看', () => {
  test('鉴于用户已登录；当进入乘车人管理；那么默认乘客显示在列表中；并且至少一条记录', async ({ page }) => {
    const login = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username: 'newuser', password: 'mypassword' }
    });
    let token: string | null = null;
    if (login.status() === 200) {
      const lj = await login.json();
      token = lj.data?.token || null;
    } else {
      const reg = await page.request.post('http://127.0.0.1:3000/api/v1/auth/register', {
        data: {
          username: 'newuser',
          password: 'mypassword',
          confirmPassword: 'mypassword',
          realName: '测试用户',
          idType: '1',
          idNumber: '11010519491231002X',
          phoneNumber: '13812341234',
          email: 'newuser@example.com',
          passengerType: '成人',
          countryCode: '+86'
        }
      });
      if (reg.status() === 201) {
        const rj = await reg.json();
        token = rj.data?.token || null;
      }
    }
    expect(token).toBeTruthy();

    await page.goto('/');
    await page.evaluate(t => localStorage.setItem('authToken', t), token as string);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByRole('button', { name: '乘车人' }).click();
    await expect(page.getByRole('heading', { name: '乘车人管理' })).toBeVisible();

    const rows = page.locator('.passenger-table .table-row');
    await expect(rows.first().or(page.locator('.passenger-table .empty-state'))).toBeVisible({ timeout: 20000 });
    const texts = await rows.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.join('\n')).toContain('测试用户');
  });
});