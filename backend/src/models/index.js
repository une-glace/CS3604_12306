const { sequelize } = require('../config/database');
const User = require('./User');
const Order = require('./Order');
const OrderPassenger = require('./OrderPassenger');
const Train = require('./Train');
const TrainSeat = require('./TrainSeat');
const Passenger = require('./Passenger');

// 定义模型关联关系
// Order 与 OrderPassenger 的关联关系
Order.hasMany(OrderPassenger, {
  foreignKey: 'orderId',
  as: 'passengers',
  onDelete: 'CASCADE'
});
OrderPassenger.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

// Train 与 TrainSeat 的关联关系
Train.hasMany(TrainSeat, {
  foreignKey: 'trainNumber',
  sourceKey: 'trainNumber',
  as: 'seats',
  onDelete: 'CASCADE'
});
TrainSeat.belongsTo(Train, {
  foreignKey: 'trainNumber',
  targetKey: 'trainNumber',
  as: 'train'
});

// User 与 Order 的关联关系
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User 与 Passenger 的关联关系
User.hasMany(Passenger, {
  foreignKey: 'user_id',
  as: 'passengers',
  onDelete: 'CASCADE'
});
Passenger.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

const models = {
  User,
  Order,
  OrderPassenger,
  Train,
  TrainSeat,
  Passenger,
  sequelize
};

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
};

// 同步数据库表结构
const syncDatabase = async (force = false) => {
  try {
    const alter = String(process.env.DB_DIALECT || '').toLowerCase() === 'mysql' && !force;
    await sequelize.sync({ force, alter });
    console.log('✅ 数据库表同步成功');
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error.message);
    throw error;
  }
};

module.exports = {
  ...models,
  testConnection,
  syncDatabase
};