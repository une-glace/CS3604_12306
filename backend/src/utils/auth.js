const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 密码加密
const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('密码加密失败');
  }
};

// 密码验证
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('密码验证失败');
  }
};

// 生成JWT token
const generateToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: '12306-replica'
      }
    );
  } catch (error) {
    throw new Error('Token生成失败');
  }
};

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token无效');
    } else {
      throw new Error('Token验证失败');
    }
  }
};

// JWT中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('认证请求:', {
    url: req.url,
    method: req.method,
    authHeader: authHeader ? 'Bearer ***' : '无',
    hasToken: !!token
  });

  if (!token) {
    console.log('认证失败: 缺少token');
    return res.status(401).json({
      success: false,
      message: '访问被拒绝，需要提供Token'
    });
  }

  try {
    const decoded = verifyToken(token);
    console.log('Token验证成功:', { userId: decoded.id, username: decoded.username });
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token验证失败:', error.message);
    return res.status(403).json({
      success: false,
      message: error.message
    });
  }
};

// 可选的JWT中间件（不强制要求token）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // 忽略token错误，继续执行
    }
  }
  
  next();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth
};