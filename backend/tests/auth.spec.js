const request = require('supertest');
const { app, start, sequelize } = require('../src/app');

// 定义一个变量来持有服务器实例
let server;

// 在所有测试开始前执行
beforeAll(async () => {
  // 启动服务器（会自动同步数据库）
  server = await start(0, { forceSync: true, seedData: false });
});

// 在所有测试结束后执行
afterAll(async () => {
  // 关闭服务器，释放端口
  if (server && server.close) {
    await new Promise((resolve) => server.close(resolve));
  }
  
  // 关闭数据库连接，确保 Jest 能干净退出
  if (sequelize) {
    await sequelize.close();
  }
});

describe('Auth API', () => {
  const username = 'testuser_' + Date.now();
  const password = 'mypassword';
  let token;

  it('registers a new user', async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({
        username,
        password,
        confirmPassword: password,
      idType: '2',
      realName: '测试用户',
      idNumber: 'A1234567890123456',
      email: 'test@example.com',
      phoneNumber: '13812340001',
        passengerType: '1'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    token = res.body.data.token;
  });

  it('logs in the user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    token = res.body.data.token;
  });

  it('gets current user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(username);
  });

  it('updates email', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'updated@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.body.data.user.email).toBe('updated@example.com');
  });
});
