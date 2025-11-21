const request = require('supertest');
const app = require('../src/app');
const { testConnection, syncDatabase, sequelize, Train, TrainSeat } = require('../src/models');

describe('allocateSeatsForGroup via createOrder', () => {
  let token;
  const trainNumber = 'G101';
  const seatType = '二等座';
  const date = '2025-12-15';

  beforeAll(async () => {
    await testConnection();
    await syncDatabase(true);
    await Train.findOrCreate({
      where: { trainNumber },
      defaults: { trainNumber, trainType: 'G', fromStation: '北京南', toStation: '上海虹桥', departureTime: '08:00', arrivalTime: '13:28', duration: '5小时28分', distance: 1318, status: 'active' }
    });
    await TrainSeat.findOrCreate({
      where: { trainNumber, date, seatType },
      defaults: { totalSeats: 200, availableSeats: 200, price: 553 }
    });

    const reg = await request(app).post('/api/v1/auth/register').send({
      username: 'seatuser_' + Date.now(), password: 'mypassword', confirmPassword: 'mypassword',
      idType: '1', realName: '座位用户', idNumber: '110105199001012345', phoneNumber: '13812345670', passengerType: '1'
    });
    const login = await request(app).post('/api/v1/auth/login').send({ username: reg.body.data.user.username, password: 'mypassword' });
    token = login.body?.data?.token;
  });

  afterAll(async () => { await sequelize.close(); });

  const createGroupOrder = async (count, prefsLetters = []) => {
    const passengers = Array.from({ length: count }, (_, i) => ({ id: `p${i+1}`, name: `U${i+1}`, idCard: `1101051990010123${10+i}`, phone: `1380000000${i}`, passengerType: '成人' }));
    const ticketInfos = passengers.map(p => ({ passengerId: p.id, passengerName: p.name, seatType, ticketType: '成人票', price: 553 }));
    const payload = {
      trainInfo: { trainNumber, from: '北京南', to: '上海虹桥', departureTime: '08:00', arrivalTime: '13:28', date, duration: '5小时28分' },
      passengers,
      ticketInfos,
      totalPrice: 553 * count,
      selectedSeats: prefsLetters
    };
    const res = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
    const assigned = (res.body?.data?.order?.passengers || []).map(x => x.seatNumber);
    return assigned;
  };

  test('优先同排相邻，满足偏好字母', async () => {
    const seats = await createGroupOrder(3, ['E','E','E']);
    expect(seats.length).toBe(3);
    const carRow = seats.map(s => s.split('车')[0] + '车' + s.split('车')[1].replace(/[A-E]/,'')).map(x => x); // same car+row
    expect(new Set(carRow).size).toBe(1);
    expect(seats.every(s => /[A-E]$/.test(s))).toBe(true);
  });

  test('同车厢相邻排分配（同排不足时）', async () => {
    // 预占用一排四个座位，使同排不足
    await createGroupOrder(4, ['A','B','C','D']);
    const seats = await createGroupOrder(3, ['E','E','E']);
    const cars = seats.map(s => s.split('车')[0]);
    expect(new Set(cars).size).toBe(1);
  });

  test('跨车厢分配（同车厢不足时）', async () => {
    // 模拟大量占用，同车厢不足
    for (let i=0;i<8;i++) {
      await createGroupOrder(16, []);
    }
    const seats = await createGroupOrder(5, []);
    expect(seats.length).toBe(5);
  });
});