import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AddPassengerModal from '../components/AddPassengerModal';
import OrderConfirmModal from '../components/OrderConfirmModal';
import OrderProcessing from '../components/OrderProcessing';
import PaymentModal from '../components/PaymentModal';
import './OrderPage.css';

interface TrainInfo {
  trainNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  duration: string;
  seatType: string;
  price: number;
}

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
}

interface TicketInfo {
  passengerId: string;
  passengerName: string;
  seatType: string;
  ticketType: '成人票' | '儿童票' | '学生票';
  price: number;
}

interface OrderData {
  orderId: string;
  backendOrderId?: string; // 后端返回的订单ID
  totalPrice: number;
  passengers: Passenger[];
  ticketInfos: TicketInfo[];
}

const OrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trainInfo, setTrainInfo] = useState<TrainInfo | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [ticketInfos, setTicketInfos] = useState<TicketInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // 从路由参数获取列车信息
    const searchParams = new URLSearchParams(location.search);
    const trainData = {
      trainNumber: searchParams.get('trainNumber') || 'G1234',
      from: searchParams.get('from') || '北京南',
      to: searchParams.get('to') || '上海虹桥',
      departureTime: searchParams.get('departureTime') || '08:00',
      arrivalTime: searchParams.get('arrivalTime') || '12:30',
      date: searchParams.get('date') || '2025-01-20',
      duration: searchParams.get('duration') || '4小时30分',
      seatType: searchParams.get('seatType') || '二等座',
      price: parseInt(searchParams.get('price') || '553')
    };
    setTrainInfo(trainData);

    // 从后端API获取用户的乘车人信息
    const fetchPassengers = async () => {
      try {
        const { getPassengers } = await import('../services/passengerService');
        const passengerList = await getPassengers();
        setPassengers(passengerList);
      } catch (error) {
        console.error('获取乘车人信息失败:', error);
        // 如果获取失败，使用空数组
        setPassengers([]);
      }
    };

    fetchPassengers();
  }, [location]);

  const handlePassengerSelect = (passengerId: string) => {
    const isSelected = selectedPassengers.includes(passengerId);
    if (isSelected) {
      setSelectedPassengers(prev => prev.filter(id => id !== passengerId));
      setTicketInfos(prev => prev.filter(info => info.passengerId !== passengerId));
    } else {
      setSelectedPassengers(prev => [...prev, passengerId]);
      const passenger = passengers.find(p => p.id === passengerId);
      if (passenger && trainInfo) {
        const newTicketInfo: TicketInfo = {
          passengerId: passenger.id,
          passengerName: passenger.name,
          seatType: trainInfo.seatType,
          ticketType: passenger.passengerType === '成人' ? '成人票' : 
                     passenger.passengerType === '儿童' ? '儿童票' : '学生票',
          price: trainInfo.price
        };
        setTicketInfos(prev => [...prev, newTicketInfo]);
      }
    }
  };

  const handleSeatTypeChange = (passengerId: string, seatType: string) => {
    setTicketInfos(prev => prev.map(info => 
      info.passengerId === passengerId 
        ? { ...info, seatType, price: getSeatPrice(seatType) }
        : info
    ));
  };

  const getSeatPrice = (seatType: string): number => {
    const basePrices: { [key: string]: number } = {
      '商务座': 1748,
      '一等座': 933,
      '二等座': 553,
      '无座': 553
    };
    return basePrices[seatType] || 553;
  };

  const getTotalPrice = (): number => {
    return ticketInfos.reduce((total, info) => total + info.price, 0);
  };

  const handleSubmitOrder = async () => {
    if (selectedPassengers.length === 0) {
      alert('请选择乘车人');
      return;
    }

    // 验证所有必要信息
    const hasIncompleteInfo = ticketInfos.some(info => !info.seatType || !info.passengerName);
    if (hasIncompleteInfo) {
      alert('请完善所有乘车人的购票信息');
      return;
    }

    // 显示确认模态框
    setIsConfirmModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsConfirmModalOpen(false);
    
    if (!trainInfo) {
      alert('列车信息不完整');
      return;
    }
    
    // 构建订单数据，过滤掉undefined的乘客
    const validPassengers = selectedPassengers
      .map(id => passengers.find(p => p.id === id))
      .filter((p): p is Passenger => p !== undefined);
    
    if (validPassengers.length === 0) {
      alert('未找到有效的乘车人信息');
      return;
    }
    
    const newOrderData: OrderData = {
      orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalPrice: getTotalPrice(),
      passengers: validPassengers,
      ticketInfos: ticketInfos
    };
    
    setOrderData(newOrderData);
    setIsProcessingOpen(true);
  };

  const handleProcessingComplete = async () => {
    setIsProcessingOpen(false);
    
    if (!trainInfo || !orderData) {
      alert('订单信息不完整');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 调用后端API创建订单
      const { createOrder } = await import('../services/orderService');
      
      const orderPayload = {
        trainInfo: {
          trainNumber: trainInfo.trainNumber,
          from: trainInfo.from,
          to: trainInfo.to,
          departureTime: trainInfo.departureTime,
          arrivalTime: trainInfo.arrivalTime,
          date: trainInfo.date,
          duration: trainInfo.duration
        },
        passengers: orderData.passengers,
        ticketInfos: orderData.ticketInfos,
        totalPrice: orderData.totalPrice
      };
      
      console.log('提交订单数据:', orderPayload);
      const response = await createOrder(orderPayload);
      console.log('后端响应数据:', response); // 添加调试日志
      
      if (response && response.data && response.data.id) {
        // 更新订单数据，保存后端返回的订单ID
        setOrderData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            orderId: response.data.orderId || prev.orderId,
            backendOrderId: response.data.id // 保存后端订单ID用于后续支付状态更新
          };
        });
        
        // 订单创建成功，打开支付模态框
        setIsPaymentModalOpen(true);
      } else {
        console.log('响应数据格式不正确:', response); // 添加调试日志
        throw new Error('订单提交失败');
      }
    } catch (error) {
      console.error('订单提交错误:', error);
      alert(`订单提交失败：${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!orderData) {
      alert('订单信息不完整');
      return;
    }
    
    try {
      // 更新订单支付状态
      const { updateOrderStatus } = await import('../services/orderService');
      
      if (orderData.backendOrderId) {
        await updateOrderStatus(orderData.backendOrderId, 'paid', 'alipay');
        console.log('订单支付状态已更新');
      }
      
      setIsPaymentModalOpen(false);
      alert(`支付成功！\n订单号：${orderData.orderId}\n总金额：¥${orderData.totalPrice}`);
      // 导航到订单详情页面或首页
      navigate('/');
    } catch (error) {
      console.error('更新支付状态失败:', error);
      // 即使更新状态失败，也显示支付成功（因为支付本身是成功的）
      setIsPaymentModalOpen(false);
      alert(`支付成功！\n订单号：${orderData.orderId}\n总金额：¥${orderData.totalPrice}\n注意：订单状态可能需要稍后更新`);
      navigate('/');
    }
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
    // 可以选择导航到订单列表页面，让用户稍后支付
    alert('支付已取消，您可以在订单中心继续支付');
    navigate('/');
  };

  const handleAddPassenger = async (passengerData: Omit<Passenger, 'id'>) => {
    try {
      // 调用后端API保存乘车人到数据库
      const { addPassenger } = await import('../services/passengerService');
      const newPassenger = await addPassenger(passengerData);
      setPassengers(prev => [...prev, newPassenger]);
    } catch (error) {
      console.error('添加乘车人失败:', error);
      alert('添加乘车人失败，请稍后重试');
    }
  };

  if (!trainInfo) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="order-page">
      <div className="order-container">
        <div className="order-header">
          <h2>确认订单信息</h2>
          <div className="breadcrumb">
            <span>车票预订</span>
            <span className="separator">&gt;</span>
            <span className="current">确认订单</span>
          </div>
        </div>

        {/* 列车信息 */}
        <div className="train-info-section">
          <div className="section-header">
            <h3>列车信息</h3>
          </div>
          <div className="train-info-card">
            <div className="train-number">{trainInfo.trainNumber}</div>
            <div className="train-route">
              <div className="departure">
                <div className="station">{trainInfo.from}</div>
                <div className="time">{trainInfo.departureTime}</div>
              </div>
              <div className="duration">
                <div className="arrow">→</div>
                <div className="time-duration">{trainInfo.duration}</div>
              </div>
              <div className="arrival">
                <div className="station">{trainInfo.to}</div>
                <div className="time">{trainInfo.arrivalTime}</div>
              </div>
            </div>
            <div className="train-date">{trainInfo.date}</div>
          </div>
        </div>

        {/* 乘客信息 */}
        <div className="passenger-section">
          <div className="section-header">
            <h3>选择乘车人</h3>
            <button className="add-passenger-btn" onClick={() => setIsModalOpen(true)}>+ 添加乘车人</button>
          </div>
          <div className="passenger-list">
            {passengers.map(passenger => (
              <div 
                key={passenger.id} 
                className={`passenger-item ${selectedPassengers.includes(passenger.id) ? 'selected' : ''}`}
                onClick={() => handlePassengerSelect(passenger.id)}
              >
                <div className="passenger-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedPassengers.includes(passenger.id)}
                    onChange={() => {}}
                  />
                </div>
                <div className="passenger-info">
                  <div className="passenger-name">{passenger.name}</div>
                  <div className="passenger-id">{passenger.idCard}</div>
                  <div className={`passenger-type ${passenger.passengerType === '成人' ? 'adult' : passenger.passengerType === '儿童' ? 'child' : 'student'}`}>
                    {passenger.passengerType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 购票信息 */}
        {ticketInfos.length > 0 && (
          <div className="ticket-info-section">
            <div className="section-header">
              <h3>购票信息</h3>
            </div>
            <div className="ticket-table">
              <div className="table-header">
                <div className="col-passenger">乘车人</div>
                <div className="col-ticket-type">票种</div>
                <div className="col-seat-type">席别</div>
                <div className="col-price">票价</div>
              </div>
              {ticketInfos.map(info => (
                <div key={info.passengerId} className="table-row">
                  <div className="col-passenger">{info.passengerName}</div>
                  <div className="col-ticket-type">{info.ticketType}</div>
                  <div className="col-seat-type">
                    <select 
                      value={info.seatType}
                      onChange={(e) => handleSeatTypeChange(info.passengerId, e.target.value)}
                    >
                      <option value="商务座">商务座</option>
                      <option value="一等座">一等座</option>
                      <option value="二等座">二等座</option>
                      <option value="无座">无座</option>
                    </select>
                  </div>
                  <div className="col-price">¥{info.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 订单总计 */}
        {ticketInfos.length > 0 && (
          <div className="order-summary">
            <div className="summary-content">
              <div className="total-info">
                <span className="total-label">总计：</span>
                <span className="total-price">¥{getTotalPrice()}</span>
              </div>
              <button 
                className="submit-order-btn"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 添加乘车人模态框 */}
      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPassenger}
      />
      
      {/* 订单确认模态框 */}
      <OrderConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        trainInfo={trainInfo}
        passengers={passengers}
        ticketInfos={ticketInfos}
        totalPrice={getTotalPrice()}
      />
      
      {/* 订单处理界面 */}
      <OrderProcessing
        isOpen={isProcessingOpen}
        onComplete={handleProcessingComplete}
        orderData={orderData ? {
          orderId: orderData.orderId,
          trainInfo: trainInfo,
          passengers: orderData.passengers,
          totalPrice: orderData.totalPrice
        } : {
          orderId: '',
          trainInfo: null,
          passengers: [],
          totalPrice: 0
        }}
      />
      
      {/* 支付模态框 */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentClose}
        onPaymentSuccess={handlePaymentSuccess}
        orderData={orderData && trainInfo ? {
          orderId: orderData.orderId,
          totalPrice: orderData.totalPrice,
          trainNumber: trainInfo.trainNumber,
          fromStation: trainInfo.from,
          toStation: trainInfo.to,
          departureDate: trainInfo.date,
          passengerCount: orderData.passengers.length
        } : {
          orderId: '',
          totalPrice: 0,
          trainNumber: '',
          fromStation: '',
          toStation: '',
          departureDate: '',
          passengerCount: 0
        }}
      />
    </div>
  );
};

export default OrderPage;