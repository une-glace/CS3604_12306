const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Address = sequelize.define('Address', {
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
  recipient_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { len: [2, 50] },
    comment: '收件人姓名'
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { is: /^(\+?[1-9]\d{6,14}|1[3-9]\d{9})$/ },
    comment: '收件人手机号'
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '省市区'
  },
  detail: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '详细地址'
  },
  zipcode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: { is: /^\d{6}$/ },
    comment: '邮编（可选）'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为默认地址'
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
  tableName: 'addresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'is_default'] }
  ]
});

module.exports = Address;
