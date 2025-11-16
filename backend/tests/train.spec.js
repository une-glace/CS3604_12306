const request = require('supertest');
const { app, start, sequelize } = require('../src/app');
const { seedData } = require('../src/scripts/seedData');

let server;

// 设置更长的超时时间
jest.setTimeout(60000);

beforeAll(async () => {
  // 启动服务器（会自动同步数据库）
  server = await start(0, { forceSync: true, seedData: false });
  // 植入必要的测试数据
  await seedData();
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

describe('Train API', () => {
  it('searches trains for 北京南->上海虹桥 on 2025-12-15', async () => {
    const res = await request(server) // 使用 server
      .get('/api/v1/trains/search')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departureDate: '2025-12-15' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const trains = res.body.data.trains || res.body.data || [];
    expect(trains.length).toBeGreaterThan(0);
    expect(trains.some(t => t.trainNumber === 'G101')).toBe(true);
  });
});
