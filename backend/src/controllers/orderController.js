const { Order, OrderPassenger, Train, TrainSeat, User } = require('../models');
const { generateOrderId } = require('../utils/orderUtils');
const { Op } = require('sequelize');

// 创建订单
const createOrder = async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const {
      trainInfo,
      passengers,
      ticketInfos,
      totalPrice,
      selectedSeats = []
    } = req.body;

    // 验证必要参数
    if (!trainInfo || !passengers || !ticketInfos || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: '订单信息不完整'
      });
    }

    // 验证用户是否存在
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证车次信息
    const train = await Train.findOne({
      where: { trainNumber: trainInfo.trainNumber }
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        message: '车次信息不存在'
      });
    }

    // 检查座位可用性并预留座位
    const seatReservations = [];
    
    // 统计每种座位类型的需求数量
    const seatTypeCount = {};
    ticketInfos.forEach(ticketInfo => {
      seatTypeCount[ticketInfo.seatType] = (seatTypeCount[ticketInfo.seatType] || 0) + 1;
    });

    // 检查并预留每种座位类型
    for (const [seatType, count] of Object.entries(seatTypeCount)) {
      const trainSeat = await TrainSeat.findOne({
        where: {
          trainNumber: trainInfo.trainNumber,
          date: trainInfo.date, // 修复字段名称，前端传递的是date而不是departureDate
          seatType: seatType
        },
        transaction
      });

      if (!trainSeat) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `${seatType}座位信息不存在`
        });
      }

      if (trainSeat.availableSeats < count) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `${seatType}余票不足，剩余${trainSeat.availableSeats}张`
        });
      }

      // 预留座位
      const newAvailableSeats = trainSeat.availableSeats - count;
      
      // 确保座位数不会变成负数
      if (newAvailableSeats < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `${seatType}余票不足，剩余${trainSeat.availableSeats}张`
        });
      }

      // 更新座位数
      await trainSeat.update({
        availableSeats: newAvailableSeats
      }, { transaction });

      seatReservations.push({
        trainSeat,
        count: count,
        seatType: seatType
      });
    }

    // 生成订单号
    const orderId = generateOrderId();

    // 创建订单
    const order = await Order.create({
      orderId,
      userId: req.user.id,
      trainNumber: trainInfo.trainNumber,
      fromStation: trainInfo.fromStation || trainInfo.from, // 兼容前端字段名
      toStation: trainInfo.toStation || trainInfo.to, // 兼容前端字段名
      departureDate: trainInfo.date, // 修复字段名称，使用trainInfo.date
      departureTime: trainInfo.departureTime,
      arrivalTime: trainInfo.arrivalTime,
      duration: trainInfo.duration,
      totalPrice,
      status: 'unpaid',
      paymentMethod: null,
      paymentTime: null
    }, { transaction });

    // 创建乘客信息（与前端结构一一对应）
    const orderPassengers = [];
    let passengerIndex = 0;

    for (const ticketInfo of ticketInfos) {
      const passenger = passengers[passengerIndex];
      if (!passenger) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '乘客信息不完整'
        });
      }

      const preferredCode = selectedSeats[passengerIndex];
      const seatNumber = await allocateSeat(
        trainInfo.trainNumber,
        trainInfo.date,
        ticketInfo.seatType,
        transaction,
        preferredCode
      );

      const orderPassenger = await OrderPassenger.create({
        orderId: order.id,
        passengerName: passenger.name,
        idCard: passenger.idCard,
        phone: passenger.phone,
        passengerType: passenger.passengerType,
        seatType: ticketInfo.seatType,
        seatNumber,
        ticketType: ticketInfo.ticketType,
        price: ticketInfo.price
      }, { transaction });

      orderPassengers.push(orderPassenger);
      passengerIndex++;
    }

    await transaction.commit();

    // 返回订单信息
    const orderWithPassengers = await Order.findByPk(order.id, {
      include: [{
        model: OrderPassenger,
        as: 'passengers'
      }]
    });

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        id: orderWithPassengers.id,
        orderId: orderWithPassengers.orderId,
        order: orderWithPassengers
      }
    });

  } catch (error) {
    // 确保事务回滚
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    
    console.error('创建订单错误:', error);
    
    // 根据错误类型返回更具体的错误信息
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: '数据约束错误，请检查输入信息',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败，请检查输入信息',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 简化的座位分配算法
const allocateSeat = async (trainNumber, date, seatType, transaction, preferredCode) => {
  // 这里是一个简化的座位分配算法
  // 实际应该根据车厢布局、已占用座位等进行复杂计算
  
  // 查找已分配的座位
  const existingSeats = await OrderPassenger.findAll({
    include: [{
      model: Order,
      as: 'order',
      where: {
        trainNumber,
        departureDate: date,
        status: ['unpaid', 'paid', 'completed']
      }
    }],
    where: {
      seatType
    },
    transaction
  });

  const occupiedSeats = existingSeats.map(seat => seat.seatNumber);
  
  // 根据座位类型生成座位号
  let seatPrefix = '';
  let maxSeats = 0;
  
  switch (seatType) {
    case '商务座':
      seatPrefix = '1';
      maxSeats = 24; // 假设商务座有24个座位
      break;
    case '一等座':
      seatPrefix = '2';
      maxSeats = 64; // 假设一等座有64个座位
      break;
    case '二等座':
      seatPrefix = '3';
      maxSeats = 200; // 假设二等座有200个座位
      break;
    default:
      seatPrefix = '3';
      maxSeats = 200;
  }

  // 辅助：根据索引推断座位字母（简化近似）
  const letterForIndex = (idx) => {
    if (seatType === '二等座') {
      const letters = ['A', 'B', 'C', 'D', 'F'];
      return letters[(idx - 1) % letters.length];
    }
    if (seatType === '一等座' || seatType === '商务座') {
      const letters = ['A', 'C', 'D', 'F'];
      return letters[(idx - 1) % letters.length];
    }
    // 其他类型简化为A
    return 'A';
  };

  // 优先尝试分配符合偏好的座位
  if (preferredCode) {
    for (let i = 1; i <= maxSeats; i++) {
      const seatNumber = `${seatPrefix}车${String(i).padStart(3, '0')}号`;
      if (!occupiedSeats.includes(seatNumber) && letterForIndex(i) === preferredCode) {
        return seatNumber;
      }
    }
  }

  // 若没有匹配的偏好或偏好座位已满，分配任意可用座位
  for (let i = 1; i <= maxSeats; i++) {
    const seatNumber = `${seatPrefix}车${String(i).padStart(3, '0')}号`;
    if (!occupiedSeats.includes(seatNumber)) {
      return seatNumber;
    }
  }

  // 如果没有可用座位，返回一个默认座位号（实际应该抛出错误）
  return `${seatPrefix}车001号`;
};

// 获取用户订单列表
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: OrderPassenger,
        as: 'passengers'
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(orders.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取订单详情
const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: {
        orderId,
        userId: req.user.id
      },
      include: [{
        model: OrderPassenger,
        as: 'passengers'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 取消订单
const cancelOrder = async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const { orderId } = req.params;
    
    // 添加调试日志
    console.log('取消订单请求:', {
      orderId,
      userId: req.user?.id,
      userInfo: req.user
    });

    // 尝试通过数据库ID或订单号查找订单
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { id: orderId, userId: req.user.id },
          { orderId: orderId, userId: req.user.id }
        ]
      },
      include: [{
        model: OrderPassenger,
        as: 'passengers'
      }],
      transaction
    });
    
    console.log('查找到的订单:', order ? {
      id: order.id,
      orderId: order.orderId,
      userId: order.userId,
      status: order.status
    } : '未找到订单');

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.status !== 'unpaid' && order.status !== 'paid') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '只能取消待支付或已支付的订单'
      });
    }

    // 释放座位
    const seatCounts = {};
    if (order.passengers && order.passengers.length > 0) {
      order.passengers.forEach(passenger => {
        const key = `${passenger.seatType}`;
        seatCounts[key] = (seatCounts[key] || 0) + 1;
      });

      for (const [seatType, count] of Object.entries(seatCounts)) {
        const trainSeat = await TrainSeat.findOne({
          where: {
            trainNumber: order.trainNumber,
            date: order.departureDate,
            seatType
          },
          transaction
        });

        if (trainSeat) {
          await trainSeat.update({
            availableSeats: trainSeat.availableSeats + count
          }, { transaction });
        }
      }
    }

    // 更新订单状态
    await order.update({
      status: 'cancelled'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '订单取消成功'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('取消订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新订单状态（支付）
const updateOrderStatus = async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const { orderId } = req.params;
    const { status, paymentMethod, paymentTime } = req.body;

    // 查找订单
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id
      },
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证状态转换是否合法
    if (order.status === 'cancelled' || order.status === 'refunded') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '订单状态不允许更新'
      });
    }

    // 更新订单状态
    const updateData = { status };
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (paymentTime) updateData.paymentTime = new Date(paymentTime);

    await order.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: {
        orderId: order.orderId,
        status: order.status
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
  updateOrderStatus
};