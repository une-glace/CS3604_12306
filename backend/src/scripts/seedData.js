const { Train, TrainSeat } = require('../models');

// 初始化车次数据
const initTrainData = async () => {
  try {
    console.log('开始初始化车次数据...');

    // 示例车次数据
    const trainData = [
      {
        trainNumber: 'G1',
        trainType: 'G',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '07:00',
        arrivalTime: '11:28',
        duration: '4小时28分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G2',
        trainType: 'G',
        fromStation: '上海虹桥',
        toStation: '北京南',
        departureTime: '13:00',
        arrivalTime: '17:28',
        duration: '4小时28分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G79',
        trainType: 'G',
        fromStation: '北京西',
        toStation: '西安北',
        departureTime: '08:05',
        arrivalTime: '12:30',
        duration: '4小时25分',
        distance: 1216,
        status: 'active'
      },
      {
        trainNumber: 'G80',
        trainType: 'G',
        fromStation: '西安北',
        toStation: '北京西',
        departureTime: '14:15',
        arrivalTime: '18:40',
        duration: '4小时25分',
        distance: 1216,
        status: 'active'
      },
      {
        trainNumber: 'D1',
        trainType: 'D',
        fromStation: '广州南',
        toStation: '深圳北',
        departureTime: '06:30',
        arrivalTime: '07:00',
        duration: '30分',
        distance: 102,
        status: 'active'
      },
      {
        trainNumber: 'D2',
        trainType: 'D',
        fromStation: '深圳北',
        toStation: '广州南',
        departureTime: '22:30',
        arrivalTime: '23:00',
        duration: '30分',
        distance: 102,
        status: 'active'
      },
      // 添加前端使用的车次数据
      {
        trainNumber: 'G1407',
        trainType: 'G',
        fromStation: '上海',
        toStation: '北京南',
        departureTime: '12:36',
        arrivalTime: '02:36',
        duration: '10小时00分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G2788',
        trainType: 'G',
        fromStation: '上海',
        toStation: '北京南',
        departureTime: '12:50',
        arrivalTime: '04:23',
        duration: '19小时33分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G3087',
        trainType: 'G',
        fromStation: '上海虹桥',
        toStation: '北京南',
        departureTime: '12:57',
        arrivalTime: '02:35',
        duration: '15小时38分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G1629',
        trainType: 'G',
        fromStation: '上海虹桥',
        toStation: '北京南',
        departureTime: '13:07',
        arrivalTime: '09:09',
        duration: '4小时02分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G1620',
        trainType: 'G',
        fromStation: '上海虹桥',
        toStation: '北京南',
        departureTime: '13:30',
        arrivalTime: '02:46',
        duration: '4小时16分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G3789',
        trainType: 'G',
        fromStation: '上海',
        toStation: '北京南',
        departureTime: '13:15',
        arrivalTime: '01:17',
        duration: '16小时02分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G7772',
        trainType: 'G',
        fromStation: '上海',
        toStation: '北京南',
        departureTime: '13:39',
        arrivalTime: '04:06',
        duration: '9小时27分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G7723',
        trainType: 'G',
        fromStation: '上海',
        toStation: '北京南',
        departureTime: '13:47',
        arrivalTime: '03:58',
        duration: '9小时11分',
        distance: 1318,
        status: 'active'
      }
      ,
      // 测试文档指定车次（2025-12-15 / 2025-12-16）
      {
        trainNumber: 'G101',
        trainType: 'G',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '08:00',
        arrivalTime: '13:28',
        duration: '5小时28分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'D313',
        trainType: 'D',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '14:20',
        arrivalTime: '22:50',
        duration: '8小时30分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'K511',
        trainType: 'K',
        fromStation: '北京西',
        toStation: '上海',
        departureTime: '19:15',
        arrivalTime: '14:45+1',
        duration: '19小时30分',
        distance: 1463,
        status: 'active'
      },
      {
        trainNumber: 'G7001',
        trainType: 'G',
        fromStation: '南京南',
        toStation: '上海虹桥',
        departureTime: '09:30',
        arrivalTime: '11:00',
        duration: '1小时30分',
        distance: 301,
        status: 'active'
      },
      {
        trainNumber: 'D5401',
        trainType: 'D',
        fromStation: '南京南',
        toStation: '上海虹桥',
        departureTime: '15:45',
        arrivalTime: '17:15',
        duration: '1小时30分',
        distance: 301,
        status: 'active'
      },
      {
        trainNumber: 'G7002',
        trainType: 'G',
        fromStation: '上海虹桥',
        toStation: '南京南',
        departureTime: '12:00',
        arrivalTime: '13:30',
        duration: '1小时30分',
        distance: 301,
        status: 'active'
      },
      {
        trainNumber: 'G103',
        trainType: 'G',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '08:30',
        arrivalTime: '13:58',
        duration: '5小时28分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'D315',
        trainType: 'D',
        fromStation: '北京南',
        toStation: '上海虹桥',
        departureTime: '14:50',
        arrivalTime: '23:20',
        duration: '8小时30分',
        distance: 1318,
        status: 'active'
      },
      {
        trainNumber: 'G153',
        trainType: 'G',
        fromStation: '北京南',
        toStation: '南京南',
        departureTime: '10:45',
        arrivalTime: '14:15',
        duration: '3小时30分',
        distance: 1018,
        status: 'active'
      },
      {
        trainNumber: 'G7003',
        trainType: 'G',
        fromStation: '南京南',
        toStation: '上海虹桥',
        departureTime: '10:00',
        arrivalTime: '11:30',
        duration: '1小时30分',
        distance: 301,
        status: 'active'
      }
    ];

    // 创建车次数据
    for (const train of trainData) {
      await Train.findOrCreate({
        where: { trainNumber: train.trainNumber },
        defaults: train
      });
    }

    console.log('车次数据初始化完成');
  } catch (error) {
    console.error('初始化车次数据失败:', error);
  }
};

