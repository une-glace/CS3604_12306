const { sequelize } = require('../config/database');
const User = require('./User');
const Order = require('./Order');
const OrderPassenger = require('./OrderPassenger');
const Train = require('./Train');
const TrainSeat = require('./TrainSeat');
const Passenger = require('./Passenger');
const Address = require('./Address');

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

// User 与 Address 的关联关系
User.hasMany(Address, {
  foreignKey: 'user_id',
  as: 'addresses',
  onDelete: 'CASCADE'
});
Address.belongsTo(User, {
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
  Address,
  sequelize
};

const fixSqliteTrainSeatsUnique = async () => {
  const dialect = sequelize.getDialect();
  if (dialect !== 'sqlite') return;
  const [rows] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='train_seats';");
  const createSql = rows && rows[0] && rows[0].sql;
  if (!createSql) return;
  const hasBadUnique =
    /`train_number`[^,]*UNIQUE/i.test(createSql) ||
    /`date`[^,]*UNIQUE/i.test(createSql) ||
    /`seat_type`[^,]*UNIQUE/i.test(createSql);
  if (!hasBadUnique) return;
  await sequelize.transaction(async (t) => {
    await sequelize.query(
      "CREATE TABLE IF NOT EXISTS `train_seats_new` (`id` INTEGER PRIMARY KEY, `train_number` VARCHAR(20) NOT NULL REFERENCES `trains` (`train_number`), `date` DATE NOT NULL, `seat_type` TEXT NOT NULL, `total_seats` INTEGER NOT NULL, `available_seats` INTEGER NOT NULL, `price` DECIMAL(8,2) NOT NULL, `created_at` DATETIME, `updated_at` DATETIME);",
      { transaction: t }
    );
    await sequelize.query(
      "INSERT OR IGNORE INTO `train_seats_new` (`id`,`train_number`,`date`,`seat_type`,`total_seats`,`available_seats`,`price`,`created_at`,`updated_at`) SELECT `id`,`train_number`,`date`,`seat_type`,`total_seats`,`available_seats`,`price`,`created_at`,`updated_at` FROM `train_seats`;",
      { transaction: t }
    );
    await sequelize.query("DROP TABLE `train_seats`;", { transaction: t });
    await sequelize.query("ALTER TABLE `train_seats_new` RENAME TO `train_seats`;", { transaction: t });
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS `train_seats_train_number_date` ON `train_seats` (`train_number`, `date`);",
      { transaction: t }
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS `train_seats_seat_type` ON `train_seats` (`seat_type`);",
      { transaction: t }
    );
    await sequelize.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS `train_seats_train_number_date_seat_type` ON `train_seats` (`train_number`, `date`, `seat_type`);",
      { transaction: t }
    );
  });
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
    const alter = !force;
    const dialect = sequelize.getDialect();
    const opts = { force, alter };
    if (dialect === 'sqlite') {
      opts.alter = false;
    }
    await sequelize.sync(opts);
    console.log('✅ 数据库表同步成功');
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error.message);
    throw error;
  }
};

module.exports = {
  ...models,
  testConnection,
  syncDatabase,
  fixSqliteTrainSeatsUnique
};
