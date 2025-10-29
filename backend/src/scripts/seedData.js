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
    
    // 为未来30天生成座位数据
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      for (const train of trains) {
        // 根据车次类型设置不同的座位配置
        let seatConfig = [];
        
        if (train.trainType === 'G') {
          seatConfig = [
            { seatType: '商务座', totalSeats: 24, price: 1748 },
            { seatType: '一等座', totalSeats: 64, price: 933 },
            { seatType: '二等座', totalSeats: 200, price: 553 }
          ];
        } else if (train.trainType === 'D') {
          seatConfig = [
            { seatType: '一等座', totalSeats: 48, price: 144 },
            { seatType: '二等座', totalSeats: 152, price: 89 }
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