// 初始化座位数据
const initSeatData = async () => {
  try {
    console.log('开始初始化座位数据...');

    const trains = await Train.findAll();
    const today = new Date();
    
    // 为未来60天生成座位数据
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      for (const train of trains) {
        // 根据车次类型设置不同的座位配置
        let seatConfig = [];
        
        if (train.trainType === 'G') {
          seatConfig = [
            { seatType: '商务座', totalSeats: 24, price: 1748 },
            { seatType: '特等座', totalSeats: 18, price: 1600 },
            { seatType: '优选一等座', totalSeats: 32, price: 1033 },
            { seatType: '一等座', totalSeats: 64, price: 933 },
            { seatType: '二等座', totalSeats: 200, price: 553 }
          ];
        } else if (train.trainType === 'D') {
          seatConfig = [
            { seatType: '一等座', totalSeats: 48, price: 428 },
            { seatType: '二等座', totalSeats: 152, price: 428 }
          ];
        } else if (train.trainType === 'K') {
          seatConfig = [
            { seatType: '硬座', totalSeats: 240, price: 156 },
            { seatType: '硬卧', totalSeats: 120, price: 320 },
            { seatType: '软卧', totalSeats: 64, price: 520 }
          ];
        }

        // 创建座位数据
        for (const seat of seatConfig) {
          await TrainSeat.findOrCreate({
            where: {
              trainNumber: train.trainNumber,
              date: dateString,
              seatType: seat.seatType
            },
            defaults: {
              ...seat,
              availableSeats: seat.totalSeats
            }
          });
        }
      }
    }

    // 添加测试文档指定日期的座位数据（2025-12-15 / 2025-12-16）
    const specificDates = ['2025-12-15', '2025-12-16'];
    const specificSeatPrice = {
      G: { '商务座': 1748, '一等座': 933, '二等座': 553 },
      D: { '一等座': 428, '二等座': 428 },
      K: { '硬座': 156, '硬卧': 320, '软卧': 520 }
    };
    const specificTrains = ['G101','D313','K511','G7001','D5401','G7002','G103','D315','G153','G7003'];
    for (const dateString of specificDates) {
      for (const train of trains) {
        if (!specificTrains.includes(train.trainNumber)) continue;
        const cfg = specificSeatPrice[train.trainType] || {};
        for (const [seatType, price] of Object.entries(cfg)) {
          await TrainSeat.findOrCreate({
            where: { trainNumber: train.trainNumber, date: dateString, seatType },
            defaults: { totalSeats: 200, availableSeats: 200, price }
          });
        }
      }
    }

    console.log('座位数据初始化完成');
  } catch (error) {
    console.error('初始化座位数据失败:', error);
  }
};

// 主函数
const seedData = async () => {
  try {
    await initTrainData();
    await initSeatData();
    console.log('✅ 所有数据初始化完成');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  const { testConnection, syncDatabase } = require('../models');
  
  (async () => {
    try {
      await testConnection();
      await syncDatabase(false);
      await seedData();
      process.exit(0);
    } catch (error) {
      console.error('脚本执行失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedData,
  initTrainData,
  initSeatData
};
