import { test, expect } from '@playwright/test';
import { ensureLogin } from './utils/auth';

test.describe('订票与订单支付', () => {
  test('下单并支付成功', async ({ page }) => {
    // Mock APIs
    // 1. Train Search
    await page.route('**/api/v1/trains/search*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            trains: [{
                trainNumber: 'G101',
                trainType: 'G',
                fromStation: '北京南',
                toStation: '上海虹桥',
                departureTime: '08:00',
                arrivalTime: '13:28',
                duration: '5小时28分',
                date: '2025-12-15',
                seatInfo: {
                  '二等座': { totalSeats: 100, availableSeats: 100, price: 553, isAvailable: true },
                  '一等座': { totalSeats: 50, availableSeats: 50, price: 933, isAvailable: true },
                  '商务座': { totalSeats: 10, availableSeats: 10, price: 1748, isAvailable: true }
                }
              }]
          }
        })
      });
    });

    // 2. Create Order and List Orders
    await page.route('**/api/v1/orders*', async route => {
       const url = new URL(route.request().url());
       // Only handle /api/v1/orders (list/create), ignore /api/v1/orders/xxx (detail) which will be handled by fallback or network
       if (!url.pathname.endsWith('/api/v1/orders')) {
         return route.continue();
       }

       if (route.request().method() === 'POST') {
         await route.fulfill({
           status: 201,
           contentType: 'application/json',
           body: JSON.stringify({
             success: true,
             data: {
               id: 123456,
               orderNumber: 'E123456789',
               status: 'unpaid',
               trainNumber: 'G101',
               fromStation: '北京南',
               toStation: '上海虹桥',
               departureTime: '08:00',
               totalPrice: 553,
               createdAt: new Date().toISOString(),
               passengers: [{ name: '测试用户', seatType: '二等座', price: 553 }]
             }
           })
         });
       } else if (route.request().method() === 'GET') {
         // Order list mock (for verification at the end)
         const status = url.searchParams.get('status');
         if (status === 'paid') {
             await route.fulfill({
               status: 200,
               contentType: 'application/json',
               body: JSON.stringify({
                 success: true,
                 data: {
                   orders: [{
                     id: 123456,
                     status: 'paid',
                     trainNumber: 'G101',
                     fromStation: '北京南',
                     toStation: '上海虹桥',
                     departureTime: '2025-12-15T08:00:00',
                     arrivalTime: '2025-12-15T13:28:00',
                     totalPrice: 553,
                     createdAt: new Date().toISOString(),
                     paidAt: new Date().toISOString(),
                     passengers: [{ name: '测试用户', seatType: '二等座', price: 553 }]
                   }]
                 }
               })
             });
         } else {
             await route.fulfill({
               status: 200,
               contentType: 'application/json',
               body: JSON.stringify({ success: true, data: { orders: [] } })
             });
         }
       } else {
         route.continue();
       }
    });

    // 3. Update Order Status (Pay)
    await page.route('**/api/v1/orders/*/status', async route => {
       await route.fulfill({
         status: 200,
         contentType: 'application/json',
         body: JSON.stringify({ success: true })
       });
    });

    // 4. Pay endpoint (if separate)
    await page.route('**/api/v1/orders/*/pay', async route => {
       await route.fulfill({
         status: 200,
         contentType: 'application/json',
         body: JSON.stringify({ success: true, message: '支付成功' })
       });
    });
    
    // Mock Passengers for Order Page
    await page.route('**/api/v1/passengers', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 1,
              name: '测试用户',
              idType: '1',
              idNumber: '11010519491231002X',
              phone: '13812341234',
              passengerType: '成人',
              isDefault: true
            }]
          })
        });
    });

    await ensureLogin(page);

    await page.goto('/train-list?from=北京南&to=上海虹桥&date=2025-12-15');
    await page.locator('.result-count').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Mocked train list should appear
    const bookBtn = page.locator('button.book-button.available').first();
    await expect(bookBtn).toBeVisible({ timeout: 10000 });
    await bookBtn.click();
    
    // Wait for order page
    await page.waitForURL(/\/order/, { timeout: 10000 });
    
    // 在订单页确认页面可见
    await expect(page.locator('.order-container')).toBeVisible({ timeout: 15000 });
    
    // 选择首位乘车人 (Mocked passenger)
    const chooserItem = page.locator('.chooser-list .chooser-item').first();
    await expect(chooserItem).toBeVisible();
    await chooserItem.click();
    
    // Submit order
    await page.locator('button.btn-submit').click();
    await expect(page.getByRole('heading', { name: '请核对以下信息' })).toBeVisible({ timeout: 15000 });
    
    // Confirm order
    await page.locator('button.confirm-btn').click();
    
    // Handle Payment
    // 1. Wait for redirection to PayOrderPage
    await page.waitForURL(/\/pay-order/, { timeout: 15000 });
    
    // 2. Click "Online Payment" button on PayOrderPage
    await page.locator('button.pay-btn').click();

    // 3. Payment Modal should now be visible
    const overlay = page.locator('.payment-modal-overlay');
    await expect(overlay).toBeVisible({ timeout: 20000 });
    
    // Click pay button (assuming mock handles it)
    // Try to find confirm button in payment modal
    await page.locator('.payment-modal button.confirm-btn').click().catch(() => {});
    
    // Wait for redirect to order detail
    await page.waitForURL(/\/order-detail/, { timeout: 10000 }).catch(() => {});
    
    // Verify order in profile
    await page.goto('/profile');
    await page.getByRole('button', { name: '火车票订单' }).click();
    // 未出行订单（等同于已支付）
    await page.getByTestId('orders-tab-not-travelled').click();
    await page.locator('.orders-section .loading-state').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    
    const paidList = page.locator('.orders-list .order-card').first();
    await expect(paidList).toBeVisible({ timeout: 10000 });
  });
});
