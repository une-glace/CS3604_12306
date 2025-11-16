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
  link?: string;
}

interface BookingData {
  from: string;
  to: string;
  date: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const carouselItems: CarouselItem[] = [
    { id: 1, image: '/homepage/Carousel/Carousel_1.jpg', title: '轮播一' },
    { id: 2, image: '/homepage/Carousel/Carousel_2.jpg', title: '轮播二' },
    { id: 3, image: '/homepage/Carousel/Carousel_3.jpg', title: '轮播三' },
    { id: 4, image: '/homepage/Carousel/Carousel_4.jpg', title: '轮播四' },
    { id: 5, image: '/homepage/Carousel/Carousel_5.jpg', title: '轮播五' },
    { id: 6, image: '/homepage/Carousel/Carousel_6.jpg', title: '轮播六' },
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

  // 通知栏选项卡状态
  const [activeNoticeTab, setActiveNoticeTab] = React.useState<'news' | 'faq' | 'credit'>('news');

  return (
    <div className="homepage">
      {/* 顶部导航栏 */}
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

      {/* 导航栏 */}
      <nav className="navbar">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="/" className="active">首页</a></li>
            {/* 保持原“车票查询/车票预订”跳转关系，改为“车票” */}
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
      <main className="main-content">
        {/* 轮播与查询栏（查询栏叠加在轮播上方） */}
        <section className="carousel-section">
          <Carousel 
            items={carouselItems} 
            autoPlay={true} 
            interval={4000} 
          />

          <div className="hero-booking">
            <div className="side-tabs">
              <button className="side-tab active">车票</button>
            </div>
            <div className="ticket-panel">
              <div className="ticket-tabs">
                <button className="ticket-tab active">单程</button>
                <button className="ticket-tab" disabled>往返</button>
                <button className="ticket-tab" disabled>中转换乘</button>
                <button className="ticket-tab" disabled>退改签</button>
              </div>
              <BookingForm onSearch={handleBookingSearch} />
            </div>
          </div>
        </section>
        {/* 其余服务导航（如需保留可在此处扩展） */}
      </main>

      {/* 服务区：与导航和主要内容并列，位于主要内容的下方 */}
      <div className="hero-service-row" aria-label="首页服务快捷按钮">
        <button type="button" className="hero-service-btn" aria-label="重点旅客预约">重点旅客预约</button>
        <button type="button" className="hero-service-btn" aria-label="遗失物品查找">遗失物品查找</button>
        <button type="button" className="hero-service-btn" aria-label="约车服务">约车服务</button>
        <button type="button" className="hero-service-btn" aria-label="便民托运">便民托运</button>
        <button type="button" className="hero-service-btn" aria-label="车站引导">车站引导</button>
        <button type="button" className="hero-service-btn" aria-label="站车风采">站车风采</button>
        <button type="button" className="hero-service-btn" aria-label="用户反馈">用户反馈</button>
      </div>

      {/* 服务区下方：2×2 图片区域 */}
      <section className="promo-section" aria-label="图文服务入口">
        <div className="promo-grid">
          <div className="promo-card promo-image-card">
            <img src="/homepage/service/abanner01.jpg" alt="服务宣传图一" loading="lazy" />
          </div>
          <div className="promo-card promo-image-card">
            <img src="/homepage/service/abanner02.jpg" alt="服务宣传图二" loading="lazy" />
          </div>
          <div className="promo-card promo-image-card">
            <img src="/homepage/service/abanner03.jpg" alt="服务宣传图三" loading="lazy" />
          </div>
          <div className="promo-card promo-image-card">
            <img src="/homepage/service/abanner04.jpg" alt="服务宣传图四" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 通知栏：最新发布 / 常见问题 / 信用信息 三栏 */}
      <section className="notice-section" aria-label="公告与常见问题与信用信息">
        <div className="notice-header" role="tablist" aria-label="通知栏选项">
          <div
            className={`notice-tab ${activeNoticeTab === 'news' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeNoticeTab === 'news'}
            tabIndex={0}
            onClick={() => setActiveNoticeTab('news')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveNoticeTab('news'); }}
          >最新发布</div>
          <div
            className={`notice-tab ${activeNoticeTab === 'faq' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeNoticeTab === 'faq'}
            tabIndex={0}
            onClick={() => setActiveNoticeTab('faq')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveNoticeTab('faq'); }}
          >常见问题</div>
          <div
            className={`notice-tab ${activeNoticeTab === 'credit' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeNoticeTab === 'credit'}
            tabIndex={0}
            onClick={() => setActiveNoticeTab('credit')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveNoticeTab('credit'); }}
          >信用信息</div>
        </div>

        <div className="notice-content">
          {activeNoticeTab === 'news' && (
            <div className="notice-column">
              <ul className="news-list">
                <li><span className="bullet" /> <a href="#">公告</a> <span className="date">2024-12-11</span></li>
                <li><span className="bullet" /> <a href="#">关于优化铁路车票改签规则的公告</a> <span className="date">2024-01-11</span></li>
                <li><span className="bullet" /> <a href="#">铁路旅客禁止、限制携带和托运物品目录</a> <span className="date">2023-11-30</span></li>
                <li><span className="bullet" /> <a href="#">公告</a> <span className="date">2022-12-22</span></li>
                <li><span className="bullet" /> <a href="#">中国铁路上海局集团有限公司关于2025年11月16日~2025年...</a> <span className="date">2025-11-10</span></li>
              </ul>
              <a className="more-link" href="#">更多&gt;</a>
            </div>
          )}

          {activeNoticeTab === 'faq' && (
            <div className="notice-column">
              <div className="faq-grid">
                <ul className="faq-list">
                  <li><span className="bullet" /> 实名制车票</li>
                  <li><span className="bullet" /> 互联网购票</li>
                  <li><span className="bullet" /> 随身携带品</li>
                  <li><span className="bullet" /> 丢失购票时使用的有效身份证件</li>
                  <li><span className="bullet" /> 广深港跨境列车</li>
                </ul>
                <ul className="faq-list">
                  <li><span className="bullet" /> 售票窗口购票</li>
                  <li><span className="bullet" /> 互联网退票</li>
                  <li><span className="bullet" /> 进出站</li>
                  <li><span className="bullet" /> 使用居民身份证直接检票乘车</li>
                </ul>
              </div>
              <a className="more-link" href="#">更多&gt;</a>
            </div>
          )}

          {activeNoticeTab === 'credit' && (
            <div className="notice-column">
              <div className="credit-grid">
                <div className="credit-card">
                  <div className="credit-title">失信被执行人(自然人)公示</div>
                  <div className="credit-empty">
                    <div className="empty-icon" />
                    <div className="empty-text">暂无法公开数据</div>
                  </div>
                  <a className="more-link" href="#">更多&gt;</a>
                </div>
                <div className="credit-card">
                  <div className="credit-title">失信已执行人(自然人)公布</div>
                  <div className="credit-empty">
                    <div className="empty-icon" />
                    <div className="empty-text">暂无法公开数据</div>
                  </div>
                  <a className="more-link" href="#">更多&gt;</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 底部 */}
      <footer className="footer">
        <div className="footer-container">
          
          <div className="footer-bottom">
            <p>版权所有©2008-2025 中国铁道科学研究院集团有限公司 技术支持：铁旅科技有限公司</p>
            <p>公安 京公网安备 11010802038392号 | 京ICP备05020493号-4 | ICP证：京B2-20202537 | 营业执照</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
