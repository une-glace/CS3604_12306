import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchConditions from '../components/SearchConditions';
import FilterConditions from '../components/FilterConditions';
import TrainList from '../components/TrainList';
import LoginModal from '../components/LoginModal';
import './TrainListPage.css';

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
  const { isLoggedIn } = useAuth();
  
  // 从URL参数获取查询条件
  const fromStation = searchParams.get('from') || '上海';
  const toStation = searchParams.get('to') || '北京';
  const departDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [trains, setTrains] = useState<TrainInfo[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<TrainInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<TrainInfo | null>(null);

  // 模拟车次数据
  const mockTrains: TrainInfo[] = [
    {
      trainNo: 'G1407',
      trainType: 'G',
      fromStation: '上海',
      toStation: '北京南',
      fromTime: '12:36',
      toTime: '02:36',
      duration: '10:00',
      fromStationCode: 'SHH',
      toStationCode: 'VNP',
      seats: {
        business: 4,
        firstClass: '有',
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G2788',
      trainType: 'G',
      fromStation: '上海',
      toStation: '北京南',
      fromTime: '12:50',
      toTime: '04:23',
      duration: '19:33',
      fromStationCode: 'SHH',
      toStationCode: 'VNP',
      seats: {
        firstClass: '有',
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G3087',
      trainType: 'G',
      fromStation: '上海虹桥',
      toStation: '北京南',
      fromTime: '12:57',
      toTime: '02:35',
      duration: '15:38',
      fromStationCode: 'AOH',
      toStationCode: 'VNP',
      seats: {
        business: 6,
        firstClass: '有',
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G1629',
      trainType: 'G',
      fromStation: '上海虹桥',
      toStation: '北京南',
      fromTime: '13:07',
      toTime: '09:09',
      duration: '4:02',
      fromStationCode: 'AOH',
      toStationCode: 'VNP',
      seats: {
        business: 4,
        firstClass: 6,
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G1620',
      trainType: 'G',
      fromStation: '上海虹桥',
      toStation: '北京南',
      fromTime: '13:30',
      toTime: '02:46',
      duration: '4:16',
      fromStationCode: 'AOH',
      toStationCode: 'VNP',
      seats: {
        business: 4,
        firstClass: 6,
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G3789',
      trainType: 'G',
      fromStation: '上海',
      toStation: '北京南',
      fromTime: '13:15',
      toTime: '01:17',
      duration: '16:02',
      fromStationCode: 'SHH',
      toStationCode: 'VNP',
      seats: {
        firstClass: '有',
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G7772',
      trainType: 'G',
      fromStation: '上海',
      toStation: '北京南',
      fromTime: '13:39',
      toTime: '04:06',
      duration: '9:27',
      fromStationCode: 'SHH',
      toStationCode: 'VNP',
      seats: {
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    },
    {
      trainNo: 'G7723',
      trainType: 'G',
      fromStation: '上海',
      toStation: '北京南',
      fromTime: '13:47',
      toTime: '03:58',
      duration: '9:11',
      fromStationCode: 'SHH',
      toStationCode: 'VNP',
      seats: {
        secondClass: '有'
      },
      canBook: true,
      isHighSpeed: true
    }
  ];

  // 初始化数据
  useEffect(() => {
    setLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      setTrains(mockTrains);
      setFilteredTrains(mockTrains);
      setLoading(false);
    }, 1000);
  }, [fromStation, toStation, departDate]);

  // 处理筛选条件变化
  const handleFiltersChange = (filters: any) => {
    let filtered = [...trains];
    
    // 发车时间筛选
    if (filters.departureTime.length > 0) {
      filtered = filtered.filter(train => {
        const trainTime = train.fromTime;
        return filters.departureTime.some((timeRange: string) => {
          const [start, end] = timeRange.split('-');
          return trainTime >= start && trainTime < end;
        });
      });
    }
    
    // 车次类型筛选
    if (filters.trainTypes.length > 0 && !filters.trainTypes.includes('all')) {
      filtered = filtered.filter(train => {
        return filters.trainTypes.some((type: string) => {
          if (type === 'GC') return train.trainType === 'G' || train.trainType === 'C';
          if (type === 'D') return train.trainType === 'D';
          if (type === 'Z') return train.trainType === 'Z';
          if (type === 'T') return train.trainType === 'T';
          if (type === 'K') return train.trainType === 'K';
          return false;
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
    console.log('选择车次:', train);
    
    // 检查登录状态
    if (!isLoggedIn) {
      setSelectedTrain(train);
      setShowLoginModal(true);
      return;
    }
    
    // 已登录，直接跳转到订单页面
    navigateToOrder(train);
  };

  // 跳转到订单页面的逻辑
  const navigateToOrder = (train: TrainInfo) => {
    // 构建订单页面的查询参数
    const orderParams = new URLSearchParams({
      trainNumber: train.trainNo,
      from: fromStation,
      to: toStation,
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

  return (
    <div className="train-list-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="route">{fromStation} → {toStation}</span>
            <span className="date">{departDate}</span>
          </h1>
          <div className="header-actions">
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>

      {/* 查询条件区域 */}
      <SearchConditions
        fromStation={fromStation}
        toStation={toStation}
        departDate={departDate}
        passengerType="adult"
        trainType="all"
        onConditionsChange={handleConditionsChange}
      />

      {/* 主要内容区域 */}
      <div className="main-content">
        {/* 左侧筛选区域 */}
        <div className="sidebar">
          <FilterConditions onFiltersChange={handleFiltersChange} />
        </div>

        {/* 右侧车次列表区域 */}
        <div className="content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <div className="loading-text">正在查询车次信息...</div>
            </div>
          ) : (
            <>
              <div className="result-summary">
                <span className="result-count">
                  共找到 <strong>{filteredTrains.length}</strong> 趟车次
                </span>
                <div className="result-tips">
                  <span className="tip-item">🟢 有票</span>
                  <span className="tip-item">🟠 候补</span>
                  <span className="tip-item">⚪ 无票</span>
                </div>
              </div>
              
              <TrainList 
                trains={filteredTrains}
                onTrainSelect={handleTrainSelect}
              />
            </>
          )}
        </div>
      </div>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default TrainListPage;