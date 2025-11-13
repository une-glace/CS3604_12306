/**
 * 城市到车站的映射工具
 * 支持模糊匹配和精确匹配
 */

export interface CityStation {
  city: string;
  stations: string[];
}

// 城市到车站的映射
export const CITY_STATION_MAP: Record<string, string[]> = {
  '北京': ['北京南', '北京西'],
  '上海': ['上海', '上海虹桥'],
  '南京': ['南京南'],
  '广州': ['广州南'],
  '深圳': ['深圳北'],
  '西安': ['西安北'],
};

// 反向映射：车站到城市
export const STATION_CITY_MAP: Record<string, string> = {};
Object.entries(CITY_STATION_MAP).forEach(([city, stations]) => {
  stations.forEach(station => {
    STATION_CITY_MAP[station] = city;
  });
});

/**
 * 获取城市对应的所有车站
 */
export const getStationsByCity = (city: string): string[] => {
  // 精确匹配
  if (CITY_STATION_MAP[city]) {
    return CITY_STATION_MAP[city];
  }
  
  // 模糊匹配
  const matchedCity = Object.keys(CITY_STATION_MAP).find(key => 
    key.includes(city) || city.includes(key)
  );
  
  return matchedCity ? CITY_STATION_MAP[matchedCity] : [];
};

/**
 * 获取车站对应的城市
 */
export const getCityByStation = (station: string): string => {
  return STATION_CITY_MAP[station] || station;
};

/**
 * 判断输入的是城市还是车站
 */
export const isCityInput = (input: string): boolean => {
  // 如果精确匹配城市名，返回true
  if (CITY_STATION_MAP[input]) {
    return true;
  }
  
  // 如果模糊匹配城市名，返回true
  const matchedCity = Object.keys(CITY_STATION_MAP).find(key => 
    key.includes(input) || input.includes(key)
  );
  
  if (matchedCity) {
    return true;
  }
  
  // 如果是已知的车站，返回false
  if (STATION_CITY_MAP[input]) {
    return false;
  }
  
  // 默认认为是城市
  return true;
};

/**
 * 获取所有城市列表
 */
export const getAllCities = (): string[] => {
  return Object.keys(CITY_STATION_MAP);
};

/**
 * 获取所有车站列表
 */
export const getAllStations = (): string[] => {
  return Object.keys(STATION_CITY_MAP);
};

/**
 * 智能解析输入，返回城市和车站列表
 */
export const parseCityStationInput = (input: string): {
  isCity: boolean;
  city?: string;
  stations: string[];
} => {
  const stations = getStationsByCity(input);
  
  if (stations.length > 0) {
    // 是城市输入
    return {
      isCity: true,
      city: input,
      stations
    };
  } else {
    // 是车站输入或未知输入
    return {
      isCity: false,
      stations: [input]
    };
  }
};