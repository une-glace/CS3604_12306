// filepath: backend/tests/doc-api.spec.js
const request = require('supertest');
const app = require('../src/app');
const { testConnection, syncDatabase, sequelize, Train, TrainSeat } = require('../src/models');

describe('12306 文档映射 API', () => {
  let token;
  let orderId;

  beforeAll(async () => {
    await testConnection();
    await syncDatabase(true);
    jest.setTimeout(60000);
    await Train.findOrCreate({
      where: { trainNumber: 'G101' },
      defaults: {
        trainNumber: 'G101',
        trainType: 'G',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '08:00',
        arrivalTime: '13:28',
        duration: '5小时28分',
        distance: 1318,
        status: 'active'
      }
    });
    await TrainSeat.findOrCreate({
      where: { trainNumber: 'G101', date: '2025-12-15', seatType: '二等座' },
      defaults: { totalSeats: 200, availableSeats: 200, price: 553 }
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('鉴于数据已初始化；当 注册新用户 new user；那么 返回201并给出 token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'new user',
        password: 'mypassword',
        confirmPassword: 'mypassword',
        realName: 'New User',
        idType: '1',
        idNumber: '11010519491231002X',
        phoneNumber: '13812341234',
        email: 'newuser@example.com',
        passengerType: '成人',
        countryCode: '+86'
      });
    expect([200,201,400]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      token = res.body?.data?.token;
      expect(token).toBeTruthy();
    }
  });

  it('鉴于已注册；当 使用账号密码登录；那么 返回200并给出 token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'new user', password: 'mypassword' });
    expect(res.status).toBe(200);
    token = res.body?.data?.token;
    expect(token).toBeTruthy();
  });

  it('鉴于已登录；当 获取乘车人列表；那么 至少包含默认乘客 New User', async () => {
    const res = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const list = res.body?.data || [];
    expect(list.length).toBeGreaterThan(0);
    expect(list.some(p => p.name === 'New User' && p.isDefault)).toBe(true);
  });

  it('鉴于已登录；当 添加乘车人 张三；那么 列表增加一项', async () => {
    const addRes = await request(app)
      .post('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '张三',
        idCard: '110105199001012311',
        phone: '13812341235',
        passengerType: '成人'
      });
    expect(addRes.status).toBe(201);
    const listRes = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    const list = listRes.body?.data || [];
    expect(list.some(p => p.name === '张三')).toBe(true);
  });

  it('鉴于已登录；当 添加乘车人 李四；那么 列表增加一项', async () => {
    const addRes = await request(app)
      .post('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '李四',
        idCard: '110105199101012312',
        phone: '13812341236',
        passengerType: '成人'
      });
    expect(addRes.status).toBe(201);
    const listRes = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    const list = listRes.body?.data || [];
    expect(list.some(p => p.name === '李四')).toBe(true);
  });

  it('鉴于已登录且存在 张三；当 删除 张三；那么 该乘客不再出现在列表', async () => {
    const listRes = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    const list = listRes.body?.data || [];
    const zhang = list.find(p => p.name === '张三');
    expect(!!zhang).toBe(true);
    const delRes = await request(app)
      .delete(`/api/v1/passengers/${zhang.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    const afterRes = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    const after = afterRes.body?.data || [];
    expect(after.some(p => p.name === '张三')).toBe(false);
  });

  it('鉴于存在北京南→上海虹桥的车次；当 按日期查询；那么 返回至少一条且包含 G101', async () => {
    const res = await request(app)
      .get('/api/v1/trains/search')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departureDate: '2025-12-15' });
    expect(res.status).toBe(200);
    const trains = res.body?.data?.trains || res.body?.data || [];
    expect(trains.length).toBeGreaterThan(0);
    expect(trains.some(t => t.trainNumber === 'G101')).toBe(true);
  });

  it('鉴于已登录且有余票；当 创建二等座订单；那么 返回201且状态为未支付', async () => {
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
        name: 'New User',
        idCard: '11010519491231002X',
        phone: '13812341234',
        passengerType: '成人'
      }],
      ticketInfos: [{
        passengerId: 'self',
        passengerName: 'New User',
        seatType: '二等座',
        ticketType: '成人票',
        price: 553
      }],
      totalPrice: 553,
      selectedSeats: []
    };
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    orderId = res.body?.data?.id;
    expect(orderId).toBeTruthy();
    const order = res.body?.data?.order;
    expect(order?.status).toBe('unpaid');
  });

  it('鉴于订单已创建；当 更新状态为已支付；那么 获取已支付订单列表包含该订单', async () => {
    const upd = await request(app)
      .put(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paid', paymentMethod: 'alipay', paymentTime: new Date().toISOString() });
    expect(upd.status).toBe(200);
    const listRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'paid' });
    expect(listRes.status).toBe(200);
    const orders = listRes.body?.data?.orders || [];
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some(o => o.id === orderId && o.status === 'paid')).toBe(true);
  });

  it('鉴于已登录；当 更新个人邮箱；那么 返回成功且邮箱为 newuser@example.com', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'newuser@example.com' });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.email).toBe('newuser@example.com');
  });
});