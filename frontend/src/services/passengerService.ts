import { get, post, put, del } from './api';

export interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
  idType?: string; // '1' | '2' | '3'
  isDefault?: boolean;
}

export interface PassengerFormData {
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
}

// 获取用户的所有乘车人
export const getPassengers = async (): Promise<Passenger[]> => {
  try {
    const response = await get('/passengers');
    return response.data || [];
  } catch (error) {
    console.error('获取乘车人列表失败:', error);
    throw error;
  }
};

// 添加乘车人
export const addPassenger = async (passengerData: PassengerFormData): Promise<Passenger> => {
  try {
    const response = await post('/passengers', passengerData);
    return response.data;
  } catch (error) {
    console.error('添加乘车人失败:', error);
    throw error;
  }
};

// 更新乘车人
export const updatePassenger = async (id: string, passengerData: PassengerFormData): Promise<Passenger> => {
  try {
    const response = await put(`/passengers/${id}`, passengerData);
    return response.data;
  } catch (error) {
    console.error('更新乘车人失败:', error);
    throw error;
  }
};

// 删除乘车人
export const deletePassenger = async (id: string): Promise<void> => {
  try {
    await del(`/passengers/${id}`);
  } catch (error) {
    console.error('删除乘车人失败:', error);
    throw error;
  }
};