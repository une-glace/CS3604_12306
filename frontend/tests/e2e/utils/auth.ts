import type { Page } from '@playwright/test';

// 说明：与前端注册校验保持一致，默认密码需包含两类字符
export async function ensureLogin(page: Page, username = 'newuser', password = 'my_password1'): Promise<void> {
  const apiLogin = async (): Promise<{ token: string; user: any } | null> => {
    // Try login first
    // Use relative URL to leverage Playwright's baseURL and Vite proxy
    const resp = await page.request.post('/api/v1/auth/login', {
      data: { username, password }
    });
    if (resp.status() === 200) {
      const j = await resp.json();
      if (j.data?.token && j.data?.user) {
        return { token: j.data.token, user: j.data.user };
      }
    }

    // If login fails, try register flow
    // 1. Send code
    const send = await page.request.post('/api/v1/auth/send-code', { data: { countryCode: '+86', phoneNumber: '13812341234' } });
    const code = send.status() === 200 ? (await send.json()).code : '000000';
    
    // 2. Verify code
    await page.request.post('/api/v1/auth/verify-code', { data: { countryCode: '+86', phoneNumber: '13812341234', code } });
    
    // 3. Register
    const reg = await page.request.post('/api/v1/auth/register', {
      data: { username, password, confirmPassword: password, realName: '测试用户', idType: '1', idNumber: '11010519491231002X', email: 'newuser@example.com', phoneNumber: '13812341234', countryCode: '+86', passengerType: '1' }
    });
    
    if (reg.status() === 201 || reg.status() === 200) {
      const rj = await reg.json();
      if (rj.data?.token && rj.data?.user) {
        return { token: rj.data.token, user: rj.data.user };
      }
    }

    // If register failed (likely user exists), try login again
    const resp2 = await page.request.post('/api/v1/auth/login', { data: { username, password } });
    if (resp2.status() === 200) {
      const j2 = await resp2.json();
      if (j2.data?.token && j2.data?.user) {
        return { token: j2.data.token, user: j2.data.user };
      }
    }
    
    return null;
  };

  // 优先使用接口登录，提升稳定性；若失败再尝试UI登录
  let result = await apiLogin();
  
  if (!result) {
    await page.goto('/login');
    await page.fill('#username', username);
    await page.fill('#password', password);
    try {
      await Promise.all([
        page.waitForEvent('dialog', { timeout: 8000 }).then(d => d.accept().catch(() => {})).catch(() => {}),
        page.locator('button.login-button').click()
      ]);
    } catch {
      await page.waitForTimeout(10);
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // If UI login succeeded, we might be at /profile
    if (/\/profile$/.test(page.url())) {
       return; 
    }
    
    // If not, try API one last time
    result = await apiLogin();
  }

  if (result) {
    // Ensure we are on the app's origin
    if (page.url() === 'about:blank') {
      await page.goto('/');
    }
    await page.evaluate((data) => {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }, result);
    
    // Navigate to profile
    await page.goto('/profile');
    // await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
  } else {
    // Fallback: try navigating to profile
    await page.goto('/profile');
  }
  
  // Wait for profile page to be visible
  await page.locator('.profile-page').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
}
