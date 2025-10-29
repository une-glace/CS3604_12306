import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Carousel from '../components/Carousel';
import BookingForm from '../components/BookingForm';
import './HomePage.css';

interface CarouselItem {
  id: number;
  image: string;
  title: string;
  link: string;
}

interface BookingData {
  from: string;
  to: string;
  date: string;
  trainType: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const carouselItems: CarouselItem[] = [
    {
      id: 1,
      image: 'https://kyfw.12306.cn/otn/resources/merged/images/banner1.jpg',
      title: '便民服务，温馨出行',
      link: '/service'
    },
    {
      id: 2,
      image: 'https://kyfw.12306.cn/otn/resources/merged/images/banner2.jpg',
      title: '智能购票，快捷便民',
      link: '/booking'
    },
    {
      id: 3,
      image: 'https://kyfw.12306.cn/otn/resources/merged/images/banner3.jpg',
      title: '安全出行，放心选择',
      link: '/safety'
    }
  ];

  const handleBookingSearch = (bookingData: BookingData) => {
    console.log('搜索车票:', bookingData);
    // 跳转到车次列表页面，传递查询参数
    const searchParams = new URLSearchParams({
      from: bookingData.from,
      to: bookingData.to,
      date: bookingData.date
    });
    navigate(`/train-list?${searchParams.toString()}`);
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

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      // 退出后刷新页面状态
      window.location.reload();
    }
  };

  return (
    <div className="homepage">
      {/* 头部 */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/logo.png" alt="12306" />
            <span>中国铁路12306</span>
          </div>
          <div className="user-actions">
            <button className="profile-btn" onClick={handleProfileClick}>我的12306</button>
            {isLoggedIn ? (
              <>
                <span className="welcome-text">您好，
                  <button className="username-btn" onClick={handleProfileClick}>
                    {user?.realName || user?.username}
                  </button>
                </span>
                <button className="logout-btn" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <>
                <button className="login-btn" onClick={handleLoginClick}>登录</button>
                <button className="register-btn" onClick={handleRegisterClick}>注册</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 导航栏 */}
      <nav className="navbar">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="/" className="active">首页</a></li>
            <li><a href="/train-list">车票预订</a></li>
            <li><a href="/orders">订单查询</a></li>
            <li><a href="/info">余票查询</a></li>
            <li><a href="/schedule">时刻表</a></li>
            <li><a href="/price">票价查询</a></li>
            <li><a href="/service">客运服务</a></li>
            <li><a href="/help">帮助中心</a></li>
          </ul>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="main-content">
        {/* 轮播图区域 */}
        <section className="carousel-section">
          <Carousel 
            items={carouselItems} 
            autoPlay={true} 
            interval={5000} 
          />
        </section>

        {/* 快速购票区域 */}
        <section className="booking-section">
          <BookingForm onSearch={handleBookingSearch} />
        </section>

        {/* 服务导航 */}
        <section className="services-section">
          <div className="services-container">
            <h2>便民服务</h2>
            <div className="services-grid">
              <div className="service-item">
                <div className="service-icon">🎫</div>
                <h3>车票预订</h3>
                <p>在线预订火车票</p>
              </div>
              <div className="service-item">
                <div className="service-icon">📋</div>
                <h3>订单查询</h3>
                <p>查询订单状态</p>
              </div>
              <div className="service-item">
                <div className="service-icon">🔍</div>
                <h3>余票查询</h3>
                <p>实时余票信息</p>
              </div>
              <div className="service-item">
                <div className="service-icon">⏰</div>
                <h3>时刻表</h3>
                <p>列车时刻查询</p>
              </div>
              <div className="service-item">
                <div className="service-icon">💰</div>
                <h3>票价查询</h3>
                <p>票价信息查询</p>
              </div>
              <div className="service-item">
                <div className="service-icon">🚄</div>
                <h3>客运服务</h3>
                <p>客运服务信息</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 底部 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-links">
            <div className="link-group">
              <h4>购票服务</h4>
              <ul>
                <li><a href="/train-list">车票预订</a></li>
                <li><a href="/orders">订单查询</a></li>
                <li><a href="/refund">退票改签</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>出行服务</h4>
              <ul>
                <li><a href="/schedule">时刻表</a></li>
                <li><a href="/price">票价查询</a></li>
                <li><a href="/station">车站信息</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>客户服务</h4>
              <ul>
                <li><a href="/help">帮助中心</a></li>
                <li><a href="/contact">联系我们</a></li>
                <li><a href="/feedback">意见反馈</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>关于我们</h4>
              <ul>
                <li><a href="/about">公司简介</a></li>
                <li><a href="/news">新闻中心</a></li>
                <li><a href="/careers">招聘信息</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 中国铁路客户服务中心 版权所有</p>
            <p>客服电话：12306</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;