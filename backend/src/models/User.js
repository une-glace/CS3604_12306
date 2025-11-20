const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 30],
      is: /^[a-zA-Z][a-zA-Z0-9_ ]*$/
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50]
    }
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
    unique: true,
    validate: {
      len: [15, 20]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      // 允许中国手机号或通用 E.164（可带 +）
      is: /^(\+?[1-9]\d{6,14}|1[3-9]\d{9})$/
    }
  },
  country_code: {
    type: DataTypes.STRING(8),
    allowNull: false,
    defaultValue: '+86',
    comment: '电话国家/地区代码（如 +86, +1 等）'
  },
  passenger_type: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: false,
    defaultValue: '1',
    comment: '1:成人, 2:儿童'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['id_number']
    },
    {
      unique: true,
      fields: ['phone_number']
    },
    {
      fields: ['email']
    }
  ]
});

module.exports = User;