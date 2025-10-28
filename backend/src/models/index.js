const { sequelize } = require('../config/database');
const User = require('./User');

// 定义模型关联关系
// 目前只有User模型，后续可以添加其他模型和关联

const models = {
  User,
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
    await sequelize.sync({ force });
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