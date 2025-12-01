const { sequelize, Station } = require('../models');

const stations = [
  { name: '北京南', code: 'VNP', pinyin: 'beijingnan', pinyinShort: 'bjn', city: '北京' },
  { name: '北京西', code: 'BXP', pinyin: 'beijingxi', pinyinShort: 'bjx', city: '北京' },
  { name: '北京', code: 'BJP', pinyin: 'beijing', pinyinShort: 'bj', city: '北京' },
  { name: '北京朝阳', code: 'IFP', pinyin: 'beijingchaoyang', pinyinShort: 'bjcy', city: '北京' },
  
  { name: '上海虹桥', code: 'AOH', pinyin: 'shanghaihongqiao', pinyinShort: 'shhq', city: '上海' },
  { name: '上海', code: 'SHH', pinyin: 'shanghai', pinyinShort: 'sh', city: '上海' },
  { name: '上海南', code: 'SNH', pinyin: 'shanghainan', pinyinShort: 'shn', city: '上海' },
  
  { name: '广州南', code: 'IZQ', pinyin: 'guangzhounan', pinyinShort: 'gzn', city: '广州' },
  { name: '广州', code: 'GZQ', pinyin: 'guangzhou', pinyinShort: 'gz', city: '广州' },
  { name: '广州东', code: 'GGQ', pinyin: 'guangzhoudong', pinyinShort: 'gzd', city: '广州' },
  { name: '广州白云', code: 'GBQ', pinyin: 'guangzhoubaiyun', pinyinShort: 'gzby', city: '广州' },

  { name: '深圳北', code: 'IOQ', pinyin: 'shenzhenbei', pinyinShort: 'szb', city: '深圳' },
  { name: '深圳', code: 'SZQ', pinyin: 'shenzhen', pinyinShort: 'sz', city: '深圳' },
  { name: '福田', code: 'NZQ', pinyin: 'futian', pinyinShort: 'ft', city: '深圳' },

  { name: '南京南', code: 'NKH', pinyin: 'nanjingnan', pinyinShort: 'njn', city: '南京' },
  { name: '南京', code: 'NJH', pinyin: 'nanjing', pinyinShort: 'nj', city: '南京' },

  { name: '杭州东', code: 'HGH', pinyin: 'hangzhoudong', pinyinShort: 'hzd', city: '杭州' },
  { name: '杭州', code: 'HZH', pinyin: 'hangzhou', pinyinShort: 'hz', city: '杭州' },
  { name: '杭州西', code: 'IXH', pinyin: 'hangzhouxi', pinyinShort: 'hzx', city: '杭州' },

  { name: '武汉', code: 'WHN', pinyin: 'wuhan', pinyinShort: 'wh', city: '武汉' },
  { name: '汉口', code: 'HKN', pinyin: 'hankou', pinyinShort: 'hk', city: '武汉' },
  { name: '武昌', code: 'WCN', pinyin: 'wuchang', pinyinShort: 'wc', city: '武汉' },

  { name: '长沙南', code: 'CWQ', pinyin: 'changshanan', pinyinShort: 'csn', city: '长沙' },
  { name: '长沙', code: 'CSQ', pinyin: 'changsha', pinyinShort: 'cs', city: '长沙' },

  { name: '成都东', code: 'ICW', pinyin: 'chengdudong', pinyinShort: 'cdd', city: '成都' },
  { name: '成都南', code: 'CNW', pinyin: 'chengdunan', pinyinShort: 'cdn', city: '成都' },
  { name: '成都西', code: 'CMW', pinyin: 'chengduxi', pinyinShort: 'cdx', city: '成都' },

  { name: '重庆北', code: 'CUW', pinyin: 'chongqingbei', pinyinShort: 'cqb', city: '重庆' },
  { name: '重庆西', code: 'CXW', pinyin: 'chongqingxi', pinyinShort: 'cqx', city: '重庆' },
  { name: '沙坪坝', code: 'CYW', pinyin: 'shapingba', pinyinShort: 'spb', city: '重庆' },

  { name: '西安北', code: 'EAY', pinyin: 'xianbei', pinyinShort: 'xab', city: '西安' },
  { name: '西安', code: 'XAY', pinyin: 'xian', pinyinShort: 'xa', city: '西安' },

  { name: '郑州东', code: 'ZAF', pinyin: 'zhengzhoudong', pinyinShort: 'zzd', city: '郑州' },
  { name: '郑州', code: 'ZZF', pinyin: 'zhengzhou', pinyinShort: 'zz', city: '郑州' },

  { name: '合肥南', code: 'ENH', pinyin: 'hefeinan', pinyinShort: 'hfn', city: '合肥' },
  { name: '合肥', code: 'HFH', pinyin: 'hefei', pinyinShort: 'hf', city: '合肥' },

  { name: '苏州', code: 'SZH', pinyin: 'suzhou', pinyinShort: 'sz', city: '苏州' },
  { name: '苏州北', code: 'OHH', pinyin: 'suzhoubei', pinyinShort: 'szb', city: '苏州' },
  { name: '苏州园区', code: 'KAH', pinyin: 'suzhouyuanqu', pinyinShort: 'szyq', city: '苏州' },

  { name: '天津', code: 'TJP', pinyin: 'tianjin', pinyinShort: 'tj', city: '天津' },
  { name: '天津西', code: 'TXP', pinyin: 'tianjinxi', pinyinShort: 'tjx', city: '天津' },
  { name: '天津南', code: 'TIP', pinyin: 'tianjinnan', pinyinShort: 'tjn', city: '天津' },

  { name: '石家庄', code: 'SJP', pinyin: 'shijiazhuang', pinyinShort: 'sjz', city: '石家庄' },
  
  { name: '太原南', code: 'TNV', pinyin: 'taiyuannan', pinyinShort: 'tyn', city: '太原' },
  { name: '太原', code: 'TYV', pinyin: 'taiyuan', pinyinShort: 'ty', city: '太原' },

  { name: '济南西', code: 'JGK', pinyin: 'jinanxi', pinyinShort: 'jnx', city: '济南' },
  { name: '济南', code: 'JNK', pinyin: 'jinan', pinyinShort: 'jn', city: '济南' },
  { name: '济南东', code: 'MDC', pinyin: 'jinandong', pinyinShort: 'jnd', city: '济南' },

  { name: '青岛', code: 'QDK', pinyin: 'qingdao', pinyinShort: 'qd', city: '青岛' },
  { name: '青岛北', code: 'QHK', pinyin: 'qingdaobei', pinyinShort: 'qdb', city: '青岛' },

  { name: '沈阳北', code: 'SBT', pinyin: 'shenyangbei', pinyinShort: 'syb', city: '沈阳' },
  { name: '沈阳', code: 'SYT', pinyin: 'shenyang', pinyinShort: 'sy', city: '沈阳' },

  { name: '长春', code: 'CCT', pinyin: 'changchun', pinyinShort: 'cc', city: '长春' },
  { name: '长春西', code: 'CRT', pinyin: 'changchunxi', pinyinShort: 'ccx', city: '长春' },

  { name: '哈尔滨西', code: 'VAB', pinyin: 'haerbinxi', pinyinShort: 'hebx', city: '哈尔滨' },
  { name: '哈尔滨', code: 'HBB', pinyin: 'haerbin', pinyinShort: 'heb', city: '哈尔滨' },

  { name: '福州', code: 'FZS', pinyin: 'fuzhou', pinyinShort: 'fz', city: '福州' },
  { name: '福州南', code: 'FYS', pinyin: 'fuzhounan', pinyinShort: 'fzn', city: '福州' },

  { name: '厦门', code: 'XMS', pinyin: 'xiamen', pinyinShort: 'xm', city: '厦门' },
  { name: '厦门北', code: 'XKS', pinyin: 'xiamenbei', pinyinShort: 'xmb', city: '厦门' },

  { name: '南昌西', code: 'NXG', pinyin: 'nanchangxi', pinyinShort: 'ncx', city: '南昌' },
  { name: '南昌', code: 'NCG', pinyin: 'nanchang', pinyinShort: 'nc', city: '南昌' },

  { name: '贵阳北', code: 'KQW', pinyin: 'guiyangbei', pinyinShort: 'gyb', city: '贵阳' },
  { name: '贵阳', code: 'GIW', pinyin: 'guiyang', pinyinShort: 'gy', city: '贵阳' },

  { name: '昆明南', code: 'KOM', pinyin: 'kunmingnan', pinyinShort: 'kmn', city: '昆明' },
  { name: '昆明', code: 'KMM', pinyin: 'kunming', pinyinShort: 'km', city: '昆明' },

  { name: '南宁东', code: 'NFZ', pinyin: 'nanningdong', pinyinShort: 'nnd', city: '南宁' },
  { name: '南宁', code: 'NNZ', pinyin: 'nanning', pinyinShort: 'nn', city: '南宁' },

  { name: '兰州西', code: 'LAJ', pinyin: 'lanzhouxi', pinyinShort: 'lzx', city: '兰州' },
  { name: '兰州', code: 'LZJ', pinyin: 'lanzhou', pinyinShort: 'lz', city: '兰州' },

  { name: '乌鲁木齐', code: 'WAR', pinyin: 'wulumuqi', pinyinShort: 'wlmq', city: '乌鲁木齐' },

  { name: '呼和浩特东', code: 'NDC', pinyin: 'huhehaotedong', pinyinShort: 'hhhtd', city: '呼和浩特' },
  { name: '呼和浩特', code: 'HHC', pinyin: 'huhehaote', pinyinShort: 'hhht', city: '呼和浩特' },

  { name: '银川', code: 'YIJ', pinyin: 'yinchuan', pinyinShort: 'yc', city: '银川' },

  { name: '西宁', code: 'XNO', pinyin: 'xining', pinyinShort: 'xn', city: '西宁' },

  { name: '海口东', code: 'KEQ', pinyin: 'haikoudong', pinyinShort: 'hkd', city: '海口' },
  { name: '三亚', code: 'SEQ', pinyin: 'sanya', pinyinShort: 'sy', city: '三亚' }
];

async function seedStations() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步模型，创建表
    await Station.sync({ force: true });
    console.log('Stations 表已重建');

    // 批量插入
    await Station.bulkCreate(stations);
    console.log(`成功插入 ${stations.length} 个车站数据`);

    process.exit(0);
  } catch (error) {
    console.error('车站数据初始化失败:', error);
    process.exit(1);
  }
}

seedStations();
