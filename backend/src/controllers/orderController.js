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

    // 组团分配：按席别聚类，一次性为同席别乘客分配相邻座位
    const bySeatType = new Map(); // seatType -> indices[]
    ticketInfos.forEach((t, idx) => {
      const arr = bySeatType.get(t.seatType) || [];
      arr.push(idx);
      bySeatType.set(t.seatType, arr);
    });

    const assignedSeats = new Array(ticketInfos.length).fill(null);

    for (const [seatType, indices] of bySeatType.entries()) {
      const prefs = indices.map(i => {
        const raw = selectedSeats?.[i];
        // 将可能的 'F' 映射为题设中的 'E'
        return raw === 'F' ? 'E' : raw;
      });

      const seatsForGroup = await allocateSeatsForGroup(
        trainInfo.trainNumber,
        trainInfo.date,
        seatType,
        indices.length,
        prefs,
        transaction
      );

      indices.forEach((idx, k) => {
        assignedSeats[idx] = seatsForGroup[k];
      });
    }

    // 按原顺序写入乘客记录
    for (let i = 0; i < ticketInfos.length; i++) {
      const ticketInfo = ticketInfos[i];
      const passenger = passengers[i];
      if (!passenger) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: '乘客信息不完整' });
      }

      const seatNumber = assignedSeats[i];

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

// 组团座位分配算法（8车×16排×ABCDE，C/D 过道）
const allocateSeatsForGroup = async (trainNumber, date, seatType, count, preferences = [], transaction) => {
  // 查询已占用
  const existingSeats = await OrderPassenger.findAll({
    include: [{
      model: Order,
      as: 'order',
      where: { trainNumber, departureDate: date, status: ['unpaid','paid','completed'] }
    }],
    where: { seatType },
    transaction
  });
  const occupied = new Set(existingSeats.map(s => s.seatNumber));

  // 生成全量座位（排序：car->row->letter）
  const letters = ['A','B','C','D','E'];
  const cars = Array.from({length:8}, (_,i)=>i+1);
  const rows = Array.from({length:16}, (_,i)=>i+1);
  const universe = [];
  for (const car of cars) {
    for (const row of rows) {
      for (const letter of letters) {
        universe.push({ car, row, letter, code: `${car}车${row}${letter}` });
      }
    }
  }

  const groupByCarRow = (list) => {
    const map = new Map();
    list.forEach(s => {
      const key = `${s.car}-${s.row}`;
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, seats]) => {
      const [car,row] = key.split('-').map(n=>parseInt(n,10));
      // 保持 ABCDE 顺序
      seats.sort((a,b)=>letters.indexOf(a.letter)-letters.indexOf(b.letter));
      return { car, row, seats };
    });
  };

  const leftBlock = new Set(['A','B','C']);
  const rightBlock = new Set(['D','E']);

  const pickWithPreferences = (availCodes, prefs, need) => {
    const chosen = [];
    const used = new Set();
    // 先满足偏好
    prefs.forEach(pref => {
      if (!pref) return;
      const match = availCodes.find(c => c.endsWith(pref) && !used.has(c));
      if (match) { chosen.push(match); used.add(match); }
    });
    // 再补相邻（优先左块，再右块）
    const pushFromBlock = (blockSet) => {
      for (const code of availCodes) {
        const letter = code.slice(-1);
        if (blockSet.has(letter) && !used.has(code) && chosen.length < need) {
          chosen.push(code); used.add(code);
        }
      }
    };
    if (chosen.length < need) pushFromBlock(leftBlock);
    if (chosen.length < need) pushFromBlock(rightBlock);
    // 若仍不足，任意补全
    for (const code of availCodes) {
      if (!used.has(code) && chosen.length < need) { chosen.push(code); used.add(code); }
    }
    return chosen.length >= need ? chosen : null;
  };

  const grouped = groupByCarRow(universe);
  const result = new Array(count).fill(null);
  let remaining = count;
  let prefQueue = preferences.slice();

  // 1) 同排相邻
  for (const {car,row,seats} of grouped) {
    const avail = seats.filter(s => !occupied.has(s.code)).map(s=>s.code);
    if (avail.length >= remaining) {
      const picked = pickWithPreferences(avail, prefQueue, remaining);
      if (picked) {
        // 写入 result 按顺序分配
        for (let i=0;i<remaining;i++) { result[i] = picked[i]; occupied.add(picked[i]); }
        return result; // 全组已分配
      }
    }
  }

  // 2) 同车厢相邻排（逐行填充）
  for (const car of cars) {
    const carRows = grouped.filter(g=>g.car===car);
    const bucket = [];
    for (const g of carRows) {
      const avail = g.seats.filter(s=>!occupied.has(s.code)).map(s=>s.code);
      bucket.push(...avail);
      if (bucket.length >= remaining) break;
    }
    if (bucket.length >= remaining) {
      const picked = pickWithPreferences(bucket, prefQueue, remaining);
      if (picked) { for (let i=0;i<remaining;i++){ result[i]=picked[i]; occupied.add(picked[i]); } return result; }
    }
  }

  // 3) 跨车厢任意分配
  const anyAvail = universe.filter(s=>!occupied.has(s.code)).map(s=>s.code);
  const picked = pickWithPreferences(anyAvail, prefQueue, remaining) || anyAvail.slice(0, remaining);
  for (let i=0;i<remaining;i++){ result[i]=picked[i]; occupied.add(picked[i]); }
  return result;
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

    const now = new Date();
    const updates = [];
    const ttlMs = parseInt(process.env.ORDER_UNPAID_TTL_MS || '120000', 10);
    for (const order of orders.rows) {
      if (order.status === 'paid' && order.departureDate) {
        try {
          const depart = new Date(order.departureDate);
          if (order.departureTime) {
            const [hh, mm] = String(order.departureTime).split(':');
            const h = parseInt(hh || '0', 10);
            const m = parseInt(mm || '0', 10);
            depart.setHours(h, m, 0, 0);
          }
          if (now >= depart) {
            updates.push(order.update({ status: 'completed' }));
          }
        } catch {}
      }
      if (order.status === 'unpaid' && order.createdAt) {
        try {
          const created = new Date(order.createdAt);
          if (now.getTime() - created.getTime() > ttlMs) {
            const seatCounts = {};
            if (order.passengers && order.passengers.length > 0) {
              order.passengers.forEach(p => {
                const key = `${p.seatType}`;
                seatCounts[key] = (seatCounts[key] || 0) + 1;
              });
              for (const [seatType, count] of Object.entries(seatCounts)) {
                updates.push((async () => {
                  const trainSeat = await TrainSeat.findOne({ where: { trainNumber: order.trainNumber, date: order.departureDate, seatType } });
                  if (trainSeat) {
                    await trainSeat.update({ availableSeats: trainSeat.availableSeats + count });
                  }
                })());
              }
            }
            updates.push(order.update({ status: 'cancelled' }));
          }
        } catch {}
      }
    }
    if (updates.length > 0) await Promise.all(updates);

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
