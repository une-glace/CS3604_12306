const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/auth');
const {
  getPassengers,
  addPassenger,
  updatePassenger,
  deletePassenger
} = require('../controllers/passengerController');

// 获取用户的所有乘车人
router.get('/', authenticateToken, getPassengers);

// 添加乘车人
router.post('/', authenticateToken, addPassenger);

// 更新乘车人
router.put('/:id', authenticateToken, updatePassenger);

// 删除乘车人
router.delete('/:id', authenticateToken, deletePassenger);

module.exports = router;