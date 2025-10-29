const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Passenger = sequelize.define('Passenger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '用户ID'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50]
    },
    comment: '乘车人姓名'
  },
  id_type: {
    type: DataTypes.ENUM('1', '2', '3'),
    allowNull: false,
    defaultValue: '1',
    comment: '1:中国居民身份证, 2:外国人永久身份证, 3:港澳台居民身份证'
  },
  id_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [15, 20]
    },
    comment: '身份证号'
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    validate: {
      is: /^1[3-9]\d{9}$/
    },
    comment: '手机号'
  },
  passenger_type: {
    type: DataTypes.ENUM('成人', '儿童', '学生'),
    allowNull: false,
    defaultValue: '成人',
    comment: '乘车人类型'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为默认乘车人（用户本人）'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'passengers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['user_id', 'is_default']
    },
    {
      fields: ['id_number']
    }
  ]
});

module.exports = Passenger;