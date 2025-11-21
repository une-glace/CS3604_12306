const { Train, TrainSeat } = require('../models');
const { Op } = require('sequelize');

// 查询车次
const searchTrains = async (req, res) => {
  try {
    const { 
      fromStation, 
      toStation, 
      fromStations, // 支持多出发站
      toStations,   // 支持多到达站
      departureDate,
      trainType,
      page = 1,
      limit = 20
    } = req.query;

    // 验证必要参数
    if (!departureDate) {
      return res.status(400).json({
        success: false,
        message: '出发日期不能为空'
      });
    }

    // 处理多车站查询
    const fromStationList = fromStations ? 
      (Array.isArray(fromStations) ? fromStations : [fromStations]) : 
      (fromStation ? [fromStation] : []);
      
    const toStationList = toStations ? 
      (Array.isArray(toStations) ? toStations : [toStations]) : 
      (toStation ? [toStation] : []);

    if (fromStationList.length === 0 || toStationList.length === 0) {
      return res.status(400).json({
        success: false,
        message: '出发站和到达站不能为空'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      fromStation: {
        [Op.in]: fromStationList
      },
      toStation: {
        [Op.in]: toStationList
      },
      status: 'active'
    };

    // 如果指定了车次类型，添加过滤条件
    if (trainType) {
      whereClause.trainType = trainType;
    }

    const trains = await Train.findAndCountAll({
      where: whereClause,
      include: [{
        model: TrainSeat,
        as: 'seats',
        where: {
          date: departureDate
        },
        required: false
      }],
      order: [['departureTime', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 处理返回数据，添加座位信息
    const trainsWithSeats = trains.rows.map(train => {
      const trainData = train.toJSON();
      
      // 整理座位信息
      const seatInfo = {};
      if (trainData.seats) {
        trainData.seats.forEach(seat => {
          seatInfo[seat.seatType] = {
            totalSeats: seat.totalSeats,
            availableSeats: seat.availableSeats,
            price: seat.price,
            isAvailable: seat.availableSeats > 0
          };
        });
      }
      
      return {
        ...trainData,
        seatInfo,
        seats: undefined // 移除原始seats数据
      };
    });

    res.json({
      success: true,
      data: {
        trains: trainsWithSeats,
        pagination: {
          total: trains.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(trains.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('查询车次错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取车次详情
const getTrainDetail = async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: '日期参数不能为空'
      });
    }

    const train = await Train.findOne({
      where: { trainNumber },
      include: [{
        model: TrainSeat,
        as: 'seats',
        where: { date },
        required: false
      }]
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        message: '车次不存在'
      });
    }

    // 整理座位信息
    const seatInfo = {};
    if (train.seats) {
      train.seats.forEach(seat => {
        seatInfo[seat.seatType] = {
          totalSeats: seat.totalSeats,
          availableSeats: seat.availableSeats,
          price: seat.price,
          isAvailable: seat.availableSeats > 0
        };
      });
    }

    const trainData = train.toJSON();
    trainData.seatInfo = seatInfo;
    delete trainData.seats;

    res.json({
      success: true,
      data: { train: trainData }
    });

  } catch (error) {
    console.error('获取车次详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

let popularRoutesCache = { data: null, expiresAt: 0 };
const getPopularRoutes = async (req, res) => {
  try {
    const ttl = parseInt(process.env.POPULAR_ROUTES_TTL_MS || '300000', 10);
    const now = Date.now();
    if (popularRoutesCache.data && popularRoutesCache.expiresAt > now) {
      return res.json({ success: true, data: { routes: popularRoutesCache.data } });
    }
    const popularRoutes = [
      { fromStation: '北京南', toStation: '上海虹桥', count: 1250 },
      { fromStation: '广州南', toStation: '深圳北', count: 980 },
      { fromStation: '北京西', toStation: '西安北', count: 856 },
      { fromStation: '上海虹桥', toStation: '南京南', count: 742 },
      { fromStation: '成都东', toStation: '重庆北', count: 698 },
      { fromStation: '杭州东', toStation: '宁波', count: 634 },
      { fromStation: '武汉', toStation: '长沙南', count: 587 },
      { fromStation: '天津西', toStation: '济南西', count: 523 }
    ];
    popularRoutesCache = { data: popularRoutes, expiresAt: now + ttl };
    res.json({ success: true, data: { routes: popularRoutes } });
  } catch (error) {
    console.error('获取热门路线错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取车站列表
const getStations = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    // 这里应该从车站数据表中查询，暂时返回示例数据
    let stations = [
      { code: 'BJP', name: '北京', pinyin: 'beijing' },
      { code: 'SHH', name: '上海', pinyin: 'shanghai' },
      { code: 'GZQ', name: '广州', pinyin: 'guangzhou' },
      { code: 'SZN', name: '深圳', pinyin: 'shenzhen' },
      { code: 'CDW', name: '成都', pinyin: 'chengdu' },
      { code: 'CQW', name: '重庆', pinyin: 'chongqing' },
      { code: 'XAY', name: '西安', pinyin: 'xian' },
      { code: 'WHN', name: '武汉', pinyin: 'wuhan' },
      { code: 'NJH', name: '南京', pinyin: 'nanjing' },
      { code: 'HZH', name: '杭州', pinyin: 'hangzhou' },
      { code: 'TJP', name: '天津', pinyin: 'tianjin' },
      { code: 'JNK', name: '济南', pinyin: 'jinan' },
      { code: 'CSQ', name: '长沙', pinyin: 'changsha' },
      { code: 'NBH', name: '宁波', pinyin: 'ningbo' }
    ];

    // 如果有关键词，进行过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      stations = stations.filter(station => 
        station.name.includes(keyword) || 
        station.pinyin.includes(lowerKeyword) ||
        station.code.toLowerCase().includes(lowerKeyword)
      );
    }

    res.json({
      success: true,
      data: { stations }
    });

  } catch (error) {
    console.error('获取车站列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  searchTrains,
  getTrainDetail,
  getPopularRoutes,
  getStations
};