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
export const createOrder = async (orderData: OrderData): Promise<{ success: boolean; message: string; data: { id: string; orderId: string; order: unknown } }> => {
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
    const data = (response && response.data && (response.data.order || response.data)) || response;
    return data as unknown as Order;
  } catch (error: unknown) {
    const msg = String((error as Error)?.message || '');
    const isNotFound = msg.includes('订单不存在') || msg.includes('status: 404');
    (isNotFound ? console.warn : console.error)('获取订单详情失败:', error);
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

// 改签订单
export const changeOrder = async (payload: {
  oldOrderId: string;
  newTrainInfo: Record<string, unknown>;
  passengers: Array<Record<string, unknown>>;
  totalPrice: number;
  selectedSeats?: string[];
}): Promise<{ success: boolean; newOrderId?: string }> => {
  try {
    const response = await post('/orders/change', payload);
    const newOrderId = (response?.data?.data?.newOrderId ?? response?.data?.newOrderId) as string | undefined;
    const success = Boolean(response?.data?.success ?? (newOrderId ? true : false));
    return { success, newOrderId };
  } catch (error) {
    console.error('改签订单失败:', error);
    throw error;
  }
};

// 为页面提供格式化后的订单列表（纯函数式映射）
export interface FormattedOrder {
  id: string;
  orderNumber: string;
  trainNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  bookDate?: string;
  tripDate?: string;
  passenger: string;
  seat: string;
  passengers?: Array<{ name: string; seatNumber?: string; seatType?: string; carriage?: string | number }>;
  price: number;
  status: 'paid' | 'unpaid' | 'cancelled' | 'refunded' | 'completed' | 'changed';
}

export const fetchUserOrdersFormatted = async (page = 1, limit = 10, status?: string): Promise<{ orders: FormattedOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const data = await getUserOrders(page, limit, status);
  const formatted: FormattedOrder[] = (data.orders || []).map((order: unknown) => {
    const o = order as {
      id?: string;
      orderId?: string;
      orderNumber?: string;
      trainNumber?: string;
      fromStation?: string;
      toStation?: string;
      departure?: string;
      arrival?: string;
      departureTime?: string;
      arrivalTime?: string;
      departureDate?: string;
      date?: string;
      orderDate?: string;
      bookDate?: string;
      createdAt?: unknown;
      passengers?: Array<{ passengerName?: string; name?: string; seatNumber?: string; seatType?: string; carriage?: string | number }>;
      seat?: string;
      totalPrice?: number;
      price?: number;
      passenger?: string;
      status?: string;
    };
    return {
      id: o.id || '',
      orderNumber: o.orderId || o.orderNumber || '',
      trainNumber: o.trainNumber || '',
      departure: o.fromStation || o.departure || '',
      arrival: o.toStation || o.arrival || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      date: o.departureDate || o.date || '',
      bookDate: o.orderDate || o.bookDate || (o.createdAt ? String(o.createdAt).slice(0, 10) : undefined),
      tripDate: o.departureDate || o.date || '',
      passenger: (o.passengers && o.passengers[0]?.passengerName) ? String(o.passengers[0]!.passengerName) : (o.passenger || '未知'),
      seat: (o.passengers && o.passengers[0]?.seatNumber) ? String(o.passengers[0]!.seatNumber) : (o.seat || '待分配'),
      passengers: Array.isArray(o.passengers)
        ? o.passengers.map(p => ({
            name: p.passengerName || p.name || '未知',
            seatNumber: p.seatNumber,
            seatType: p.seatType,
            carriage: p.carriage,
          }))
        : undefined,
      price: o.totalPrice ?? o.price ?? 0,
      status: (
        o.status === 'unpaid' ? 'unpaid' :
        o.status === 'paid' ? 'paid' :
        o.status === 'cancelled' ? 'cancelled' :
        o.status === 'refunded' ? 'refunded' :
        o.status === 'completed' ? 'completed' : 
        o.status === 'changed' ? 'changed' : 'unpaid'
      ) as FormattedOrder['status']
    };
  });
  const total = (data.pagination?.total ?? formatted.length);
  const lim = (data.pagination?.limit ?? limit);
  return {
    orders: formatted,
    pagination: {
      page: data.pagination?.page ?? page,
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim)
    }
  };
};
