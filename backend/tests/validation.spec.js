const {
  validateUsername,
  validatePassword,
  validateRealName,
  validateIdNumber,
  validatePhoneNumber,
  validateEmail,
  validateRegisterData,
  validatePassengerData
} = require('../src/utils/validation');

describe('utils/validation', () => {
  describe('validateUsername', () => {
    test('valid username', () => {
      expect(validateUsername('Alice_123').isValid).toBe(true);
    });
    test('too short', () => {
      const r = validateUsername('Abc');
      expect(r.isValid).toBe(false);
      expect(r.message).toContain('长度');
    });
    test('invalid pattern', () => {
      const r = validateUsername('1Start');
      expect(r.isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('valid password', () => {
      expect(validatePassword('secret12').isValid).toBe(true);
    });
    test('too short', () => {
      expect(validatePassword('123').isValid).toBe(false);
    });
  });

  describe('validateRealName', () => {
    test('valid chinese name', () => {
      expect(validateRealName('张三').isValid).toBe(true);
    });
    test('invalid chars', () => {
      expect(validateRealName('John').isValid).toBe(false);
    });
  });

  describe('validateIdNumber', () => {
    test('valid CN ID', () => {
      expect(validateIdNumber('11010519491231002X', '1').isValid).toBe(true);
    });
    test('invalid CN ID checksum', () => {
      expect(validateIdNumber('110105194912310021', '1').isValid).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    test('valid CN mobile', () => {
      expect(validatePhoneNumber('13812345678').isValid).toBe(true);
    });
    test('valid E164', () => {
      expect(validatePhoneNumber('+14155552671').isValid).toBe(true);
    });
    test('invalid phone', () => {
      expect(validatePhoneNumber('00123').isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('valid email', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
    });
    test('invalid email', () => {
      expect(validateEmail('bad@@example').isValid).toBe(false);
    });
  });

  describe('validateRegisterData', () => {
    const base = {
      username: 'Alice_123',
      password: 'secret12',
      confirmPassword: 'secret12',
      realName: '张三',
      idNumber: '11010519491231002X',
      phoneNumber: '13812345678',
      email: 'user@example.com',
      idType: '1'
    };
    test('production mode strict validation passes', () => {
      const old = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const r = validateRegisterData(base);
      process.env.NODE_ENV = old;
      expect(r.isValid).toBe(true);
    });
    test('mismatched passwords fails', () => {
      const old = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const r = validateRegisterData({ ...base, confirmPassword: 'oops' });
      process.env.NODE_ENV = old;
      expect(r.isValid).toBe(false);
      expect(r.errors.confirmPassword).toBeTruthy();
    });
  });

  describe('validatePassengerData', () => {
    const base = { name: '张三', idCard: '11010519491231002X', phone: '13812345678', passengerType: '成人' };
    test('production mode strict validation passes', () => {
      const old = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const r = validatePassengerData(base);
      process.env.NODE_ENV = old;
      expect(r.isValid).toBe(true);
    });
    test('invalid id card fails', () => {
      const old = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const r = validatePassengerData({ ...base, idCard: 'BAD' });
      process.env.NODE_ENV = old;
      expect(r.isValid).toBe(false);
    });
  });
});