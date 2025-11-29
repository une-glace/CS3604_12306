const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TrainSeat = sequelize.define('TrainSeat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trainNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'trains',
      key: 'train_number'
    },
    comment: '车次号'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '运行日期'
  },
  seatType: {
    type: DataTypes.ENUM('商务座', '特等座', '优选一等座', '一等座', '二等座', '硬卧', '软卧', '硬座', '无座'),
    allowNull: false,
    comment: '座位类型'
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '总座位数'
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '可用座位数'
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: '票价'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'train_seats',
  timestamps: true,
  indexes: [
    {
      fields: ['train_number', 'date']
    },
    {
      fields: ['seat_type']
    },
    {
      unique: true,
      fields: ['train_number', 'date', 'seat_type']
    }
  ]
});

module.exports = TrainSeat;
