import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddPassengerModal from '../components/AddPassengerModal';
import { getPassengers as apiGetPassengers, addPassenger as apiAddPassenger, updatePassenger as apiUpdatePassenger, deletePassenger as apiDeletePassenger, type PassengerFormData } from '../services/passengerService';
import PaymentModal from '../components/PaymentModal';
import './ProfilePage.css';
import './HomePage.css';

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
  idType?: string;
  isDefault?: boolean;
}

interface Order {
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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, isLoading, refreshUser } = useAuth();
  const [urlSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('center-home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  // 搜索与批量选择
  const [searchInput, setSearchInput] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);
  
  // 乘客数据 - 必须在所有条件渲染之前声明
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  
  // 订单数据 - 必须在所有条件渲染之前声明
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOrderData, setPaymentOrderData] = useState<{ orderId: string; totalPrice: number; trainNumber: string; fromStation: string; toStation: string; departureDate: string; passengerCount: number } | null>(null);
  const [paymentOrderBackendId, setPaymentOrderBackendId] = useState<string | null>(null);
  
  // ===== 编辑按钮占位处理（保留现有跳转关系） =====
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // 根据URL参数预设当前分区（如 ?section=orders）
  useEffect(() => {
    const section = urlSearchParams.get('section');
    if (section === 'orders') {
      setActiveSection('orders');
    } else if (section === 'passengers') {
      setActiveSection('passengers');
    } else if (section === 'personal-info') {
      setActiveSection('personal-info');
    }
  }, [urlSearchParams]);

  // 获取乘车人数据 - 必须在条件渲染之前声明
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const passengerList = await apiGetPassengers();
        // 强制保证首位为登录用户本人
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
      } catch (error) {
        console.error('获取乘车人信息失败:', error);
        // 如果获取失败，使用用户基本信息作为默认乘车人
        if (user) {
          setPassengers([
            {
              id: '1',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            }
          ]);
        }
      }
    };

    if (user) {
      fetchPassengers();
    }
  }, [user]);

  // 监听订单筛选变化 - 必须在条件渲染之前声明
  useEffect(() => {
    if (activeSection === 'orders') {
      // 延迟调用fetchOrders，确保函数已定义
      const timer = setTimeout(() => {
        fetchOrders(1, orderFilter);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [orderFilter, activeSection]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  // 如果未登录，不渲染内容（会被重定向）
  if (!isLoggedIn || !user) {
    return null;
  }

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      // 与首页保持一致：退出后刷新页面状态
      window.location.reload();
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // 当切换到订单页面时，加载订单数据
    if (section === 'orders') {
      fetchOrders();
    }
  };

  const getGreetingPeriod = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午';
    if (hour < 18) return '下午';
    return '晚上';
  };

  // ===== 辅助函数：脱敏显示与格式化 =====
  const maskIdNumber = (id: string | undefined) => {
    if (!id) return '未设置';
    const len = id.length;
    if (len <= 7) return id;
    const first = id.slice(0, 4);
    const last = id.slice(-3);
    return first + '*'.repeat(len - 7) + last;
  };

  const maskPhoneNumber = (phone: string | undefined) => {
    if (!phone) return '未设置';
    const digits = phone.replace(/\D/g, '');
    const len = digits.length;
    if (len < 7) return `(+86) ${digits}`;
    const first3 = digits.slice(0, 3);
    const last4 = digits.slice(-4);
    const stars = '*'.repeat(Math.max(0, len - 7));
    return `(+86) ${first3}${stars}${last4}`;
  };

  const formatIdType = (idType: string | undefined) => {
    if (!idType) return '未设置';
    const t = idType.toLowerCase();
    if (t === 'id_card' || t === '1') return '中国居民身份证';
    if (t === '2') return '外国人永久身份证';
    if (t === '3') return '港澳台居民身份证';
    return idType;
  };

  const formatPassengerType = (type: string | undefined) => {
    if (!type) return '未设置';
    const t = type.toLowerCase();
    if (t === 'adult' || t === '1') return '成人';
    if (t === 'child' || t === '2') return '儿童';
    if (t === 'student' || t === '3') return '学生';
    return type;
  };

  const handleEditContact = () => {
    setIsEditingContact(true);
    setEmailInput(user?.email || '');
  };
  const handleSaveContact = async () => {
    try {
      const { updateProfile } = await import('../services/auth');
      const resp = await updateProfile({ email: emailInput });
      if (resp.success) {
        await refreshUser();
        alert('修改成功');
        setIsEditingContact(false);
      } else {
        alert(resp.message || '修改失败');
      }
    } catch (e: any) {
      console.error('保存邮箱失败', e);
      alert(e.message || '修改失败');
    }
  };

  const handleEditExtra = () => {
    console.log('编辑附加信息');
  };

  const handleStudentRefresh = () => {
    console.log('学生资质刷新');
  };

  const handleStudentQuery = () => {
    console.log('学生资质查询');
  };

  // 获取订单列表
  const fetchOrders = async (page = 1, status = orderFilter) => {
    try {
      setIsLoadingOrders(true);
      
      // 使用统一的订单服务
      const { getUserOrders } = await import('../services/orderService');
      const data = await getUserOrders(page, orderPagination.limit, status);
      
      if (data && data.orders) {
        // 转换后端数据格式为前端格式
         const formattedOrders = data.orders.map((order: any) => ({
           id: order.id,
           orderNumber: order.orderId || order.orderNumber,
           trainNumber: order.trainNumber,
           departure: order.fromStation || order.departure,
           arrival: order.toStation || order.arrival,
           departureTime: order.departureTime,
           arrivalTime: order.arrivalTime,
           date: order.departureDate || order.date,
           passenger: order.passengers?.[0]?.passengerName || order.passenger || '未知',
           seat: order.passengers?.[0]?.seatNumber || order.seat || '待分配',
           price: order.totalPrice || order.price,
          status: (
            order.status === 'unpaid' ? 'unpaid' :
            order.status === 'paid' ? 'paid' :
            order.status === 'cancelled' ? 'cancelled' :
            order.status === 'refunded' ? 'refunded' : 'unpaid'
          ) as 'paid' | 'unpaid' | 'cancelled' | 'refunded'
         }));
        
        setOrders(formattedOrders);
        setOrderPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || orderPagination.limit,
          total: data.pagination?.total || formattedOrders.length,
          totalPages: Math.ceil((data.pagination?.total || formattedOrders.length) / (data.pagination?.limit || orderPagination.limit))
        });
      }
    } catch (error) {
      console.error('获取订单错误:', error);
      // 如果新的服务失败，回退到原来的方式
      try {
        const token = localStorage.getItem('authToken');
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: orderPagination.limit.toString()
        });
        
        if (status && status !== 'all') {
          params.append('status', status);
        }

        const response = await fetch(`http://localhost:3000/api/v1/orders?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 转换后端数据格式为前端格式
            const formattedOrders = data.data.orders.map((order: any) => ({
              id: order.id,
              orderNumber: order.orderId,
              trainNumber: order.trainNumber,
              departure: order.fromStation,
              arrival: order.toStation,
              departureTime: order.departureTime,
              arrivalTime: order.arrivalTime,
              date: order.departureDate,
              passenger: order.passengers?.[0]?.passengerName || '未知',
              seat: order.passengers?.[0]?.seatNumber || '待分配',
              price: order.totalPrice,
              status: (
                order.status === 'unpaid' ? 'unpaid' :
                order.status === 'paid' ? 'paid' :
                order.status === 'cancelled' ? 'cancelled' :
                order.status === 'refunded' ? 'refunded' : 'unpaid'
              )
            }));
            
            setOrders(formattedOrders);
            setOrderPagination({
              page: data.data.pagination.page,
              limit: data.data.pagination.limit,
              total: data.data.pagination.total,
              totalPages: data.data.pagination.totalPages
            });
          }
        } else {
          console.error('获取订单失败:', response.statusText);
        }
      } catch (fallbackError) {
        console.error('获取订单失败（回退方式也失败）:', fallbackError);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAddPassenger = () => {
    setEditingPassenger(null);
    setIsModalOpen(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setIsModalOpen(true);
  };

  const handleDeletePassenger = async (id: string) => {
    const target = passengers.find(p => p.id === id);
    if (target?.isDefault) {
      alert('不能删除默认乘车人（本人）');
      return;
    }
    if (window.confirm('确定要删除这个乘车人吗？')) {
      try {
        await apiDeletePassenger(id);
        setPassengers(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('删除乘车人失败:', error);
        // 开发环境降级：仍在本地移除
        setPassengers(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPassenger(null);
  };

  const handlePassengerAdd = async (passengerData: PassengerFormData) => {
    try {
      const newPassenger = await apiAddPassenger(passengerData);
      setPassengers(prev => [...prev, newPassenger]);
    } catch (error: any) {
      console.error('添加乘车人失败:', error);
      alert(error?.message || '添加乘车人失败，请检查姓名（需中文）、证件号码与手机号格式');
    }
  };

  const handlePassengerEdit = async (id: string, passengerData: PassengerFormData) => {
    try {
      const updatedPassenger = await apiUpdatePassenger(id, passengerData);
      setPassengers(prev => prev.map(p => 
        p.id === id ? updatedPassenger : p
      ));
    } catch (error) {
      console.error('更新乘车人失败:', error);
      alert('更新乘车人失败，请稍后重试');
    }
  };

  // 订单相关处理函数
  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      paid: '已支付',
      unpaid: '未支付',
      cancelled: '已取消',
      refunded: '已退票'
    };
    return statusMap[status];
  };

  const getStatusClass = (status: Order['status']) => {
    return status;
  };

  const handleOrderDetail = (orderId: string) => {
    // 导航到订单详情页面
    navigate(`/order-detail/${orderId}`);
  };

  const handleRefund = async (orderId: string) => {
    if (window.confirm('确定要申请退票吗？退票可能产生手续费。')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/cancel`, {
          method: 'PUT', // 修改为PUT方法，与后端路由一致
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert('退票申请成功！');
            // 重新加载订单列表
            fetchOrders(orderPagination.page, orderFilter);
          } else {
            alert(data.message || '退票申请失败');
          }
        } else {
          alert('退票申请失败，请稍后重试');
        }
      } catch (error) {
        console.error('退票申请错误:', error);
        alert('退票申请失败，请稍后重试');
      }
    }
  };

  const handlePayOpen = (order: Order) => {
    setPaymentOrderBackendId(order.id);
    setPaymentOrderData({
      orderId: order.orderNumber,
      totalPrice: order.price,
      trainNumber: order.trainNumber,
      fromStation: order.departure,
      toStation: order.arrival,
      departureDate: order.date,
      passengerCount: 1
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!paymentOrderBackendId) {
      setIsPaymentModalOpen(false);
      return;
    }
    try {
      const { updateOrderStatus } = await import('../services/orderService');
      await updateOrderStatus(paymentOrderBackendId, 'paid', 'alipay');
      setIsPaymentModalOpen(false);
      alert('支付成功！');
      fetchOrders(orderPagination.page, orderFilter);
    } catch (e) {
      setIsPaymentModalOpen(false);
      alert('支付成功，但状态更新稍后刷新');
      fetchOrders(orderPagination.page, orderFilter);
    }
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= orderPagination.totalPages) {
      fetchOrders(newPage, orderFilter);
    }
  };

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const statusMatch = orderFilter === 'all' || order.status === orderFilter;
    const dateMatch = !dateFilter || order.date === dateFilter;
    return statusMatch && dateMatch;
  });

  return (
    <div className="profile-page">
      {/* 顶部导航栏（与首页一致）*/}
      <header className="header">
        <div className="header-container header-top">
          {/* 左侧：Logo与标题 */}
          <div className="brand">
            <img className="brand-logo" src="/铁路12306-512x512.png" alt="中国铁路12306" />
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

      {/* 导航栏（与首页一致）*/}
      <nav className="navbar">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="/">首页</a></li>
            <li><a href="/train-list">车票</a></li>
            <li><a href="#">团购服务</a></li>
            <li><a href="#">会员服务</a></li>
            <li><a href="#">站车服务</a></li>
            <li><a href="#">商旅服务</a></li>
            <li><a href="#">出行指南</a></li>
            <li><a href="#">信息查询</a></li>
          </ul>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="profile-main">
        {/* 左侧导航 */}
        <aside className="profile-sidebar">
          {/* 删除用户信息卡片 */}

          <nav className="sidebar-nav">
            {/* 顶层标题 */}
            <div className="nav-group">
              <h4>
                <button
                  type="button"
                  className="group-button"
                  onClick={() => handleSectionChange('center-home')}
                  aria-pressed={activeSection === 'center-home'}
                >
                  个人中心
                </button>
              </h4>
              <ul />
            </div>

            {/* 订单中心 */}
            <div className="nav-group">
              <h4>订单中心</h4>
              <ul>
                <li>
                  <button
                    className={activeSection === 'orders' ? 'active' : ''}
                    onClick={() => handleSectionChange('orders')}
                  >
                    火车票订单
                  </button>
                </li>
                <li><button disabled>候补订单</button></li>
                <li><button disabled>计次•定期票订单</button></li>
                <li><button disabled>约号订单</button></li>
                <li><button disabled>雪具快运订单</button></li>
                <li><button disabled>餐饮•特产</button></li>
                <li><button disabled>保险订单</button></li>
                <li><button disabled>电子发票</button></li>
              </ul>
            </div>

            {/* 本人车票 */}
            <div className="nav-group">
              <h4>本人车票</h4>
              <ul />
            </div>

            {/* 会员中心 */}
            <div className="nav-group">
              <h4>会员中心</h4>
              <ul />
            </div>

            {/* 个人信息 */}
            <div className="nav-group">
              <h4>个人信息</h4>
              <ul>
                <li>
                  <button
                    className={activeSection === 'personal-info' ? 'active' : ''}
                    onClick={() => handleSectionChange('personal-info')}
                  >
                    查看个人信息
                  </button>
                </li>
                <li><button disabled>账号安全</button></li>
                <li><button disabled>手机核验</button></li>
                <li><button disabled>账号注销</button></li>
              </ul>
            </div>

            {/* 常用信息管理 */}
            <div className="nav-group">
              <h4>常用信息管理</h4>
              <ul>
                <li>
                  <button
                    className={activeSection === 'passengers' ? 'active' : ''}
                    onClick={() => handleSectionChange('passengers')}
                  >
                    乘车人
                  </button>
                </li>
                <li><button disabled>地址管理</button></li>
              </ul>
            </div>

            {/* 温馨服务 */}
            <div className="nav-group">
              <h4>温馨服务</h4>
              <ul>
                <li><button disabled>重点旅客预约</button></li>
                <li><button disabled>遗失物品查找</button></li>
                <li><button disabled>服务查询</button></li>
              </ul>
            </div>

            {/* 投诉和建议 */}
            <div className="nav-group">
              <h4>投诉和建议</h4>
              <ul>
                <li><button disabled>投诉</button></li>
                <li><button disabled>建议</button></li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* 右侧内容区域 */}
        <main className="profile-content">
          {activeSection === 'center-home' && (
            <div className="content-section">
              <div className="center-welcome">
                <div className="welcome-header">
                  <div className="megaphone-icon" aria-hidden="true" />
                  <div className="greeting-text">
                    {(user && user.realName) ? `${user.realName}，${getGreetingPeriod()}好！` : `您好，${getGreetingPeriod()}好！`}
                  </div>
                </div>
                <div className="notice-card">
                  <p>欢迎您登录中国铁路客户服务中心网站。</p>
                  <p>如果您的密码在其他网站也使用，建议您修改本网站密码。</p>
                  <p><a className="action-link" href="#" onClick={(e) => e.preventDefault()}>点击成为会员</a></p>
                  <p>如果您需要预订车票，请您点击<a className="action-link" href="/train-list">车票预订</a>。</p>
                </div>
                <div className="qr-grid">
                  <div className="qr-card">
                    <div className="qr-code" />
                    <div className="qr-text">使用微信扫一扫，可通过<br />微信公众号接收12306行程通知</div>
                  </div>
                  <div className="qr-card">
                    <div className="qr-code" />
                    <div className="qr-text">使用支付宝扫一扫，可通过<br />支付宝通知提醒接收12306行程通知</div>
                  </div>
                </div>
                <div className="warm-tips">
                  <div className="tips-title">温馨提示：</div>
                  <ol>
                    <li>消息通知方式进行相关调整，将通过“铁路12306”App客户端为您推送相关消息（需开启通知权限）。您也可以扫描关注“铁路12306”微信公众号或支付宝生活号，选择通过微信或支付宝接收。列车运行调整的通知仍然发送短信通知给您。</li>
                    <li>您可通过“账号安全”中的“通知设置”修改您接收信息服务的方式。</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'personal-info' && (
            <div className="content-section">
              <div className="section-header">
                <h2>个人信息</h2>
                <div className="breadcrumb">
                  <span>个人信息</span>
                  <span className="separator">{'>'}</span>
                  <span className="current">查看个人信息</span>
                </div>
              </div>

              {/* 基本信息 */}
              <section className="info-section">
                <div className="section-title">基本信息</div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 用户名：</label>
                    <span className="kv-value">{user.username}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 姓名：</label>
                    <span className="kv-value">{user.realName}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">国家/地区：</label>
                    <span className="kv-value">中国China</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 证件类型：</label>
                    <span className="kv-value">{formatIdType(user.idType)}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 证件号码：</label>
                    <span className="kv-value">{maskIdNumber(user.idNumber)}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">核验状态：</label>
                    <span className="kv-value verified-tag">已通过</span>
                  </div>
                </div>
              </section>

              {/* 联系方式 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">联系方式</div>
                  <div className="section-toolbar">
                    <button className="edit-btn" onClick={handleEditContact}>编辑</button>
                  </div>
                </div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 手机号：</label>
                    <span className="kv-value">{maskPhoneNumber(user.phoneNumber)}</span>
                    <span className="verified-inline">已通过核验</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">邮箱：</label>
                    {isEditingContact ? (
                      <>
                        <input
                          id="email"
                          type="email"
                          className="kv-input"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <button className="save-btn" onClick={handleSaveContact}>保存</button>
                      </>
                    ) : (
                      <span className="kv-value">{user.email || '未设置'}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* 附加信息 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">附加信息</div>
                  <div className="section-toolbar">
                    <button className="edit-btn" onClick={handleEditExtra}>编辑</button>
                  </div>
                </div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 优惠(待)类型：</label>
                    <span className="kv-value">{formatPassengerType(user.passengerType)}</span>
                  </div>
                </div>
              </section>

              {/* 学生资质查询 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">学生资质查询</div>
                  <div className="section-toolbar">
                    <button className="detail-btn" onClick={handleStudentRefresh}>刷新</button>
                    <button className="detail-btn" onClick={handleStudentQuery}>查询</button>
                  </div>
                </div>
                <p className="section-note">
                  学生资质查询服务，提供查询本人的学生购票资质、购票优惠区间及年度剩余优惠票购票次数。
                </p>
              </section>
            </div>
          )}

          {activeSection === 'passengers' && (
            <div className="content-section">
              <div className="section-header">
                <h2>乘车人管理</h2>
                <div className="breadcrumb">
                  <span>常用信息管理</span>
                  <span className="separator">{'>'}</span>
                  <span className="current">乘车人</span>
                </div>
              </div>

              <div className="passengers-section">
                {/* 搜索工具栏 */}
                <div className="passenger-tools">
                  <div className="search-input-wrap">
                    <input
                      type="text"
                      placeholder="请输入乘客姓名"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="search-input"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        className="clear-btn"
                        aria-label="清空"
                        onClick={() => { setSearchInput(''); setSearchName(''); setSelectedPassengerIds([]); }}
                      >×</button>
                    )}
                  </div>
                  <button
                    className="search-btn"
                    onClick={() => { setSearchName(searchInput.trim()); setSelectedPassengerIds([]); }}
                  >查询</button>
                </div>

                {/* 管理操作栏 */}
                <div className="manage-bar">
                  <button className="add-action" onClick={handleAddPassenger}>➕ 添加</button>
                  <button
                    className="bulk-delete-action"
                    onClick={async () => {
                      if (selectedPassengerIds.length === 0) {
                        alert('请选择需要删除的乘车人');
                        return;
                      }
                      if (!window.confirm(`确定批量删除选中的${selectedPassengerIds.length}个乘车人吗？`)) return;
                      try {
                        const toDelete = selectedPassengerIds.filter(id => {
                          const p = passengers.find(x => x.id === id);
                          return !p?.isDefault;
                        });
                        for (const id of toDelete) {
                          await apiDeletePassenger(id);
                        }
                        setPassengers(prev => prev.filter(p => !toDelete.includes(p.id)));
                        setSelectedPassengerIds([]);
                      } catch (err) {
                        console.error('批量删除失败:', err);
                        alert('批量删除失败，请稍后重试');
                      }
                    }}
                  >🗑 批量删除</button>
                </div>

                {/* 乘车人表格 */}
                {(() => {
                  // 排序：默认乘车人优先
                  const sorted = [...passengers].sort((a, b) => (
                    (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
                  ));
                  const filtered = sorted.filter(p => !searchName || p.name.includes(searchName));
                  return (
                    <div className="passenger-table">
                      {/* 表头 */}
                      <div className="table-header">
                        <div className="col-check" />
                        <div className="col-index">序号</div>
                        <div className="col-name">姓名</div>
                        <div className="col-idtype">证件类型</div>
                        <div className="col-idnumber">证件号码</div>
                        <div className="col-phone">手机／电话</div>
                        <div className="col-verify">核验状态</div>
                        <div className="col-actions">操作</div>
                      </div>

                      {/* 行 */}
                      {filtered.map((p, idx) => (
                        <div key={p.id} className="table-row">
                          <div className="col-check">
                            <input
                              type="checkbox"
                              checked={selectedPassengerIds.includes(p.id)}
                              disabled={!!p.isDefault}
                              onChange={() => {
                                if (p.isDefault) return;
                                setSelectedPassengerIds(prev => (
                                  prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                ));
                              }}
                            />
                          </div>
                          <div className="col-index">{idx + 1}</div>
                          <div className="col-name">{p.name}</div>
                          <div className="col-idtype">{formatIdType(p.idType)}</div>
                          <div className="col-idnumber">{maskIdNumber(p.idCard)}</div>
                          <div className="col-phone">{maskPhoneNumber(p.phone)}</div>
                          <div className="col-verify">
                            <span className="verify-badge" title="已核验">🪪<span className="dot ok" /> 已核验</span>
                          </div>
                          <div className="col-actions">
                            {!p.isDefault && (
                              <button
                                className="op-btn delete"
                                title="删除"
                                onClick={() => handleDeletePassenger(p.id)}
                              >🗑</button>
                            )}
                            <button
                              className="op-btn edit"
                              title="编辑"
                              onClick={() => handleEditPassenger(p)}
                            >✎</button>
                          </div>
                        </div>
                      ))}

                      {filtered.length === 0 && (
                        <div className="empty-state">
                          <p>未找到乘车人，请调整查询条件或添加乘车人</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="content-section">
              <div className="section-header">
                <h2>火车票订单</h2>
                <div className="breadcrumb">
                  <span>订单中心</span>
                  <span className="separator">{'>'}</span>
                  <span className="current">火车票订单</span>
                </div>
              </div>

              <div className="orders-section">
                <div className="order-tabs">
                  <button className={`tab-btn ${orderFilter === 'all' ? 'active' : ''}`} data-testid="orders-tab-all" onClick={() => setOrderFilter('all')}>全部订单</button>
                  <button className={`tab-btn ${orderFilter === 'unpaid' ? 'active' : ''}`} data-testid="orders-tab-unfinished" onClick={() => setOrderFilter('unpaid')}>未完成订单</button>
                  <button className={`tab-btn ${orderFilter === 'paid' ? 'active' : ''}`} data-testid="orders-tab-not-travelled" onClick={() => setOrderFilter('paid')}>未出行订单</button>
                </div>
                <div className="order-filters">
                  <select 
                    className="filter-select"
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                  >
                    <option value="all">全部订单</option>
                    <option value="paid">已支付</option>
                    <option value="unpaid">未支付</option>
                    <option value="cancelled">已取消</option>
                    <option value="refunded">已退票</option>
                  </select>
                  <input 
                    type="date" 
                    className="date-filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    placeholder="选择日期"
                  />
                </div>

                <div className="orders-list">
                  {isLoadingOrders ? (
                    <div className="loading-state">
                      <p>加载中...</p>
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    <>
                      {filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                          <div className="order-header">
                            <span className="order-number">订单号：{order.orderNumber}</span>
                            <span className={`order-status ${getStatusClass(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="order-content">
                            <div className="train-info">
                              <h4>{order.trainNumber}</h4>
                              <p>{order.departure} → {order.arrival}</p>
                              <p>{order.date} {order.departureTime} - {order.arrivalTime}</p>
                            </div>
                            <div className="passenger-info">
                              <p>乘车人：{order.passenger}</p>
                              <p>座位：{order.seat}</p>
                            </div>
                            <div className="price-info">
                              <p className="price">¥{order.price}</p>
                            </div>
                          </div>
                          <div className="order-actions">
                            <button 
                              className="detail-btn"
                              onClick={() => handleOrderDetail(order.id)}
                            >
                              查看详情
                            </button>
                            {order.status === 'unpaid' && (
                              <button 
                                className="pay-btn"
                                onClick={() => handlePayOpen(order)}
                              >
                                去支付
                              </button>
                            )}
                            {order.status === 'paid' && (
                              <button 
                                className="refund-btn"
                                onClick={() => handleRefund(order.id)}
                              >
                                退票
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* 分页控件 */}
                      {orderPagination.totalPages > 1 && (
                        <div className="pagination">
                          <button 
                            className="page-btn"
                            disabled={orderPagination.page === 1}
                            onClick={() => handlePageChange(orderPagination.page - 1)}
                          >
                            上一页
                          </button>
                          <span className="page-info">
                            第 {orderPagination.page} 页，共 {orderPagination.totalPages} 页
                          </span>
                          <button 
                            className="page-btn"
                            disabled={orderPagination.page === orderPagination.totalPages}
                            onClick={() => handlePageChange(orderPagination.page + 1)}
                          >
                            下一页
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>暂无订单记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 添加乘车人模态框 */}
      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAdd={handlePassengerAdd}
        onEdit={handlePassengerEdit}
        editingPassenger={editingPassenger}
      />

      {/* 页脚（与主页一致的灰色区域）*/}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <p>版权所有©2008-2025 中国铁道科学研究院集团有限公司 技术支持：铁旅科技有限公司</p>
            <p>公安 京公网安备 11010802038392号 | 京ICP备05020493号-4 | ICP证：京B2-20202537 | 营业执照</p>
          </div>
        </div>
      </footer>

      {paymentOrderData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          onPaymentSuccess={handlePaymentSuccess}
          orderData={paymentOrderData}
        />
      )}
    </div>
  );
};

export default ProfilePage;
 
