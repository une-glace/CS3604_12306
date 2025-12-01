const { Station } = require('../models');
const { Op } = require('sequelize');

const searchStations = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    // 限制返回数量，避免过多
    const stations = await Station.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `${q}%` } },       // 中文前缀匹配
          { pinyin: { [Op.like]: `${q.toLowerCase()}%` } }, // 拼音前缀匹配
          { pinyinShort: { [Op.like]: `${q.toLowerCase()}%` } } // 简拼前缀匹配
        ]
      },
      limit: 10,
      order: [['pinyin', 'ASC']] // 按拼音排序
    });

    res.json(stations);
  } catch (error) {
    console.error('搜索车站失败:', error);
    res.status(500).json({ error: '搜索车站失败' });
  }
};

module.exports = {
  searchStations
};
