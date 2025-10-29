const express = require('express');
const { 
  searchTrains, 
  getTrainDetail, 
  getPopularRoutes, 
  getStations 
} = require('../controllers/trainController');
const { optionalAuth } = require('../utils/auth');

const router = express.Router();

// 查询车次（可选认证，登录用户可能有更多信息）
router.get('/search', optionalAuth, searchTrains);

// 获取车次详情
router.get('/:trainNumber', optionalAuth, getTrainDetail);

// 获取热门路线
router.get('/routes/popular', getPopularRoutes);

// 获取车站列表
router.get('/stations/list', getStations);

module.exports = router;