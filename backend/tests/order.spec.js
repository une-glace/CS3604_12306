const request = require('supertest');
const { app, start, sequelize } = require('../src/app');
const { seedData } = require('../src/scripts/seedData');

let server;
let token;

jest.setTimeout(60000);

beforeAll(async () => {
  // 启动服务器（会自动同步数据库）
  server = await start(0, { forceSync: true, seedData: false });
  // 植入基础数据（如车次）
  await seedData();

  // 在干净的数据库中注册并登录用户以获取 token
  const username = 'orderuser_' + Date.now();
  const password = 'mypassword';
  const reg = await request(server).post('/api/v1/auth/register').send({
    username,
    password,
    confirmPassword: password,
    idType: '2',
    realName: '订单用户',
    idNumber: 'B1234567890123456',
    phoneNumber: '13812340002',
    passengerType: '1'
  });
  // 确保注册成功
  if (reg.status !== 201) {
    throw new Error('Failed to register user in beforeAll hook');
  }
  token = reg.body.data.token;
});

afterAll(async () => {
  // 关闭服务器和数据库连接
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (sequelize) {
    await sequelize.close();
  }
});

describe('Order API', () => {
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

    const createRes = await request(server)
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
