const express = require('express');
const { 
  createOrder, 
  getUserOrders, 
  getOrderDetail, 
  cancelOrder,
  updateOrderStatus,
  changeOrder
} = require('../controllers/orderController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// 所有订单相关的路由都需要认证
router.use(authenticateToken);

// 创建订单
router.post('/', createOrder);

// 改签订单
router.post('/change', changeOrder);

// 获取用户订单列表
router.get('/', getUserOrders);

// 获取订单详情
router.get('/:orderId', getOrderDetail);

// 更新订单状态（支付）
router.put('/:orderId/status', updateOrderStatus);

// 取消订单
router.put('/:orderId/cancel', cancelOrder);

module.exports = router;