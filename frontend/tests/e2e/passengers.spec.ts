import { test, expect } from '@playwright/test';

test.describe('常用乘车人管理', () => {
  test.beforeEach(async ({ page }) => {
    // 自动接受所有弹窗（alert/confirm），避免阻塞用例执行
    page.on('dialog', d => d.accept());
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'mypassword');
    await page.locator('button.login-button').click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('添加两名乘车人并删除其中一名', async ({ page }) => {
    await page.getByRole('button', { name: '乘车人' }).click();
    await expect(page.getByRole('heading', { name: '乘车人管理' })).toBeVisible();

    // 生成唯一身份证号（18位），保持格式合法：地区码+生日+顺序码+校验位
    const idBase14 = '11010519491231'; // 14位：地区+生日
    const seq1 = String(Math.floor(Math.random() * 90 + 10)); // 两位顺序码
    const seq2 = String(Math.floor(Math.random() * 90 + 10)); // 两位顺序码

    // 添加 张三
    await page.locator('button.add-action').click();
    await page.fill('#name', '张三');
    await page.selectOption('#passengerType', { label: '成人' });
    const idZhangSan = `${idBase14}0${seq1}1`;
    await page.fill('#idCard', idZhangSan);
    await page.fill('#phone', '13812341235');
    const beforeRows = await page.locator('.passenger-table .table-row').count();
    await page.locator('button.submit-btn').click();
    await expect(async () => {
      const afterRows = await page.locator('.passenger-table .table-row').count();
      expect(afterRows).toBeGreaterThan(beforeRows);
    }).toPass();

    // 添加 李四
    await page.locator('button.add-action').click();
    await page.fill('#name', '李四');
    await page.selectOption('#passengerType', { label: '成人' });
    const idLiSi = `${idBase14}0${seq2}2`;
    await page.fill('#idCard', idLiSi);
    await page.fill('#phone', '13812341236');
    const beforeRows2 = await page.locator('.passenger-table .table-row').count();
    await page.locator('button.submit-btn').click();
    await expect(async () => {
      const afterRows2 = await page.locator('.passenger-table .table-row').count();
      expect(afterRows2).toBeGreaterThan(beforeRows2);
    }).toPass();

    // 删除最新添加的乘车人（列表末尾为最新）
    const rowsBeforeDelete = await page.locator('.passenger-table .table-row').count();
    await page.locator('.passenger-table .table-row').last().locator('button.op-btn.delete').click();
    await expect(page.locator('.passenger-table .table-row')).toHaveCount(rowsBeforeDelete - 1);
  });
});
