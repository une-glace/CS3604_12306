const request = require('supertest');
const app = require('../src/app');
const { seedData } = require('../src/scripts/seedData');

describe('Train API', () => {
jest.setTimeout(60000);
beforeAll(async () => {
  await seedData();
});

  it('searches trains for 北京南->上海虹桥 on 2025-12-15', async () => {
    const res = await request(app)
      .get('/api/v1/trains/search')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departureDate: '2025-12-15' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const trains = res.body.data.trains || res.body.data || [];
    expect(trains.length).toBeGreaterThan(0);
    expect(trains.some(t => t.trainNumber === 'G101')).toBe(true);
  });
});
