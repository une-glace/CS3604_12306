const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderPassenger = sequelize.define('OrderPassenger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id', // 映射到数据库字段名
    references: {
      model: 'orders',
      key: 'id'
    },
    comment: '订单ID'
  },
  passengerName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'passenger_name', // 映射到数据库字段名
    comment: '乘车人姓名'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: false,
    field: 'id_card', // 映射到数据库字段名
    comment: '身份证号'
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    comment: '手机号'
  },
  passengerType: {
    type: DataTypes.ENUM('成人', '儿童', '学生'),
    defaultValue: '成人',
    field: 'passenger_type', // 映射到数据库字段名
    comment: '乘车人类型'
  },
  seatType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'seat_type', // 映射到数据库字段名
    comment: '座位类型'
  },
  seatNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'seat_number', // 映射到数据库字段名
    comment: '座位号'
  },
  ticketType: {
    type: DataTypes.ENUM('成人票', '儿童票', '学生票'),
    defaultValue: '成人票',
    field: 'ticket_type', // 映射到数据库字段名
    comment: '票种类型'
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: '票价'
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
  tableName: 'order_passengers',
  timestamps: true,
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['id_card']
    }
  ]
});

module.exports = OrderPassenger;