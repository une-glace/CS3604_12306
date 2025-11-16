const request = require('supertest');
const app = require('../src/app');
const { seedData } = require('../src/scripts/seedData');

describe('Order API', () => {
  let token;
  beforeAll(async () => {
    // 注册并登录
    const username = 'orderuser_' + Date.now();
    const password = 'mypassword';
    const reg = await request(app).post('/api/v1/auth/register').send({
      username,
      password,
      confirmPassword: password,
      idType: '2',
      realName: '订单用户',
      idNumber: 'B1234567890123456',
      phoneNumber: '13812340002',
      passengerType: '1'
    });
    token = reg.body.data.token;
    await seedData();
  });

  it('creates order and updates status to paid', async () => {
    const payload = {
      trainInfo: {
        trainNumber: 'G101',
        from: '北京南',
        to: '上海虹桥',
        departureTime: '08:00',
        arrivalTime: '13:28',
        date: '2025-12-15',
        duration: '5小时28分'
      },
      passengers: [{
        id: 'self',
        name: '订单用户',
        idCard: 'B1234567890123456',
        phone: '13812340002',
        passengerType: '成人'
      }],
      ticketInfos: [{
        passengerId: 'self',
        passengerName: '订单用户',
        seatType: '二等座',
        ticketType: '成人票',
        price: 553
      }],
      totalPrice: 553,
      selectedSeats: []
    };

    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const orderId = createRes.body.data.id;

    const statusRes = await request(app)
      .put(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paid', paymentMethod: 'alipay', paymentTime: new Date().toISOString() });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    const found = listRes.body.data.orders.find(o => o.id === orderId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('paid');
  });
});
jest.setTimeout(60000);
