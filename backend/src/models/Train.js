const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Train = sequelize.define('Train', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trainNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '车次号'
  },
  trainType: {
    type: DataTypes.ENUM('G', 'D', 'C', 'Z', 'T', 'K'),
    allowNull: false,
    comment: '列车类型：G-高速，D-动车，C-城际，Z-直达，T-特快，K-快速'
  },
  fromStation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '始发站'
  },
  toStation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '终点站'
  },
  departureTime: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '发车时间'
  },
  arrivalTime: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '到达时间'
  },
  duration: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '行程时长'
  },
  distance: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '里程（公里）'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active',
    comment: '列车状态：active-运行中，inactive-停运，maintenance-检修'
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
  tableName: 'trains',
  timestamps: true,
  indexes: [
    {
      fields: ['train_number']
    },
    {
      fields: ['train_type']
    },
    {
      fields: ['from_station', 'to_station']
    }
  ]
});

module.exports = Train;