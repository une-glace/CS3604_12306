const User = require('../models/User');
const { validateRegisterData, validateUsername, validatePassword, validateEmail, validatePhoneNumber } = require('../utils/validation');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { createDefaultPassenger } = require('./passengerController');

// 用户注册
const register = async (req, res) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      idType,
      realName,
      idNumber,
      email,
      phoneNumber,
      countryCode,
      passengerType
    } = req.body;

    // 数据验证
    const validation = validateRegisterData({
      username,
      password,
      confirmPassword,
      realName,
      idNumber,
      phoneNumber,
      email,
      idType
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在',
        errors: { username: '该用户名已被注册' }
      });
    }

    // 检查身份证号是否已存在
    const existingIdNumber = await User.findOne({
      where: { id_number: idNumber }
    });

    if (existingIdNumber) {
      return res.status(400).json({
        success: false,
        message: '身份证号已存在',
        errors: { idNumber: '该身份证号已被注册' }
      });
    }

    // 检查手机号是否已存在
    const existingPhone = await User.findOne({
      where: { phone_number: phoneNumber }
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: '手机号已存在',
        errors: { phoneNumber: '该手机号已被注册' }
      });
    }

    // 密码加密
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const newUser = await User.create({
      username,
      password: hashedPassword,
      real_name: realName,
      id_type: idType || '1',
      id_number: idNumber,
      email: email || null,
      phone_number: phoneNumber,
      country_code: countryCode || '+86',
      passenger_type: passengerType || '1'
    });

    // 为新用户创建默认乘车人（自己）
    await createDefaultPassenger(newUser.id, newUser);

    // 生成JWT token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      realName: newUser.real_name
    });

    // 返回成功响应（不包含密码）
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      realName: newUser.real_name,
      idType: newUser.id_type,
      idNumber: newUser.id_number,
      email: newUser.email,
      phoneNumber: newUser.phone_number,
      countryCode: newUser.country_code,
      passengerType: newUser.passenger_type,
      status: newUser.status,
      createdAt: newUser.created_at
    };

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 基础验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名不存在'
      });
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系客服'
      });
    }

    // 更新最后登录时间
    await user.update({
      last_login_at: new Date()
    });

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      realName: user.real_name
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      idType: user.id_type,
      idNumber: user.id_number,
      email: user.email,
      phoneNumber: user.phone_number,
      countryCode: user.country_code,
      passengerType: user.passenger_type,
      status: user.status,
      lastLoginAt: user.last_login_at
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      idType: user.id_type,
      idNumber: user.id_number,
      email: user.email,
      phoneNumber: user.phone_number,
      countryCode: user.country_code,
      passengerType: user.passenger_type,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  // 更新个人信息（目前仅支持邮箱）
  updateProfile: async (req, res) => {
    try {
      const { email, phoneNumber, countryCode } = req.body;

      if (email !== undefined) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          return res.status(400).json({ success: false, message: emailValidation.message });
        }
      }

      if (phoneNumber !== undefined) {
        const phoneValidation = validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ success: false, message: phoneValidation.message });
        }
        // 检查手机号是否已存在（排除当前用户）
        const existingPhone = await User.findOne({
          where: { phone_number: phoneNumber, id: { [require('sequelize').Op.ne]: req.user.id } }
        });
        if (existingPhone) {
          return res.status(400).json({ success: false, message: '该手机号已被其他账户使用' });
        }
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      const updatePayload = {};
      if (email !== undefined) Object.assign(updatePayload, { email });
      if (phoneNumber !== undefined) Object.assign(updatePayload, { phone_number: phoneNumber });
      if (countryCode !== undefined) Object.assign(updatePayload, { country_code: countryCode });

      await user.update(updatePayload);

      res.json({ success: true, message: '更新成功', data: { email: user.email, phoneNumber: user.phone_number, countryCode: user.country_code } });
    } catch (error) {
      console.error('更新个人信息错误:', error);
      res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }
};
