import { test, expect } from '@playwright/test';

const username = 'newuser';
const password = 'mypassword';

test.describe('用户认证', () => {
  test('注册流程', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '注册' }).click();

    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.fill('#confirmPassword', password);
    await page.fill('#realName', '测试用户');
    await page.selectOption('#idType', { label: '中国居民身份证' });
    await page.fill('#idNumber', '11010519491231002X');
    await page.fill('#phoneNumber', '13812341234');
    await page.fill('#email', 'newuser@example.com');
    await page.locator('label.agreement-label').click({ force: true });

    await page.locator('button.next-btn').click();
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await expect(page.getByRole('heading', { name: '手机验证' })).toBeVisible();
    await page.fill('input[name="phoneVerificationCode"]', '123456');
    await page.locator('button.submit-btn').click();

    await expect(page).toHaveURL(/\/profile$/);
  });

  test('账号密码登录', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', username);
    await page.fill('#password', password);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('button.login-button').click();
    await expect(page).toHaveURL(/\/profile$/);
  });
});
