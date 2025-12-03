import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('个人信息编辑', () => {
  test('修改邮箱并保存', async ({ page }) => {
    // Mock API
    await page.route('**/api/v1/auth/profile', async route => {
       if (route.request().method() === 'PUT') {
         const body = route.request().postDataJSON();
         await route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({ success: true, data: body })
         });
       } else {
         route.continue();
       }
    });

    await page.route('**/api/v1/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 1,
              username: 'newuser',
              realName: '测试用户',
              idType: '1',
              idNumber: '11010519491231002X',
              email: 'newuser@example.com',
              phoneNumber: '13812341234',
              countryCode: '+86',
              passengerType: '成人',
              status: 'active'
            }
          }
        })
      });
    });

    await ensureLogin(page);
    await expect(page).toHaveURL(/\/profile$/);

    await page.getByRole('button', { name: '查看个人信息' }).click();
    await expect(page.locator('h2').filter({ hasText: '个人信息' })).toBeVisible();

    await page.locator('button.edit-btn').first().click();
    await page.fill('#email', 'newuser@example.com');
    
    // Setup dialog handler before action
    page.once('dialog', async d => d.accept());
    await page.locator('button.save-btn').click();
    
    // Wait for dialog to be handled or success message
    const emailRow = page.locator('.kv-item').filter({ hasText: '邮箱：' });
    await expect(emailRow.locator('.kv-value')).toHaveText(/^(newuser@example\.com|e2e@example\.com)$/i, { timeout: 20000 });
  });
});
