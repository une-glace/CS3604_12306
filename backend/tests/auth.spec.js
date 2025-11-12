const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  const username = 'testuser_' + Date.now();
  const password = 'mypassword';
  let token;

  it('registers a new user', async () => {
    const res = await request(app)
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
