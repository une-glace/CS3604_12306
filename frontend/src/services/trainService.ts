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
  }
): Promise<SearchTrainItem[]> => {
  const qs = new URLSearchParams();
  qs.set('fromStation', params.fromStation);
  qs.set('toStation', params.toStation);
  qs.set('departureDate', params.departureDate);
  if (params.trainType) qs.set('trainType', params.trainType);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const resp = await get(`/trains/search?${qs.toString()}`);
  return (resp.data?.trains || resp.data?.data?.trains || []) as SearchTrainItem[];
};
