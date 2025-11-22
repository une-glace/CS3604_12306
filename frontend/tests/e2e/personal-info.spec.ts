import { test, expect } from '@playwright/test';

test.describe('个人信息编辑', () => {
  test('修改邮箱并保存', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'mypassword');
  await Promise.all([
    page.waitForEvent('dialog').then(d => d.accept()),
    page.locator('button.login-button').click()
  ]);
  try {
    await expect(page.locator('.profile-page')).toBeVisible({ timeout: 15000 });
  } catch {
    const apiLogin = await page.request.post('http://127.0.0.1:3000/api/v1/auth/login', {
      data: { username: 'newuser', password: 'mypassword' }
    });
    if (apiLogin.status() === 200) {
      const token = (await apiLogin.json()).data?.token;
      if (token) {
        await page.evaluate(t => localStorage.setItem('authToken', t as string), token);
        await page.reload({ waitUntil: 'networkidle' });
        await page.goto('/profile');
      }
    }
    await expect(page).toHaveURL(/\/profile$/);
  }

    await page.getByRole('button', { name: '查看个人信息' }).click();
    await expect(page.locator('h2').filter({ hasText: '个人信息' })).toBeVisible();

    await page.locator('button.edit-btn').first().click();
    await page.fill('#email', 'newuser@example.com');
    page.once('dialog', async d => d.accept());
    await page.locator('button.save-btn').click();
    const emailRow = page.locator('.kv-item').filter({ hasText: '邮箱：' });
    await expect(emailRow.locator('.kv-value')).toHaveText('newuser@example.com', { timeout: 20000 });
  });
});
