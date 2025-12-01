const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// 搜索车站
router.get('/search', stationController.searchStations);

module.exports = router;
