const express = require('express');
const { register, login, getCurrentUser, updateProfile, sendVerificationCode, verifyVerificationCode, forgotValidate, resetPassword, checkUsername } = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, getCurrentUser);

// 检查用户名是否可用
router.get('/check-username', checkUsername);

// 更新个人信息（需要认证）
router.put('/profile', authenticateToken, updateProfile);

router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyVerificationCode);
router.post('/forgot/validate', forgotValidate);
router.post('/forgot/reset', resetPassword);

// 用户登出（前端处理，删除token）
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;
