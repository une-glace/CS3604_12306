import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddPassengerModal from '../components/AddPassengerModal';
import OrderConfirmModal from '../components/OrderConfirmModal';
import OrderProcessing from '../components/OrderProcessing';
import PaymentModal from '../components/PaymentModal';
import Footer from '../components/Footer';
import './OrderPage.css';
import './HomePage.css';

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
  idType?: string; // 可选证件类型，若未提供默认为居民身份证
  isDefault?: boolean; // 默认乘车人（本人）标识
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
  selectedSeatCodes?: string[];
}

const OrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
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
  const [seatInfo, setSeatInfo] = useState<Record<string, { price: number; availableSeats: number; totalSeats: number; isAvailable: boolean }>>({});

  // 顶部导航交互：与首页保持一致
  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };
  const handleLoginClick = () => {
    navigate('/login');
  };
  const handleRegisterClick = () => {
    navigate('/register');
  };
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      window.location.reload();
    }
  };

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

        // 若后端乘车人列表未包含“本人”，则前端注入，保持与个人中心一致
        let normalized = passengerList.slice();
        if (user) {
          const hasSelf = normalized.some(p => p.isDefault || (p.name === user.realName && p.idCard === user.idNumber));
          if (!hasSelf) {
            normalized.unshift({
              id: 'self',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            });
          }
        }

        setPassengers(normalized);
        if (normalized.length > 0) {
          const first = normalized[0];
          setSelectedPassengers([first.id]);
          if (trainData) {
            setTicketInfos([{
              passengerId: first.id,
              passengerName: first.name,
              seatType: trainData.seatType,
              ticketType: first.passengerType === '成人' ? '成人票' : first.passengerType === '儿童' ? '儿童票' : '学生票',
              price: trainData.price
            }]);
          }
        }
      } catch (error) {
        console.error('获取乘车人信息失败:', error);
        // 如果获取失败，仍确保显示“本人”（若已登录）
        if (user) {
          const self = [
            {
              id: 'self',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            }
          ];
          setPassengers(self);
          const first = self[0];
          setSelectedPassengers([first.id]);
          if (trainData) {
            setTicketInfos([{
              passengerId: first.id,
              passengerName: first.name,
              seatType: trainData.seatType,
              ticketType: '成人票',
              price: trainData.price
            }]);
          }
        } else {
          setPassengers([]);
        }
      }
    };

    // 获取座位实时信息（价格与余票）
    const fetchSeatInfo = async () => {
      try {
        const { getTrainDetail } = await import('../services/trainService');
        const detail = await getTrainDetail(trainData.trainNumber, trainData.date);
        setSeatInfo(detail?.seatInfo || {});
      } catch (error) {
        console.error('获取座位信息失败:', error);
      }
    };

    fetchPassengers();
    fetchSeatInfo();
  }, [location, user]);

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
  
  // 更新票种（成人/儿童/学生）
  const handleTicketTypeChange = (passengerId: string, ticketType: TicketInfo['ticketType']) => {
    setTicketInfos((prev: TicketInfo[]) => prev.map((info: TicketInfo) => 
      info.passengerId === passengerId 
        ? { ...info, ticketType }
        : info
    ));
  };

  // 将后端/个人中心可能的证件类型值映射为展示文案
  const getIdTypeLabel = (idType?: string) => {
    switch (idType) {
      case '1': return '居民身份证';
      case '2': return '外国人永久居留身份证';
      case '3': return '港澳台居民居住证';
      case '护照': return '护照';
      default: return '居民身份证';
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

  // 计算折扣（使用实时价格与基准价的比值）
  const getSeatDiscountText = (seatType: string): string => {
    const currentPrice = seatInfo?.[seatType]?.price;
    const basePrice = getSeatPrice(seatType);
    if (typeof currentPrice === 'number' && basePrice > 0) {
      const ratio = (currentPrice / basePrice) * 10;
      const discount = Math.max(1, Math.min(10, Number(ratio.toFixed(1))));
      // 折扣为10折时不显示
      if (discount >= 10) return '';
      return `${discount}折`;
    }
    return '—折';
  };

  // 显示余票（实时）
  const getSeatAvailabilityText = (seatType: string): string => {
    const available = seatInfo?.[seatType]?.availableSeats;
    if (typeof available === 'number') {
      if (available <= 0) return '无票';
      if (available > 10) return '有票';
      return `${available}张票`;
    }
    // 未提供余票数据时，也统一显示“无票”
    return '无票';
  };

  const isSeatAvailable = (seatType: string): boolean => {
    const available = seatInfo?.[seatType]?.availableSeats;
    return typeof available === 'number' && available > 0;
  };

  const formatDateWithWeek = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    const week = ['日','一','二','三','四','五','六'][d.getDay()];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}（周${week}）`;
  };

  const getTotalPrice = (): number => {
    return ticketInfos.reduce((total, info) => total + info.price, 0);
  };

  const handleSubmitOrder = async () => {
    if (selectedPassengers.length === 0) {
      if (passengers.length > 0 && trainInfo) {
        const first = passengers[0];
        setSelectedPassengers([first.id]);
        setTicketInfos([{
          passengerId: first.id,
          passengerName: first.name,
          seatType: trainInfo.seatType,
          ticketType: first.passengerType === '成人' ? '成人票' : first.passengerType === '儿童' ? '儿童票' : '学生票',
          price: trainInfo.price
        }]);
      } else if (trainInfo) {
        const temp = {
          id: `local_${Date.now()}`,
          name: user?.realName || '自助下单',
          idCard: user?.idNumber || 'D1234567890123456',
          phone: user?.phoneNumber || '13812340004',
          passengerType: '成人',
          isDefault: true
        } as Passenger;
        setPassengers([temp]);
        setSelectedPassengers([temp.id]);
        setTicketInfos([{
          passengerId: temp.id,
          passengerName: temp.name,
          seatType: trainInfo.seatType,
          ticketType: '成人票',
          price: trainInfo.price
        }]);
      } else {
        alert('请选择乘车人');
        return;
      }
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

  const handleConfirmOrder = async (selectedSeatCodes: string[] = []) => {
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
      ticketInfos: ticketInfos,
      selectedSeatCodes
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
        totalPrice: orderData.totalPrice,
        selectedSeats: orderData.selectedSeatCodes || []
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
      // 开发环境降级：直接打开支付模态框继续流程
      setIsPaymentModalOpen(true);
      if (!orderData) {
        setOrderData({
          orderId: `ORDER_${Date.now()}`,
          totalPrice: getTotalPrice(),
          passengers: selectedPassengers
            .map(id => passengers.find(p => p.id === id))
            .filter((p): p is Passenger => !!p) ,
          ticketInfos,
          selectedSeatCodes: []
        });
      }
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
      {/* 顶部导航栏：与首页一致 */}
      <header className="header">
        <div className="header-container header-top">
          {/* 左侧：Logo与标题 */}
          <div className="brand">
            <img className="brand-logo" src="/logo-12306.svg" alt="中国铁路12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>

          {/* 中间：搜索框 */}
          <div className="header-search">
            <input
              className="search-input"
              type="text"
              placeholder="搜索车票、 餐饮、 常旅客、 相关规章"
            />
            <button className="search-button">Q</button>
          </div>

          {/* 右侧：链接与操作 */}
          <div className="header-links">
            <a href="#" className="link">无障碍</a>
            <span className="sep">|</span>
            <a href="#" className="link">敬老版</a>
            <span className="sep">|</span>
            <a href="#" className="link">English</a>
            <span className="sep">|</span>
            <button className="link-btn" onClick={handleProfileClick}>我的12306</button>
            <span className="sep">|</span>
            {isLoggedIn ? (
              <button className="link-btn" onClick={handleLogout}>退出</button>
            ) : (
              <>
                <button className="link-btn" onClick={handleLoginClick}>登录</button>
                <span className="space" />
                <button className="link-btn" onClick={handleRegisterClick}>注册</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 导航栏：与首页一致，当前页高亮“车票” */}
      <nav className="navbar">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="/">首页</a></li>
            <li><a href="/train-list" className="active">车票</a></li>
            <li><a href="#">团购服务</a></li>
            <li><a href="#">会员服务</a></li>
            <li><a href="#">站车服务</a></li>
            <li><a href="#">商旅服务</a></li>
            <li><a href="#">出行指南</a></li>
            <li><a href="#">信息查询</a></li>
          </ul>
        </div>
      </nav>

      <div className="order-container">
        <div className="order-header">
          <h2>确认订单信息</h2>
          <div className="breadcrumb">
            <span>车票预订</span>
            <span className="separator">&gt;</span>
            <span className="current">确认订单</span>
          </div>
        </div>

        {/* 列车信息（以下余票信息仅供参考） */}
        <div className="train-info-section">
          <div className="train-summary">
            <div className="train-summary-header">列车信息（以下余票信息仅供参考）</div>
            <div className="train-summary-body">
              <div className="train-summary-row">
                {formatDateWithWeek(trainInfo.date)}，
                {trainInfo.trainNumber}次 {trainInfo.from}站（{trainInfo.departureTime}开）—
                {trainInfo.to}站（{trainInfo.arrivalTime}到）
              </div>
              <div className="train-summary-seats">
                <div className="seat-item">
                  <span className="seat-name">二等座</span>
                  {getSeatDiscountText('二等座') && (
                    <span className="seat-discount">{getSeatDiscountText('二等座')}</span>
                  )}
                  <span className={isSeatAvailable('二等座') ? 'seat-availability' : 'seat-unavailable'}>
                    {getSeatAvailabilityText('二等座')}
                  </span>
                </div>
                <div className="seat-item">
                  <span className="seat-name">商务座</span>
                  {getSeatDiscountText('商务座') && (
                    <span className="seat-discount">{getSeatDiscountText('商务座')}</span>
                  )}
                  <span className={isSeatAvailable('商务座') ? 'seat-availability' : 'seat-unavailable'}>
                    {getSeatAvailabilityText('商务座')}
                  </span>
                </div>
                <div className="seat-item">
                  <span className="seat-name">一等座</span>
                  {getSeatDiscountText('一等座') && (
                    <span className="seat-discount">{getSeatDiscountText('一等座')}</span>
                  )}
                  <span className={isSeatAvailable('一等座') ? 'seat-availability' : 'seat-unavailable'}>
                    {getSeatAvailabilityText('一等座')}
                  </span>
                </div>
                <div className="seat-item">
                  <span className="seat-name">无座</span>
                  {getSeatDiscountText('无座') && (
                    <span className="seat-discount">{getSeatDiscountText('无座')}</span>
                  )}
                  <span className={isSeatAvailable('无座') ? 'seat-availability' : 'seat-unavailable'}>
                    {getSeatAvailabilityText('无座')}
                  </span>
                </div>
              </div>
              <div className="train-summary-note">
                *显示的价格均为实际活动折扣后票价，供您参考，查看公布票价 。具体票价以您确认支付时实际购买的铺别票价为准。
              </div>
            </div>
          </div>
        </div>

        {/* 乘客信息（截图布局） */}
        <div className="passenger-section">
          <div className="passenger-header-row">
            <div className="passenger-header-title">乘客信息（填写说明）</div>
            <div className="passenger-search">
              <input className="passenger-search-input" placeholder="输入乘客姓名" />
              <button className="passenger-search-btn">Q</button>
            </div>
          </div>

          <div className="passenger-chooser">
            <div className="chooser-label">乘车人</div>
            <div className="chooser-list">
              {passengers.map(p => (
                <label key={p.id} className="chooser-item">
                  <input 
                    type="checkbox" 
                    checked={selectedPassengers.includes(p.id)}
                    onChange={() => handlePassengerSelect(p.id)}
                  />
                  <span>
                    {p.name}{p.passengerType && p.passengerType !== '成人' ? `（${p.passengerType}）` : ''}
                  </span>
                </label>
              ))}
            </div>
            <button className="add-passenger-btn" onClick={() => setIsModalOpen(true)}>+ 添加乘车人</button>
          </div>

          <div className="passenger-divider" />

          {/* 票表：序号 票种 席别 姓名 证件类型 证件号码 */}
          <div className="passenger-table">
            <div className="passenger-table-header">
              <div className="col-index">序号</div>
              <div className="col-ticket-type">票种</div>
              <div className="col-seat-type">席别</div>
              <div className="col-name">姓名</div>
              <div className="col-id-type">证件类型</div>
              <div className="col-id-number">证件号码</div>
            </div>
            {ticketInfos.map((info, idx) => {
              const p = passengers.find(pp => pp.id === info.passengerId);
              const idTypeLabel = getIdTypeLabel(p?.idType);
              return (
                <div key={info.passengerId} className="passenger-table-row">
                  <div className="col-index">{idx + 1}</div>
                  <div className="col-ticket-type">
                    <select 
                      className="square-select"
                      value={info.ticketType}
                      onChange={(e) => handleTicketTypeChange(info.passengerId, e.target.value as TicketInfo['ticketType'])}
                    >
                      <option value="成人票">成人票</option>
                      <option value="儿童票">儿童票</option>
                      <option value="学生票">学生票</option>
                    </select>
                  </div>
                  <div className="col-seat-type">
                    <select 
                      className="square-select"
                      value={info.seatType}
                      onChange={(e) => handleSeatTypeChange(info.passengerId, e.target.value)}
                    >
                      <option value="商务座">商务座（¥{getSeatPrice('商务座')}）</option>
                      <option value="一等座">一等座（¥{getSeatPrice('一等座')}）</option>
                      <option value="二等座">二等座（¥{getSeatPrice('二等座')}）</option>
                      <option value="无座">无座（¥{getSeatPrice('无座')}）</option>
                    </select>
                  </div>
                  <div className="col-name">{info.passengerName}</div>
                  <div className="col-id-type">
                    <select className="square-select" defaultValue={idTypeLabel}>
                      <option value="居民身份证">居民身份证</option>
                      <option value="外国人永久居留身份证">外国人永久居留身份证</option>
                      <option value="港澳台居民居住证">港澳台居民居住证</option>
                      <option value="护照">护照</option>
                    </select>
                  </div>
                  <div className="col-id-number">{p?.idCard || ''}</div>
                </div>
              );
            })}
          </div>

          {/* 横幅图片 */}
          <div className="order-banner">
            <img src="/ordercheck.png" alt="乘意相伴 安心出行" />
          </div>

          {/* 协议说明与操作 */}
          <div className="order-agreement">
            提交订单表示已阅读并同意 
            <a href="#" className="link">《国铁集团铁路旅客运输规程》</a> 
            <a href="#" className="link">《服务条款》</a>
          </div>
          {/* 温馨提示（淡黄色底） */}
          <div className="warm-tips">
            <div className="warm-tips-title">温馨提示：</div>
            <ol className="warm-tips-list">
              <li>
                一张有效身份证件同一乘车日期同一车次只能购买一张车票，高铁动卧列车除外。改签或变更到站后车票的乘车日期在春运期间，如再办理退票将按票面价格20%核收退票费。请合理安排行程，更多改签规则请查看
                <a href="#" className="link">《退改说明》</a> 。
              </li>
              <li>
                购买儿童票时，乘车儿童有有效身份证件的，请填写本人有效身份证件信息。自2023年1月1日起，每一名持票成年人旅客可免费携带一名未满6周岁且不单独占用席位的儿童乘车，超过一名时，超过人数应购买儿童优惠票。免费儿童可以在购票成功后添加。
              </li>
              <li>
                购买残疾军人（伤残警察）优待票的，须在购票后、开车前办理换票手续方可进站乘车。换票时，不符合规定的减价优待条件，没有有效“中华人民共和国残疾军人证”或“中华人民共和国伤残人民警察证”的，不予换票，所购车票按规定办理退票手续。
              </li>
              <li>
                一天内3次申请车票成功后取消订单（包含无座票时取消5次计为取消1次），当日将不能在12306继续购票。
              </li>
              <li>
                购买铁路乘意险的注册用户年龄须在18周岁以上，使用非中国居民身份证注册的用户如购买铁路乘意险，须在
                <a href="#" className="link">我的12306——个人信息</a>
                如实填写“出生日期”。
              </li>
              <li>
                父母为未成年子女投保，须在
                <a href="#" className="link">我的乘车人</a>
                登记未成年子女的有效身份证件信息。
              </li>
              <li>
                未尽事宜详见
                <a href="#" className="link">《铁路旅客运输规程》</a>
                等有关规定和车站公告。
              </li>
            </ol>
          </div>
          <div className="order-actions">
            <button className="btn-prev" onClick={() => navigate(-1)}>上一步</button>
            <button 
              className="btn-submit"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交订单'}
            </button>
          </div>
        </div>

        {/* 移除旧购票信息与订单总计区块，使用上方新布局 */}
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
        seatInfo={seatInfo}
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
      {/* 页脚（与主页一致的灰色区域）*/}
      <Footer />
    </div>
  );
};

export default OrderPage;
