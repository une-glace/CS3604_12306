const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { seedData } = require('./scripts/seedData');

// 导入数据库和路由
const { testConnection, syncDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');
const trainRoutes = require('./routes/train');
const passengerRoutes = require('./routes/passenger');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/trains`, trainRoutes);
app.use(`${apiPrefix}/passengers`, passengerRoutes);

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '12306 像素级复刻 API 服务',
    version: '1.0.0',
    status: 'running',
    apiPrefix
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, async () => {
  console.log(`🚄 12306 API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
  
  // 测试数据库连接
  await testConnection();
  
  // 同步数据库表结构（开发/测试环境）
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    await syncDatabase(false);
    try {
      await seedData();
    } catch (e) {
      console.error('种子数据初始化失败:', e.message);
    }
  }
});

module.exports = app;
