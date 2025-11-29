import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchConditions from '../components/SearchConditions';
import { parseCityStationInput } from '../utils/cityStationMap';
import FilterConditions from '../components/FilterConditions';
import TrainList from '../components/TrainList';
import LoginModal from '../components/LoginModal';
import Footer from '../components/Footer';
import './TrainListPage.css';
import './HomePage.css';

interface TrainInfo {
  trainNo: string;
  trainType: string;
  fromStation: string;
  toStation: string;
  fromTime: string;
  toTime: string;
  duration: string;
  fromStationCode: string;
  toStationCode: string;
  seats: {
    business?: string | number;
    firstClassPlus?: string | number;
    firstClassPremium?: string | number;
    firstClass?: string | number;
    secondClass?: string | number;
    secondClassPackage?: string | number;
    premiumSleeper?: string | number;
    softSleeper?: string | number;
    firstSleeper?: string | number;
    hardSleeper?: string | number;
    secondSleeper?: string | number;
    softSeat?: string | number;
    hardSeat?: string | number;
    noSeat?: string | number;
    other?: string | number;
  };
  canBook: boolean;
  isHighSpeed: boolean;
  remarks?: string;
}

const TrainListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  
  // 从URL参数获取查询条件
  const fromStation = searchParams.get('from') || '';
  const toStation = searchParams.get('to') || '';
  const departDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [trains, setTrains] = useState<TrainInfo[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<TrainInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<TrainInfo | null>(null);
  const [fromStations, setFromStations] = useState<string[]>([]);
  const [toStations, setToStations] = useState<string[]>([]);

  // 头部操作：与首页保持一致
  const handleProfileClick = () => {
    navigate('/profile');
  };
  const handleLoginClick = () => {
    navigate('/login');
  };
  const handleRegisterClick = () => {
    navigate('/register');
  };
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 后端查询映射函数
  const mapToTrainInfo = (t: any): TrainInfo => {
    const seats: TrainInfo['seats'] = {};
    const si = t.seatInfo || {};
    const fmt = (item: any) => {
      if (!item) return undefined;
      if (item.availableSeats > 0) return '有';
      if (item.isAvailable === true) return '候补';
      return '无';
    };
    if (si['商务座']) seats.business = fmt(si['商务座']);
    if (si['特等座']) seats.firstClassPlus = fmt(si['特等座']);
    if (si['优选一等座']) seats.firstClassPremium = fmt(si['优选一等座']);
    if (si['一等座']) seats.firstClass = fmt(si['一等座']);
    if (si['二等座']) seats.secondClass = fmt(si['二等座']);
    if (si['硬座']) seats.hardSeat = fmt(si['硬座']);
    if (si['硬卧']) seats.hardSleeper = fmt(si['硬卧']);
    if (si['软卧']) seats.softSleeper = fmt(si['软卧']);
    const canBook = Object.keys(si).length === 0
      ? true
      : Object.values(si).some((x: any) => x && x.availableSeats > 0);
    const isHighSpeed = t.trainType === 'G' || t.trainType === 'C';
    return {
      trainNo: t.trainNumber,
      trainType: t.trainType,
      fromStation: t.fromStation,
      toStation: t.toStation,
      fromTime: t.departureTime,
      toTime: t.arrivalTime,
      duration: t.duration,
      fromStationCode: '',
      toStationCode: '',
      seats,
      canBook,
      isHighSpeed
    };
  };

  // 初始化数据
  useEffect(() => {
    const fetch = async () => {
      if (!fromStation || !toStation) {
        setTrains([]);
        setFilteredTrains([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { searchTrains } = await import('../services/trainService');
        
        // 智能解析：如果首页传入的是城市名，展开为城市内所有车站
        let effectiveFromStations = fromStations;
        let effectiveToStations = toStations;

        if (effectiveFromStations.length === 0) {
          const parsed = parseCityStationInput(fromStation);
          if (parsed.isCity && parsed.stations.length > 0) {
            effectiveFromStations = parsed.stations;
            setFromStations(parsed.stations);
          }
        }
        if (effectiveToStations.length === 0) {
          const parsed = parseCityStationInput(toStation);
          if (parsed.isCity && parsed.stations.length > 0) {
            effectiveToStations = parsed.stations;
            setToStations(parsed.stations);
          }
        }

        const searchParams: any = {
          fromStation,
          toStation,
          departureDate: departDate,
        };
        
        // 如果有多车站筛选，添加到查询参数
        if (effectiveFromStations.length > 0) {
          searchParams.fromStations = effectiveFromStations;
        }
        if (effectiveToStations.length > 0) {
          searchParams.toStations = effectiveToStations;
        }
        
        const list = await searchTrains(searchParams);
        const mapped = list.map(mapToTrainInfo);
        setTrains(mapped);
        setFilteredTrains(mapped);
      } catch (e) {
        console.error('加载车次失败', e);
        setTrains([]);
        setFilteredTrains([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [fromStation, toStation, departDate, fromStations, toStations]);

  // 处理筛选条件变化（横向筛选栏）
  const handleFiltersChange = (filters: any) => {
    let filtered = [...trains];

    // 发车时间筛选（单选）
    if (filters.departureTime && filters.departureTime !== '00:00-24:00') {
      const [start, end] = filters.departureTime.split('-');
      filtered = filtered.filter(train => train.fromTime >= start && train.fromTime < end);
    }

    // 车次类型筛选
    if (Array.isArray(filters.trainTypes) && filters.trainTypes.length > 0) {
      filtered = filtered.filter(train => {
        return filters.trainTypes.some((type: string) => {
          if (type === 'GC') return train.trainType === 'G' || train.trainType === 'C';
          if (type === 'D') return train.trainType === 'D';
          if (type === 'Z') return train.trainType === 'Z';
          if (type === 'T') return train.trainType === 'T';
          if (type === 'K') return train.trainType === 'K';
          if (type === 'fuxing' || type === 'smart') return train.isHighSpeed === true;
          if (type === 'other') return !['G','C','D','Z','T','K'].includes(train.trainType);
          return false;
        });
      });
    }

    // 出发车站筛选
    if (Array.isArray(filters.departureStations) && filters.departureStations.length > 0) {
      const allFrom = Array.from(new Set(trains.map(t => t.fromStation)));
      const isAllSelected = filters.departureStations.length === allFrom.length;
      if (!isAllSelected) {
        const set = new Set(filters.departureStations);
        filtered = filtered.filter(train => set.has(train.fromStation));
      }
    }

    // 到达车站筛选
    if (Array.isArray(filters.arrivalStations) && filters.arrivalStations.length > 0) {
      const allTo = Array.from(new Set(trains.map(t => t.toStation)));
      const isAllSelected = filters.arrivalStations.length === allTo.length;
      if (!isAllSelected) {
        const set = new Set(filters.arrivalStations);
        filtered = filtered.filter(train => set.has(train.toStation));
      }
    }

    // 席别筛选
    if (Array.isArray(filters.seatTypes) && filters.seatTypes.length > 0) {
      const seatKeyMap: Record<string, keyof TrainInfo['seats']> = {
        business: 'business',
        first_class_premium: 'firstClassPremium',
        first_class: 'firstClass',
        second_class: 'secondClass',
        first_sleeper: 'firstSleeper',
        second_sleeper: 'secondSleeper',
        soft_sleeper: 'softSleeper',
        hard_sleeper: 'hardSleeper',
        hard_seat: 'hardSeat'
      };
      filtered = filtered.filter(train => {
        return filters.seatTypes.some((st: string) => {
          const key = seatKeyMap[st];
          if (!key) return false;
          const v = train.seats[key];
          return v !== undefined && v !== 0 && v !== '无';
        });
      });
    }

    setFilteredTrains(filtered);
  };

  // 处理查询条件变化
  const handleConditionsChange = (conditions: any) => {
    // 更新URL参数
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('from', conditions.fromStation);
    newSearchParams.set('to', conditions.toStation);
    newSearchParams.set('date', conditions.departDate);
    
    navigate(`/train-list?${newSearchParams.toString()}`, { replace: true });
  };

  // 处理车次选择
  const handleTrainSelect = (train: TrainInfo) => {
    if (!isLoggedIn) {
      setSelectedTrain(train);
      setShowLoginModal(true);
      return;
    }
    navigateToOrder(train);
  };

  // 跳转到订单页面的逻辑
  const navigateToOrder = (train: TrainInfo) => {
    // 构建订单页面的查询参数
    const orderParams = new URLSearchParams({
      trainNumber: train.trainNo,
      from: train.fromStation,
      to: train.toStation,
      departureTime: train.fromTime,
      arrivalTime: train.toTime,
      date: departDate,
      duration: train.duration,
      seatType: '二等座', // 默认座位类型
      price: '553' // 默认价格，实际应该根据座位类型计算
    });
    
    // 跳转到订单页面
    navigate(`/order?${orderParams.toString()}`);
  };

  // 登录成功后的处理
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (selectedTrain) {
      navigateToOrder(selectedTrain);
      setSelectedTrain(null);
    }
  };

  const hasQuery = fromStation.trim() !== '' && toStation.trim() !== '';

  const availableDepartureStations = Array.from(new Set(trains.map(t => t.fromStation)));
  const availableArrivalStations = Array.from(new Set(trains.map(t => t.toStation)));

  const handleDateSelect = (date: string) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('from', fromStation);
    newSearchParams.set('to', toStation);
    newSearchParams.set('date', date);
    navigate(`/train-list?${newSearchParams.toString()}`, { replace: true });
  };

  return (
    <div className="train-list-page">
      {/* 顶部导航栏：替换为首页同款 */}
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

          {/* 中间：搜索框（与首页一致，当前不联动查询） */}
          <div className="header-search">
            <input
              className="search-input"
              type="text"
              placeholder="搜索车票、 餐饮、 常旅客、 相关规章"
            />
            <button className="search-button">Q</button>
          </div>

          {/* 右侧：链接与操作（与首页一致） */}
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

      {/* 查询条件区域 */}
      <SearchConditions
        fromStation={fromStation}
        toStation={toStation}
        departDate={departDate}
        passengerType="adult"
        trainType="all"
        onConditionsChange={handleConditionsChange}
        onStationFilterChange={(filters) => {
          setFromStations(filters.fromStations || []);
          setToStations(filters.toStations || []);
        }}
      />

      {/* 横向筛选栏：置于查询栏下方 */}
      <FilterConditions
        currentDate={departDate}
        fromStation={fromStation}
        toStation={toStation}
        availableDepartureStations={availableDepartureStations}
        availableArrivalStations={availableArrivalStations}
        onFiltersChange={handleFiltersChange}
        onDateSelect={handleDateSelect}
        hasQuery={hasQuery}
      />

      {/* 主要内容区域 */}
      <div className="main-content">

        {/* 右侧车次列表区域 */}
        <div className="content">
          {hasQuery && (
            loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <div className="loading-text">正在查询车次信息...</div>
              </div>
            ) : (
              <>
                <div className="result-summary">
                  <span className="result-count">
                    {fromStation}{' --> '}{toStation} （{(() => {
                      const d = new Date(departDate);
                      const md = `${d.getMonth() + 1}月${d.getDate()}日`;
                      const days = ['周日','周一','周二','周三','周四','周五','周六'];
                      const wk = days[d.getDay()] || '';
                      return `${md} ${wk}`;
                    })()}）共计{filteredTrains.length}车次
                  </span>
                </div>
                
                <TrainList 
                  trains={filteredTrains}
                  onTrainSelect={handleTrainSelect}
                />
              </>
            )
          )}
        </div>
      </div>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 底部与首页一致的灰色 Footer */}
      <Footer />
    </div>
  );
};

export default TrainListPage;
