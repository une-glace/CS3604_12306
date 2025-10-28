import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddPassengerModal from '../components/AddPassengerModal';
import './ProfilePage.css';

interface User {
  name: string;
  idCard: string;
  phone: string;
  email: string;
}

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
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
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('personal-info');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, navigate]);

  // 如果正在加载或未登录，显示加载状态
  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null; // 会被重定向到登录页面
  }

  // 乘客数据
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: '1',
      name: user.realName,
      idCard: user.idNumber,
      phone: user.phoneNumber,
      passengerType: '成人'
    },
    {
      id: '2',
      name: '李四',
      idCard: '110101199501011234',
      phone: '13900139000',
      passengerType: '学生'
    }
  ]);

  // 订单数据
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'E123456789',
      trainNumber: 'G123',
      departure: '北京南',
      arrival: '上海虹桥',
      departureTime: '08:00',
      arrivalTime: '12:30',
      date: '2024-01-15',
      passenger: '张三',
      seat: '02车06A号',
      price: 553.0,
      status: 'paid'
    },
    {
      id: '2',
      orderNumber: 'E123456790',
      trainNumber: 'D456',
      departure: '上海虹桥',
      arrival: '杭州东',
      departureTime: '14:00',
      arrivalTime: '15:30',
      date: '2024-01-10',
      passenger: '李四',
      seat: '05车12B号',
      price: 73.0,
      status: 'cancelled'
    },
    {
      id: '3',
      orderNumber: 'E123456791',
      trainNumber: 'G456',
      departure: '广州南',
      arrival: '深圳北',
      departureTime: '16:30',
      arrivalTime: '17:15',
      date: '2024-01-20',
      passenger: '张三',
      seat: '03车08C号',
      price: 74.5,
      status: 'unpaid'
    }
  ]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      navigate('/');
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleAddPassenger = () => {
    setEditingPassenger(null);
    setIsModalOpen(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setIsModalOpen(true);
  };

  const handleDeletePassenger = (id: string) => {
    if (window.confirm('确定要删除这个乘车人吗？')) {
      setPassengers(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPassenger(null);
  };

  const handlePassengerAdd = (passengerData: Omit<Passenger, 'id'>) => {
    const newPassenger: Passenger = {
      ...passengerData,
      id: Date.now().toString()
    };
    setPassengers(prev => [...prev, newPassenger]);
  };

  const handlePassengerEdit = (id: string, passengerData: Omit<Passenger, 'id'>) => {
    setPassengers(prev => prev.map(p => 
      p.id === id ? { ...passengerData, id } : p
    ));
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
    // 这里可以导航到订单详情页面或显示详情模态框
    console.log('查看订单详情:', orderId);
  };

  const handleRefund = (orderId: string) => {
    if (window.confirm('确定要申请退票吗？')) {
      // 这里可以调用退票API
      console.log('申请退票:', orderId);
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
      {/* 头部 */}
      <header className="profile-header">
        <div className="header-container">
          <div className="logo">
            <img src="/logo.png" alt="12306" />
            <span>中国铁路12306</span>
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
            <button className="back-home-btn" onClick={handleBackToHome}>
              返回首页
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="profile-main">
        {/* 左侧导航 */}
        <aside className="profile-sidebar">
          <div className="user-info-card">
            <div className="avatar">
              <span>{user.realName.charAt(0)}</span>
            </div>
            <div className="user-details">
              <h3>{user.realName}</h3>
              <p>{user.phoneNumber}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
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
              </ul>
            </div>

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
              </ul>
            </div>

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
              </ul>
            </div>
          </nav>
        </aside>

        {/* 右侧内容区域 */}
        <main className="profile-content">
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

              <div className="info-card">
                <h3>基本信息</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>用户名：</label>
                    <span>{user.username}</span>
                  </div>
                  <div className="info-item">
                    <label>姓名：</label>
                    <span>{user.realName}</span>
                  </div>
                  <div className="info-item">
                    <label>证件类型：</label>
                    <span>{user.idType === 'id_card' ? '身份证' : user.idType}</span>
                  </div>
                  <div className="info-item">
                    <label>证件号码：</label>
                    <span>{user.idNumber}</span>
                  </div>
                  <div className="info-item">
                    <label>手机号：</label>
                    <span>{user.phoneNumber}</span>
                  </div>
                  <div className="info-item">
                    <label>邮箱：</label>
                    <span>{user.email || '未设置'}</span>
                  </div>
                  <div className="info-item">
                    <label>乘客类型：</label>
                    <span>{user.passengerType === 'adult' ? '成人' : user.passengerType === 'child' ? '儿童' : '学生'}</span>
                  </div>
                  <div className="info-item">
                    <label>账户状态：</label>
                    <span className={user.status === 'active' ? 'status-active' : 'status-inactive'}>
                      {user.status === 'active' ? '正常' : '禁用'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>注册时间：</label>
                    <span>{new Date(user.createdAt).toLocaleString()}</span>
                  </div>
                  {user.lastLoginAt && (
                    <div className="info-item">
                      <label>最后登录：</label>
                      <span>{new Date(user.lastLoginAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
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
                <div className="section-actions">
                  <button className="add-passenger-btn" onClick={handleAddPassenger}>
                    + 添加乘车人
                  </button>
                </div>

                <div className="passengers-list">
                  {passengers.map(passenger => (
                    <div key={passenger.id} className="passenger-card">
                      <div className="passenger-info">
                        <h4>{passenger.name}</h4>
                        <p>身份证：{passenger.idCard}</p>
                        <p>手机号：{passenger.phone}</p>
                        <p>类型：{passenger.passengerType}</p>
                      </div>
                      <div className="passenger-actions">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditPassenger(passenger)}
                        >
                          编辑
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeletePassenger(passenger.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {passengers.length === 0 && (
                    <div className="empty-state">
                      <p>暂无乘车人信息，请添加乘车人</p>
                    </div>
                  )}
                </div>
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
                  
                  {filteredOrders.length === 0 && (
                    <div className="empty-state">
                      <p>暂无符合条件的订单</p>
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
    </div>
  );
};

export default ProfilePage;