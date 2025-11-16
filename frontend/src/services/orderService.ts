import { get, post, put } from './api';

export interface OrderData {
  trainInfo: {
    trainNumber: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    date: string;
    duration: string;
  };
  passengers: Array<{
    id: string;
    name: string;
    idCard: string;
    phone: string;
    passengerType: '成人' | '儿童' | '学生';
  }>;
  ticketInfos: Array<{
    passengerId: string;
    passengerName: string;
    seatType: string;
    ticketType: string;
    price: number;
  }>;
  totalPrice: number;
  selectedSeats?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  trainNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  passenger: string;
  seat: string;
  price: number;
  status: 'paid' | 'unpaid' | 'cancelled' | 'refunded';
}

// 创建订单
export const createOrder = async (orderData: OrderData): Promise<{ success: boolean; message: string; data: { id: string; orderId: string; order: any } }> => {
  try {
    const response = await post('/orders', {
      trainInfo: orderData.trainInfo,
      passengers: orderData.passengers,
      ticketInfos: orderData.ticketInfos,
      totalPrice: orderData.totalPrice,
      selectedSeats: orderData.selectedSeats || []
    });
    return response;
  } catch (error) {
    console.error('创建订单失败:', error);
    throw error;
  }
};

// 更新订单状态（支付）
export const updateOrderStatus = async (orderId: string, status: string, paymentMethod?: string): Promise<{ success: boolean }> => {
  try {
    const response = await put(`/orders/${orderId}/status`, {
      status,
      paymentMethod,
      paymentTime: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('更新订单状态失败:', error);
    throw error;
  }
};

// 获取用户订单列表
export const getUserOrders = async (page = 1, limit = 10, status?: string): Promise<{ orders: Order[]; pagination: { page: number; limit: number; total: number } }> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (status && status !== 'all') {
      params.append('status', status);
    }

    const response = await get(`/orders?${params}`);
    return response.data;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    throw error;
  }
};

// 获取订单详情
export const getOrderDetail = async (orderId: string): Promise<Order> => {
  try {
    const response = await get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    throw error;
  }
};

// 取消订单
export const cancelOrder = async (orderId: string): Promise<{ success: boolean }> => {
  try {
    const response = await put(`/orders/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('取消订单失败:', error);
    throw error;
  }
};