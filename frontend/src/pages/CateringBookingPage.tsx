import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';
import './CateringBookingPage.css';

type VendorStatus = 'open' | 'closed';
type Vendor = { name: string; status: VendorStatus; orderWindow?: string; minOrder?: string; deliveryFee?: string; logo?: string };
type Good = { name: string; price: string; image?: string };

const CateringBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const trainParam = searchParams.get('train') || 'G10';
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';

  const TRAIN_STATIONS: Record<string, { from: string; to: string }> = {
    'G1': { from: '北京南', to: '上海虹桥' },
    'G10': { from: '北京南', to: '上海虹桥' },
    'G103': { from: '北京南', to: '济南西' }
  };
  const TRAIN_TIMES: Record<string, { fromTime: string; toTime: string }> = {
    'G1': { fromTime: '06:20', toTime: '11:30' },
    'G10': { fromTime: '07:00', toTime: '12:30' },
    'G103': { fromTime: '06:20', toTime: '08:04' }
  };
  const resolveStations = (t: string, fFallback: string, tFallback: string): { from: string; to: string } => {
    const m = TRAIN_STATIONS[t.toUpperCase()] || TRAIN_STATIONS[t.toUpperCase().replace(/\s+/g, '')];
    const from = (fromParam || fFallback || m?.from || '北京南');
    const to = (toParam || tFallback || m?.to || '济南西');
    return { from, to };
  };
  const baseStations = resolveStations(trainParam, fromParam, toParam);
  const [qDate, setQDate] = React.useState<string>(dateParam);
  const [qTrain, setQTrain] = React.useState<string>(trainParam);
  const [qFrom, setQFrom] = React.useState<string>(baseStations.from);
  const [qTo, setQTo] = React.useState<string>(baseStations.to);

  const date = qDate;
  const fromStation = qFrom;
  const toStation = qTo;
  const departTimes = TRAIN_TIMES[qTrain.toUpperCase()] || { fromTime: '08:00', toTime: '10:00' };

  const [onlyOpen, setOnlyOpen] = React.useState<boolean>(false);
  const [selectedStations, setSelectedStations] = React.useState<{ all: boolean; from: boolean; to: boolean }>({ all: true, from: true, to: true });

  const goods: Good[] = [
    { name: '15元冷链餐', price: '￥15.00', image: '/Food/列车自营商品-15元.jpg' },
    { name: '30元冷链餐', price: '￥30.00', image: '/Food/列车自营商品-30元.jpg' },
    { name: '40元冷链餐', price: '￥40.00', image: '/Food/列车自营商品-40元.jpg' }
  ];

  const BASE_VENDOR_BRANDS: Array<{ brand: string; image: string; status: VendorStatus }> = [
    { brand: '永和大王', image: '/Food/永和大王.jpg', status: 'open' },
    { brand: '老娘舅', image: '/Food/老娘舅.jpg', status: 'open' },
    { brand: '麦当劳', image: '/Food/麦当劳.jpg', status: 'closed' }
  ];
  const ARRIVAL_VENDOR_BRANDS: Array<{ brand: string; image: string; status: VendorStatus }> = [
    { brand: '康师傅', image: '/Food/康师傅.jpg', status: 'open' },
    { brand: '德克士', image: '/Food/德克士.jpg', status: 'open' },
    { brand: '真功夫', image: '/Food/真功夫.jpg', status: 'closed' }
  ];
  const makeVendors = (station: string, brands: Array<{ brand: string; image: string; status: VendorStatus }>): Vendor[] => {
    return brands.map(b => ({
      name: `${b.brand}（${station}站店）`,
      status: b.status,
      orderWindow: '12:02 09:00截止下单',
      minOrder: '￥0.00',
      deliveryFee: '￥8.00',
      logo: b.image
    }));
  };

  const filterVendors = (list: Vendor[]) => (onlyOpen ? list.filter(v => v.status === 'open') : list);

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');
  const handleProfileClick = () => navigate('/profile');
  const handleLogout = async () => { await logout(); navigate('/'); };
  
  const handleQuery = () => {
    const p = new URLSearchParams();
    p.set('date', qDate);
    p.set('train', qTrain);
    if (qFrom.trim()) p.set('from', qFrom.trim());
    if (qTo.trim()) p.set('to', qTo.trim());
    navigate(`/catering/book?${p.toString()}`);
  };

  const toggleAll = () => {
    setSelectedStations({ all: true, from: true, to: true });
  };
  const toggleFrom = (checked: boolean) => {
    const next = { ...selectedStations, from: checked, all: false };
    setSelectedStations(next);
  };
  const toggleTo = (checked: boolean) => {
    const next = { ...selectedStations, to: checked, all: false };
    setSelectedStations(next);
  };

  const openVendor = (v: Vendor, station: string) => {
    const p = new URLSearchParams();
    p.set('name', v.name);
    p.set('brand', v.name.replace(/（.*$/, ''));
    p.set('station', station);
    p.set('min', v.minOrder || '￥0.00');
    p.set('fee', v.deliveryFee || '￥0.00');
    p.set('stop', '12-02 09:00');
    p.set('cancel', '12-02 09:00');
    navigate(`/catering/vendor?${p.toString()}`);
  };

  return (
    <div className="catering-booking">
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

      <main className="booking-main">
        <section className="filter-row" aria-label="查询与配送站">
          <div className="booking-filter">
            <div className="filter-top">
              <div className="field field-date">
                <span className="field-label">乘车日期</span>
                <input className="filter-input" type="date" value={qDate} onChange={(e) => setQDate(e.target.value)} />
              </div>
              <div className="field field-train">
                <span className="field-label">车次</span>
                <input className="filter-input" type="text" placeholder="如 G10" value={qTrain} onChange={(e) => setQTrain(e.target.value)} />
              </div>
              <div className="field field-from">
                <span className="field-label">乘车站</span>
                <input className="filter-input" type="text" placeholder="如 北京南" value={qFrom} onChange={(e) => setQFrom(e.target.value)} />
              </div>
              <div className="field field-to">
                <span className="field-label">到达站</span>
                <input className="filter-input" type="text" placeholder="如 上海虹桥" value={qTo} onChange={(e) => setQTo(e.target.value)} />
              </div>
              <button className="btn-query" onClick={handleQuery}>查询</button>
            </div>
            <div className="filter-divider" />
            <div className="filter-bottom">
              <div className="bottom-left">
                <span className="label">配送站：</span>
                <button type="button" className="chip-all" onClick={toggleAll}>全部</button>
                <label className="station-check"><input type="checkbox" checked={selectedStations.from} onChange={(e) => toggleFrom(e.target.checked)} /> {fromStation}</label>
                <label className="station-check"><input type="checkbox" checked={selectedStations.to} onChange={(e) => toggleTo(e.target.checked)} /> {toStation}</label>
              </div>
              <div className="bottom-right">
                <label className="checkbox"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> 显示可预订商家</label>
              </div>
            </div>
          </div>
        </section>

        <section className="goods-section" aria-label="列车自营商品">
          <div className="section-title">列车自营商品</div>
          <div className="goods-divider" />
          <div className="goods-grid">
            {goods.map((g, idx) => (
              <div key={idx} className="good-card">
                <img src={g.image || '/image.png'} alt={g.name} className="good-img" />
                <div className="good-content">
                  <div className="good-name">{g.name}</div>
                  <div className="good-price">{g.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedStations.from && (
        <section className="vendors-section" aria-label={fromStation}>
          <div className="section-title">{fromStation} <span className="section-sub">（{date} {departTimes.fromTime} 开车）</span></div>
          <div className="vendors-divider" />
          <div className="vendor-grid">
            {filterVendors(makeVendors(fromStation, BASE_VENDOR_BRANDS)).map((v, i) => (
              <div key={`${fromStation}-${i}`} className={`vendor-card ${v.status}`} onClick={() => openVendor(v, fromStation)}>
                <img className="vendor-thumb" src={v.logo || '/logo-12306.svg'} alt={v.name} />
                <div className="vendor-content">
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-meta">起送：{v.minOrder} | 配送费：{v.deliveryFee} | 取餐：{v.orderWindow}</div>
                </div>
                <div className={`status-badge ${v.status}`}>{v.status === 'open' ? '可预订' : '休息中'}</div>
              </div>
            ))}
          </div>
        </section>
        )}

        {selectedStations.to && (
        <section className="vendors-section" aria-label={toStation}>
          <div className="section-title">{toStation} <span className="section-sub">（{date} {departTimes.toTime} 开车）</span></div>
          <div className="vendors-divider" />
          <div className="vendor-grid">
            {filterVendors(makeVendors(toStation, ARRIVAL_VENDOR_BRANDS)).map((v, i) => (
              <div key={`${toStation}-${i}`} className={`vendor-card ${v.status}`} onClick={() => openVendor(v, toStation)}>
                <img className="vendor-thumb" src={v.logo || '/logo-12306.svg'} alt={v.name} />
                <div className="vendor-content">
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-meta">起送：{v.minOrder} | 配送费：{v.deliveryFee} | 取餐：{v.orderWindow}</div>
                </div>
                <div className={`status-badge ${v.status}`}>{v.status === 'open' ? '可预订' : '休息中'}</div>
              </div>
            ))}
          </div>
        </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CateringBookingPage;
