// 生成订单号
const generateOrderId = () => {
  // 订单号格式：E + 年月日 + 6位随机数
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  
  // 生成6位随机数
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `E${year}${month}${day}${hour}${minute}${second}${randomNum}`;
};

// 计算订单总价
const calculateTotalPrice = (ticketInfos) => {
  return ticketInfos.reduce((total, ticket) => {
    return total + (ticket.price * ticket.count);
  }, 0);
};

// 验证订单数据
const validateOrderData = (orderData) => {
  const { trainInfo, passengers, ticketInfos } = orderData;
  const errors = [];

  // 验证车次信息
  if (!trainInfo) {
    errors.push('车次信息不能为空');
  } else {
    if (!trainInfo.trainNumber) errors.push('车次号不能为空');
    if (!trainInfo.fromStation) errors.push('出发站不能为空');
    if (!trainInfo.toStation) errors.push('到达站不能为空');
    if (!trainInfo.departureDate) errors.push('出发日期不能为空');
    if (!trainInfo.departureTime) errors.push('出发时间不能为空');
    if (!trainInfo.arrivalTime) errors.push('到达时间不能为空');
  }

  // 验证乘客信息
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    errors.push('乘客信息不能为空');
  } else {
    passengers.forEach((passenger, index) => {
      if (!passenger.name) errors.push(`第${index + 1}位乘客姓名不能为空`);
      if (!passenger.idCard) errors.push(`第${index + 1}位乘客身份证号不能为空`);
      if (!passenger.phone) errors.push(`第${index + 1}位乘客手机号不能为空`);
      if (!passenger.passengerType) errors.push(`第${index + 1}位乘客类型不能为空`);
    });
  }

  // 验证票务信息
  if (!ticketInfos || !Array.isArray(ticketInfos) || ticketInfos.length === 0) {
    errors.push('票务信息不能为空');
  } else {
    ticketInfos.forEach((ticket, index) => {
      if (!ticket.seatType) errors.push(`第${index + 1}个票务信息座位类型不能为空`);
      if (!ticket.ticketType) errors.push(`第${index + 1}个票务信息票种不能为空`);
      if (!ticket.price || ticket.price <= 0) errors.push(`第${index + 1}个票务信息价格无效`);
      if (!ticket.count || ticket.count <= 0) errors.push(`第${index + 1}个票务信息数量无效`);
    });
  }

  // 验证乘客数量与票数是否匹配
  if (passengers && ticketInfos) {
    const totalTickets = ticketInfos.reduce((sum, ticket) => sum + ticket.count, 0);
    if (passengers.length !== totalTickets) {
      errors.push('乘客数量与票数不匹配');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 订单状态映射
const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  COMPLETED: 'completed'
};

// 订单状态中文描述
const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待支付',
  [ORDER_STATUS.PAID]: '已支付',
  [ORDER_STATUS.CONFIRMED]: '已确认',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.REFUNDED]: '已退款',
  [ORDER_STATUS.COMPLETED]: '已完成'
};

// 座位类型映射
const SEAT_TYPES = {
  BUSINESS: '商务座',
  FIRST_CLASS: '一等座',
  SECOND_CLASS: '二等座',
  HARD_SEAT: '硬座',
  SOFT_SEAT: '软座',
  HARD_SLEEPER: '硬卧',
  SOFT_SLEEPER: '软卧'
};

// 票种类型映射
const TICKET_TYPES = {
  ADULT: '成人票',
  CHILD: '儿童票',
  STUDENT: '学生票',
  SENIOR: '老年票'
};

module.exports = {
  generateOrderId,
  calculateTotalPrice,
  validateOrderData,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  SEAT_TYPES,
  TICKET_TYPES
};