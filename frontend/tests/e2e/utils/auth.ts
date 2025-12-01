import type { Page } from '@playwright/test';

export async function ensureLogin(page: Page, username = 'newuser', password = 'mypassword'): Promise<void> {
  const apiLogin = async (): Promise<string | null> => {
    const resp = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username, password }
    });
    if (resp.status() === 200) {
      const j = await resp.json();
      return j.data?.token || null;
    }
    const send = await page.request.post('http://127.0.0.1:3000/api/v1/auth/send-code', { data: { countryCode: '+86', phoneNumber: '13812341234' } });
    const code = send.status() === 200 ? (await send.json()).code : '000000';
    await page.request.post('http://127.0.0.1:3000/api/v1/auth/verify-code', { data: { countryCode: '+86', phoneNumber: '13812341234', code } });
    const reg = await page.request.post('http://127.0.0.1:3000/api/v1/auth/register', {
      data: { username, password, confirmPassword: password, realName: '测试用户', idType: '1', idNumber: '11010519491231002X', email: 'newuser@example.com', phoneNumber: '13812341234', countryCode: '+86', passengerType: '1' }
    });
    if (reg.status() === 201 || reg.status() === 200) {
      const rj = await reg.json();
      return rj.data?.token || null;
    }
    const resp2 = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', { data: { username, password } });
    if (resp2.status() === 200) {
      const j2 = await resp2.json();
      return j2.data?.token || null;
    }
    return null;
  };

  await page.goto('/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  try {
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 8000 }).then(d => d.accept()),
      page.locator('button.login-button').click()
    ]);
  } catch {
    await page.waitForTimeout(10);
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  if (!/\/profile$/.test(page.url())) {
    let token = await apiLogin();
    if (!token) {
      await page.waitForLoadState('networkidle').catch(() => {});
      token = await apiLogin();
    }
    if (token) {
      await page.evaluate((t) => localStorage.setItem('authToken', t as string), token);
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.locator('.profile-page').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    }
  }
}
