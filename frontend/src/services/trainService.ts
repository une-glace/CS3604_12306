import { get } from './api';

export interface SeatInfoItem {
  totalSeats: number;
  availableSeats: number;
  price: number;
  isAvailable: boolean;
}

export interface TrainDetail {
  trainNumber: string;
  trainType: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  seatInfo: Record<string, SeatInfoItem>;
}

// 获取车次详情（含座位信息）
export const getTrainDetail = async (
  trainNumber: string,
  date: string
): Promise<TrainDetail> => {
  const resp = await get(`/trains/${encodeURIComponent(trainNumber)}?date=${encodeURIComponent(date)}`);
  return resp.data.train as TrainDetail;
};

export interface SearchTrainItem {
  trainNumber: string;
  trainType: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  seatInfo: Record<string, {
    totalSeats: number;
    availableSeats: number;
    price: number;
    isAvailable: boolean;
  }>;
}

export const searchTrains = async (
  params: {
    fromStation: string;
    toStation: string;
    departureDate: string;
    trainType?: string;
    page?: number;
    limit?: number;
    fromStations?: string[]; // 支持多车站查询
    toStations?: string[];   // 支持多车站查询
  }
): Promise<SearchTrainItem[]> => {
  const qs = new URLSearchParams();
  
  // 如果有多个出发车站，使用数组格式
  if (params.fromStations && params.fromStations.length > 0) {
    params.fromStations.forEach(station => {
      qs.append('fromStations', station);
    });
  } else {
    qs.set('fromStation', params.fromStation);
  }
  
  // 如果有多个到达车站，使用数组格式
  if (params.toStations && params.toStations.length > 0) {
    params.toStations.forEach(station => {
      qs.append('toStations', station);
    });
  } else {
    qs.set('toStation', params.toStation);
  }
  
  qs.set('departureDate', params.departureDate);
  if (params.trainType) qs.set('trainType', params.trainType);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const resp = await get(`/trains/search?${qs.toString()}`);
  return (resp.data?.trains || resp.data?.data?.trains || []) as SearchTrainItem[];
};
