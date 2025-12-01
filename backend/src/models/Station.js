const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '车站名称'
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '车站代码（电报码）'
  },
  pinyin: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '拼音'
  },
  pinyinShort: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '拼音首字母'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '所属城市'
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
  tableName: 'stations',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['city']
    },
    {
      fields: ['pinyin']
    }
  ]
});

module.exports = Station;
