const request = require('supertest');
const app = require('../src/app');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../src/utils/auth');
const { testConnection, syncDatabase, sequelize } = require('../src/models');

describe('utils/auth + middleware', () => {
  beforeAll(async () => {
    await testConnection();
    await syncDatabase(true);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('hashPassword/comparePassword works', async () => {
    const hashed = await hashPassword('mypassword');
    expect(typeof hashed).toBe('string');
    expect(hashed).not.toBe('mypassword');
    const ok = await comparePassword('mypassword', hashed);
    const bad = await comparePassword('wrong', hashed);
    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });

  test('generateToken/verifyToken success', () => {
    const t = generateToken({ id: 123, username: 'alice' });
    const decoded = verifyToken(t);
    expect(decoded.id).toBe(123);
    expect(decoded.username).toBe('alice');
  });

  test('verifyToken invalid', () => {
    expect(() => verifyToken('not-a-token')).toThrow('Token无效');
  });

  test('verifyToken expired', async () => {
    const old = process.env.JWT_EXPIRES_IN;
    process.env.JWT_EXPIRES_IN = '1ms';
    const t = generateToken({ id: 1, username: 'exp' });
    await new Promise(r => setTimeout(r, 10));
    expect(() => verifyToken(t)).toThrow('Token已过期');
    process.env.JWT_EXPIRES_IN = old;
  });

  test('authenticateToken middleware: 401 on missing, 403 on invalid, 200 on valid', async () => {
    const noToken = await request(app).get('/api/v1/passengers');
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', 'Bearer not-a-token');
    expect(badToken.status).toBe(403);

    const token = generateToken({ id: 999, username: 'tester' });
    const ok = await request(app)
      .get('/api/v1/passengers')
      .set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    const data = ok.body?.data || [];
    expect(Array.isArray(data)).toBe(true);
  });
});