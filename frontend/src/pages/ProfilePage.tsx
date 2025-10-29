import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddPassengerModal from '../components/AddPassengerModal';
import './ProfilePage.css';

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
  }, [isLoading, isLoggedIn, navigate]);

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

  // 乘客数据
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  // 获取乘车人数据
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const { getPassengers } = await import('../services/passengerService');
        const passengerList = await getPassengers();
        setPassengers(passengerList);
      } catch (error) {
        console.error('获取乘车人信息失败:', error);
        // 如果获取失败，使用用户基本信息作为默认乘车人
        setPassengers([
          {
            id: '1',
            name: user.realName,
            idCard: user.idNumber,
            phone: user.phoneNumber,
            passengerType: '成人'
          }
        ]);
      }
    };

    if (user) {
      fetchPassengers();
    }
  }, [user]);

  // 订单数据 - 改为从API获取
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

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
    // 当切换到订单页面时，加载订单数据
    if (section === 'orders') {
      fetchOrders();
    }
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
           status: (order.status === 'pending' ? 'unpaid' : 
                  order.status === 'paid' ? 'paid' :
                  order.status === 'cancelled' ? 'cancelled' : 'refunded') as 'paid' | 'unpaid' | 'cancelled' | 'refunded'
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
        const token = localStorage.getItem('token');
        
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
              status: order.status === 'pending' ? 'unpaid' : 
                     order.status === 'paid' ? 'paid' :
                     order.status === 'cancelled' ? 'cancelled' : 'refunded'
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

  // 监听订单筛选变化
  useEffect(() => {
    if (activeSection === 'orders') {
      fetchOrders(1, orderFilter);
    }
  }, [orderFilter]);

  const handleAddPassenger = () => {
    setEditingPassenger(null);
    setIsModalOpen(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setIsModalOpen(true);
  };

  const handleDeletePassenger = async (id: string) => {
    if (window.confirm('确定要删除这个乘车人吗？')) {
      try {
        const { deletePassenger } = await import('../services/passengerService');
        await deletePassenger(id);
        setPassengers(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('删除乘车人失败:', error);
        alert('删除乘车人失败，请稍后重试');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPassenger(null);
  };

  const handlePassengerAdd = async (passengerData: Omit<Passenger, 'id'>) => {
    try {
      const { addPassenger } = await import('../services/passengerService');
      const newPassenger = await addPassenger(passengerData);
      setPassengers(prev => [...prev, newPassenger]);
    } catch (error) {
      console.error('添加乘车人失败:', error);
      alert('添加乘车人失败，请稍后重试');
    }
  };

  const handlePassengerEdit = async (id: string, passengerData: Omit<Passenger, 'id'>) => {
    try {
      const { updatePassenger } = await import('../services/passengerService');
      const updatedPassenger = await updatePassenger(id, passengerData);
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
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/cancel`, {
          method: 'POST',
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
    </div>
  );
};

export default ProfilePage;