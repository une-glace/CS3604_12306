const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_id', // 映射到数据库字段名
    comment: '订单号'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id', // 映射到数据库字段名
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '用户ID'
  },
  trainNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'train_number', // 映射到数据库字段名
    comment: '车次号'
  },
  fromStation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'from_station', // 映射到数据库字段名
    comment: '出发站'
  },
  toStation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'to_station', // 映射到数据库字段名
    comment: '到达站'
  },
  departureDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'departure_date', // 映射到数据库字段名
    comment: '出发日期'
  },
  departureTime: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'departure_time', // 映射到数据库字段名
    comment: '出发时间'
  },
  arrivalTime: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'arrival_time', // 映射到数据库字段名
    comment: '到达时间'
  },
  duration: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '行程时长'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price', // 映射到数据库字段名
    comment: '总价格'
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'cancelled', 'completed'),
    defaultValue: 'unpaid',
    comment: '订单状态：unpaid-未支付，paid-已支付，cancelled-已取消，completed-已完成'
  },
  paymentMethod: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'payment_method', // 映射到数据库字段名
    comment: '支付方式'
  },
  paymentTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_time', // 映射到数据库字段名
    comment: '支付时间'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at', // 映射到数据库字段名
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at', // 映射到数据库字段名
    comment: '更新时间'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['departure_date']
    }
  ]
});

module.exports = Order;