import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';
import './CateringPage.css';

const CateringPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState<string>(today);
  const [trainNo, setTrainNo] = useState<string>('');
  const [fromStation, setFromStation] = useState<string>('');
  const [toStation, setToStation] = useState<string>('');

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');
  const handleProfileClick = () => navigate('/profile');
  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('date', date);
    if (trainNo.trim()) params.set('train', trainNo.trim());
    if (fromStation.trim()) params.set('from', fromStation.trim());
    if (toStation.trim()) params.set('to', toStation.trim());
    navigate(`/catering/book?${params.toString()}`);
  };

  return (
    <div className="catering-page">
      <header className="header">
        <div className="header-container header-top">
          <div className="brand">
            <img className="brand-logo" alt="中国铁路12306" src="/铁路12306-512x512.png" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="header-search">
            <input className="search-input" placeholder="搜索车票、 餐饮、 常旅客、 相关规章" type="text" />
            <button className="search-button">Q</button>
          </div>
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
              <>
                <button className="link-btn" onClick={handleProfileClick}>您好，{user?.realName || '用户'}</button>
                <span className="sep">|</span>
                <button className="link-btn" onClick={handleLogout}>退出</button>
              </>
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

      <Navbar />

      <main>
        <section className="catering-hero" aria-label="餐饮•特产">
          <div className="hero-overlay">
            <h1 className="hero-title">带有温度的旅途配餐，享受星级的体验，</h1>
            <h2 className="hero-subtitle">家乡的味道</h2>
            <div className="catering-search-bar">
              <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
              <input type="text" value={trainNo} onChange={(e) => setTrainNo(e.target.value)} placeholder="车次" />
              <input type="text" value={fromStation} onChange={(e) => setFromStation(e.target.value)} placeholder="乘车站" />
              <input type="text" value={toStation} onChange={(e) => setToStation(e.target.value)} placeholder="到达站" />
              <button className="search-primary" onClick={handleSearch}>搜索</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CateringPage;
