const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;
if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'trae_12306',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 20, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, underscored: true, freezeTableName: true }
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true, freezeTableName: true }
  });
}

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    if (dialect !== 'mysql') {
      try {
        await sequelize.query('PRAGMA journal_mode=WAL;');
        await sequelize.query('PRAGMA busy_timeout=5000;');
      } catch {}
    }
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection
};