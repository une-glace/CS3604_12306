const { Passenger, User } = require('../models');
const { validatePassengerData } = require('../utils/validation');

// 获取用户的所有乘车人
const getPassengers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const passengers = await Passenger.findAll({
      where: { 
        user_id: userId,
        status: 'active'
      },
      order: [['is_default', 'DESC'], ['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: passengers.map(passenger => ({
        id: passenger.id,
        name: passenger.name,
        idCard: passenger.id_number,
        phone: passenger.phone,
        passengerType: passenger.passenger_type,
        idType: passenger.id_type,
        isDefault: passenger.is_default
      }))
    });
  } catch (error) {
    console.error('获取乘车人列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取乘车人列表失败'
    });
  }
};

// 添加乘车人
const addPassenger = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, idCard, phone, passengerType } = req.body;

    // 验证数据
    const validation = validatePassengerData({ name, idCard, phone, passengerType });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // 检查身份证号是否已存在（同一用户下）
    const existingPassenger = await Passenger.findOne({
      where: {
        user_id: userId,
        id_number: idCard,
        status: 'active'
      }
    });

    if (existingPassenger) {
      return res.status(400).json({
        success: false,
        message: '该身份证号已存在'
      });
    }

    // 创建乘车人
    const passenger = await Passenger.create({
      user_id: userId,
      name,
      id_number: idCard,
      phone,
      passenger_type: passengerType,
      is_default: false
    });

    res.status(201).json({
      success: true,
      message: '添加乘车人成功',
      data: {
        id: passenger.id,
        name: passenger.name,
        idCard: passenger.id_number,
        phone: passenger.phone,
        passengerType: passenger.passenger_type,
        idType: passenger.id_type,
        isDefault: passenger.is_default
      }
    });
  } catch (error) {
    console.error('添加乘车人失败:', error);
    res.status(500).json({
      success: false,
      message: '添加乘车人失败'
    });
  }
};

// 更新乘车人
const updatePassenger = async (req, res) => {
  try {
    const userId = req.user.id;
    const passengerId = req.params.id;
    const { name, idCard, phone, passengerType } = req.body;

    // 验证数据
    const validation = validatePassengerData({ name, idCard, phone, passengerType });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // 查找乘车人
    const passenger = await Passenger.findOne({
      where: {
        id: passengerId,
        user_id: userId,
        status: 'active'
      }
    });

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: '乘车人不存在'
      });
    }

    // 如果修改身份证号，检查是否与其他乘车人重复
    if (idCard !== passenger.id_number) {
      const existingPassenger = await Passenger.findOne({
        where: {
          user_id: userId,
          id_number: idCard,
          status: 'active',
          id: { [require('sequelize').Op.ne]: passengerId }
        }
      });

      if (existingPassenger) {
        return res.status(400).json({
          success: false,
          message: '该身份证号已存在'
        });
      }
    }

    // 更新乘车人信息
    await passenger.update({
      name,
      id_number: idCard,
      phone,
      passenger_type: passengerType
    });

    res.json({
      success: true,
      message: '更新乘车人成功',
      data: {
        id: passenger.id,
        name: passenger.name,
        idCard: passenger.id_number,
        phone: passenger.phone,
        passengerType: passenger.passenger_type,
        idType: passenger.id_type,
        isDefault: passenger.is_default
      }
    });
  } catch (error) {
    console.error('更新乘车人失败:', error);
    res.status(500).json({
      success: false,
      message: '更新乘车人失败'
    });
  }
};

// 删除乘车人
const deletePassenger = async (req, res) => {
  try {
    const userId = req.user.id;
    const passengerId = req.params.id;

    // 查找乘车人
    const passenger = await Passenger.findOne({
      where: {
        id: passengerId,
        user_id: userId,
        status: 'active'
      }
    });

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: '乘车人不存在'
      });
    }

    // 不允许删除默认乘车人（用户本人）
    if (passenger.is_default) {
      return res.status(400).json({
        success: false,
        message: '不能删除默认乘车人'
      });
    }

    // 软删除（标记为inactive）
    await passenger.update({ status: 'inactive' });

    res.json({
      success: true,
      message: '删除乘车人成功'
    });
  } catch (error) {
    console.error('删除乘车人失败:', error);
    res.status(500).json({
      success: false,
      message: '删除乘车人失败'
    });
  }
};

// 为新用户创建默认乘车人
const createDefaultPassenger = async (userId, userData) => {
  try {
    await Passenger.create({
      user_id: userId,
      name: userData.real_name,
      id_type: userData.id_type || '1',
      id_number: userData.id_number,
      phone: userData.phone_number,
      passenger_type: userData.passenger_type === '1' ? '成人' : '儿童',
      is_default: true
    });
  } catch (error) {
    console.error('创建默认乘车人失败:', error);
    throw error;
  }
};

module.exports = {
  getPassengers,
  addPassenger,
  updatePassenger,
  deletePassenger,
  createDefaultPassenger
};