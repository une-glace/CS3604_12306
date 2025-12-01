import type { Page } from '@playwright/test';

export async function ensureLogin(page: Page, username = 'newuser', password = 'mypassword'): Promise<void> {
  const apiEnsure = async (): Promise<string | null> => {
    try {
      const resp = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', { data: { username, password } });
      if (resp.status() === 200) {
        const j = await resp.json();
        return j.data?.token || null;
      }
    } catch {}
    let code = '000000';
    try {
      const send = await page.request.post('http://127.0.0.1:3000/api/v1/auth/send-code', { data: { countryCode: '+86', phoneNumber: '13812341234' } });
      if (send.status() === 200) {
        const sj = await send.json();
        code = sj?.code || code;
      }
    } catch {}
    try {
      await page.request.post('http://127.0.0.1:3000/api/v1/auth/verify-code', { data: { countryCode: '+86', phoneNumber: '13812341234', code } });
    } catch {}
    try {
      const reg = await page.request.post('http://127.0.0.1:3000/api/v1/auth/register', { data: { username, password, confirmPassword: password, realName: '测试用户', idType: '1', idNumber: '11010519491231002X', email: 'newuser@example.com', phoneNumber: '13812341234', countryCode: '+86', passengerType: '1' } });
      if (reg.status() === 201 || reg.status() === 200) {
        const rj = await reg.json();
        return rj.data?.token || null;
      }
    } catch {}
    try {
      const resp2 = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', { data: { username, password } });
      if (resp2.status() === 200) {
        const j2 = await resp2.json();
        return j2.data?.token || null;
      }
    } catch {}
    return null;
  };

  let token = await apiEnsure();
  if (!token) {
    await page.waitForLoadState('networkidle').catch(() => {});
    token = await apiEnsure();
  }
  if (token) {
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('authToken', t as string), token);
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.locator('.profile-page').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  } else {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.locator('.profile-page').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  }
}
