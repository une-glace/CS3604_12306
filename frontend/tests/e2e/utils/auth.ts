import type { Page } from '@playwright/test';

export async function ensureLogin(page: Page, username = 'newuser', password = 'mypassword'): Promise<void> {
  await page.goto('/profile');
  if (/\/profile$/.test(page.url())) return;
  const uiLogin = async () => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: '登录' });
    if (await loginBtn.count()) await loginBtn.click();
    await page.fill('#username', username);
    await page.fill('#password', password);
    try {
      await Promise.all([
        page.waitForEvent('dialog', { timeout: 8000 }).then(d => d.accept()),
        page.locator('button.login-button').click()
      ]);
    } catch {}
  };
  await uiLogin();
  if (!/\/profile$/.test(page.url())) {
    const loginApi = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username, password }
    });
    let token: string | null = null;
    if (loginApi.status() === 200) {
      token = (await loginApi.json()).data?.token || null;
    } else {
      const send = await page.request.post('http://127.0.0.1:3000/api/v1/auth/send-code', { data: { countryCode: '+86', phoneNumber: '13812341234' } });
      const code = send.status() === 200 ? (await send.json()).code : '000000';
      await page.request.post('http://127.0.0.1:3000/api/v1/auth/verify-code', { data: { countryCode: '+86', phoneNumber: '13812341234', code } });
      const reg = await page.request.post('http://127.0.0.1:3000/api/v1/auth/register', {
        data: { username, password, confirmPassword: password, realName: '测试用户', idType: '1', idNumber: '11010519491231002X', email: 'newuser@example.com', phoneNumber: '13812341234', countryCode: '+86', passengerType: '1' }
      });
      if (reg.status() === 201 || reg.status() === 200) {
        token = (await reg.json()).data?.token || null;
      }
    }
    if (token) {
      await page.goto('/');
      await page.evaluate((t) => localStorage.setItem('authToken', t as string), token);
      await page.goto('/profile');
      try {
        await page.waitForURL(/\/profile$/, { timeout: 5000 });
      } catch {
        await page.reload();
        await page.goto('/profile');
      }
    }
  }
}