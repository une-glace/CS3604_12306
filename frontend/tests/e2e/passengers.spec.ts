import { test, expect } from '@playwright/test';

test.describe('常用乘车人管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '登录' }).click();
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'mypassword');
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 20000 }).then(d => d.accept()),
      page.locator('button.login-button').click()
    ]);
    if (!/\/profile$/.test(page.url())) {
      await page.goto('/profile');
    }
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('添加两名乘车人并删除其中一名', async ({ page }) => {
    await page.getByRole('button', { name: '乘车人' }).click();
    await expect(page.getByRole('heading', { name: '乘车人管理' })).toBeVisible();

    // 生成合法的中国身份证号：前17位 + 校验位
    const weights = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
    const mapping = ['1','0','X','9','8','7','6','5','4','3','2'];
    const idBase14 = '11010519491231';
    const seq1 = String(Math.floor(Math.random() * 90 + 10));
    const seq2 = String(Math.floor(Math.random() * 90 + 10));
    const makeId = (seq: string) => {
      const id17 = `${idBase14}0${seq}`; // 17位
      const sum = id17.split('').reduce((acc, ch, i) => acc + parseInt(ch, 10) * weights[i], 0);
      const code = mapping[sum % 11];
      return id17 + code;
    };

    // 添加 张三
    await page.locator('button.add-action').click();
    await page.fill('#name', '张三');
    await page.selectOption('#passengerType', { label: '成人' });
    const idZhangSan = makeId(seq1);
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
    const idLiSi = makeId(seq2);
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
    await Promise.all([
      page.waitForEvent('dialog', { timeout: 5000 }).then(d => d.accept()),
      page.locator('.passenger-table .table-row').last().locator('button.op-btn.delete').click()
    ]);
    await expect(page.locator('.passenger-table .table-row')).toHaveCount(rowsBeforeDelete - 1);
  });
});
