const request = require('supertest');
const app = require('../src/app');
const { testConnection, syncDatabase, sequelize, Train, TrainSeat, Order } = require('../src/models');

describe('订单状态自动更新与TTL取消', () => {
  let token;

  beforeAll(async () => {
    await testConnection();
    await syncDatabase(true);
    await Train.findOrCreate({ where: { trainNumber: 'G153' }, defaults: { trainNumber: 'G153', trainType: 'G', fromStation: '北京南', toStation: '南京南', departureTime: '10:45', arrivalTime: '14:15', duration: '3小时30分', status: 'active' } });
    await TrainSeat.findOrCreate({ where: { trainNumber: 'G153', date: '2025-12-16', seatType: '二等座' }, defaults: { totalSeats: 100, availableSeats: 100, price: 443 } });
    const reg = await request(app).post('/api/v1/auth/register').send({ username: 'stateuser', password: 'mypassword', confirmPassword: 'mypassword', idType: '1', realName: '状态用户', idNumber: '110105199001019999', phoneNumber: '13812340000', passengerType: '1' });
    const login = await request(app).post('/api/v1/auth/login').send({ username: 'stateuser', password: 'mypassword' });
    token = login.body?.data?.token;
  });

  afterAll(async () => { await sequelize.close(); });

  test('已支付且已发车的订单在列表中自动变为完成', async () => {
    const payload = {
      trainInfo: { trainNumber: 'G153', from: '北京南', to: '南京南', departureTime: '10:45', arrivalTime: '14:15', date: '2025-12-16', duration: '3小时30分' },
      passengers: [{ id: 'p1', name: '状态用户', idCard: '110105199001019999', phone: '13812340000', passengerType: '成人' }],
      ticketInfos: [{ passengerId: 'p1', passengerName: '状态用户', seatType: '二等座', ticketType: '成人票', price: 443 }],
      totalPrice: 443,
      selectedSeats: []
    };
    const createRes = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send(payload);
    const id = createRes.body?.data?.id;
    await request(app).put(`/api/v1/orders/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'paid', paymentMethod: 'alipay', paymentTime: '2025-12-16T08:00:00Z' });
    await Order.update({ departureDate: '2000-01-01', departureTime: '00:00' }, { where: { id } });
    const listRes = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`).query({ status: 'paid' });
    const after = listRes.body?.data?.orders || [];
    expect(after.some(o => o.id === id && o.status === 'completed')).toBe(true);
  });

  test('未支付订单超过TTL自动取消并回补座位', async () => {
    process.env.ORDER_UNPAID_TTL_MS = '1';
    const payload = {
      trainInfo: { trainNumber: 'G153', from: '北京南', to: '南京南', departureTime: '10:45', arrivalTime: '14:15', date: '2025-12-16', duration: '3小时30分' },
      passengers: [{ id: 'p1', name: '状态用户', idCard: '110105199001019999', phone: '13812340000', passengerType: '成人' }],
      ticketInfos: [{ passengerId: 'p1', passengerName: '状态用户', seatType: '二等座', ticketType: '成人票', price: 443 }],
      totalPrice: 443,
      selectedSeats: []
    };
    const beforeSeat = await TrainSeat.findOne({ where: { trainNumber: 'G153', date: '2025-12-16', seatType: '二等座' } });
    const createRes = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send(payload);
    const id = createRes.body?.data?.id;
    await Order.update({ createdAt: new Date(Date.now() - 60000 * 60) }, { where: { id } });
    await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`).query({ status: 'unpaid' });
    const afterSeat = await TrainSeat.findOne({ where: { trainNumber: 'G153', date: '2025-12-16', seatType: '二等座' } });
    expect(afterSeat.availableSeats).toBe(beforeSeat.availableSeats);
    const list = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`).query({ status: 'cancelled' });
    expect((list.body?.data?.orders || []).some(o => o.id === id)).toBe(true);
  });
});