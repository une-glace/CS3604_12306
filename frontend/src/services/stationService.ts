import { get } from './api';

export interface Station {
  id: number;
  name: string;
  code: string;
  pinyin: string;
  pinyinShort: string;
  city: string;
}

export const searchStations = async (query: string): Promise<Station[]> => {
  if (!query) return [];
  return get(`/stations/search?q=${encodeURIComponent(query)}`);
};
