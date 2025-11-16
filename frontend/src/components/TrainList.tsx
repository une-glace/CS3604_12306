import React, { useState, useMemo } from 'react';
import './TrainList.css';

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

interface TrainListProps {
  trains: TrainInfo[];
  onTrainSelect?: (train: TrainInfo) => void;
}

type SortType = 'departure' | 'arrival' | 'duration' | 'trainNo';
type SortOrder = 'asc' | 'desc';

const TrainList: React.FC<TrainListProps> = ({ trains, onTrainSelect }) => {
  const [sortType, setSortType] = useState<SortType>('departure');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 座位类型配置（按示例图收敛并排序）
  const seatTypes = [
    { key: 'business', label: '商务座', shortLabel: '商务' },
    { key: 'firstClassPlus', label: '特等座', shortLabel: '特等' },
    { key: 'firstClassPremium', label: '优选一等座', shortLabel: '优选一等' },
    { key: 'firstClass', label: '一等座', shortLabel: '一等' },
    { key: 'secondClass', label: '二等座', shortLabel: '二等' },
    { key: 'premiumSleeper', label: '高级软卧', shortLabel: '高软' },
    { key: 'softSleeper', label: '软卧/动卧', shortLabel: '软卧' },
    { key: 'hardSleeper', label: '硬卧', shortLabel: '硬卧' },
    { key: 'softSeat', label: '软座', shortLabel: '软座' },
    { key: 'hardSeat', label: '硬座', shortLabel: '硬座' },
    { key: 'noSeat', label: '无座', shortLabel: '无座' },
    { key: 'other', label: '其他', shortLabel: '其他' }
  ];

  // 排序逻辑
  const sortedTrains = useMemo(() => {
    const sorted = [...trains].sort((a, b) => {
      let comparison = 0;
      
      switch (sortType) {
        case 'departure':
          comparison = a.fromTime.localeCompare(b.fromTime);
          break;
        case 'arrival':
          comparison = a.toTime.localeCompare(b.toTime);
          break;
        case 'duration':
          const aDuration = parseDuration(a.duration);
          const bDuration = parseDuration(b.duration);
          comparison = aDuration - bDuration;
          break;
        case 'trainNo':
          comparison = a.trainNo.localeCompare(b.trainNo);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [trains, sortType, sortOrder]);

  // 解析时长字符串为分钟数
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+):(\d+)/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  };

  // 处理排序
  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortOrder('asc');
    }
  };

  // 渲染座位信息
  const renderSeatInfo = (train: TrainInfo, seatKey: string) => {
    const seatValue = train.seats[seatKey as keyof typeof train.seats];
    
    if (seatValue === undefined || seatValue === null) {
      return <span className="seat-unavailable">--</span>;
    }
    
    if (seatValue === 0 || seatValue === '0') {
      return <span className="seat-unavailable">--</span>;
    }
    
    if (typeof seatValue === 'string') {
      if (seatValue === '有') {
        return <span className="seat-available">有</span>;
      }
      if (seatValue === '候补') {
        return <span className="seat-waitlist">候补</span>;
      }
      return <span className="seat-available">{seatValue}</span>;
    }
    
    if (typeof seatValue === 'number' && seatValue > 0) {
      return <span className="seat-available">{seatValue}</span>;
    }
    
    return <span className="seat-unavailable">--</span>;
  };

  // 获取车次类型样式
  const getTrainTypeClass = (trainType: string) => {
    if (trainType.startsWith('G') || trainType.startsWith('C')) return 'train-type-g';
    if (trainType.startsWith('D')) return 'train-type-d';
    if (trainType.startsWith('Z')) return 'train-type-z';
    if (trainType.startsWith('T')) return 'train-type-t';
    if (trainType.startsWith('K')) return 'train-type-k';
    return 'train-type-other';
  };

  // 渲染排序图标
  const renderSortIcon = (type: SortType) => {
    if (sortType !== type) {
      return <span className="sort-icon">↕</span>;
    }
    return (
      <span className={`sort-icon active ${sortOrder}`}>
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const getArrivalNote = (fromTime: string, toTime: string) => {
    // 简单判断次日到达：到达时间小于出发时间
    if (toTime && fromTime && toTime.localeCompare(fromTime) < 0) {
      return '次日到达';
    }
    return '当日到达';
  };

  return (
    <div className="train-list">
      <div className="train-list-header">
        <div className="header-row">
          <div className="train-info-header">
            <div className="train-no-header" onClick={() => handleSort('trainNo')}>
              车次 {renderSortIcon('trainNo')}
            </div>
            <div className="stations-header">
              <div>出发站</div>
              <div>到达站</div>
            </div>
            <div className="times-header">
              <div className="times-sort" onClick={() => handleSort('departure')}>
                出发时间 {renderSortIcon('departure')}
              </div>
              <div className="times-sort" onClick={() => handleSort('arrival')}>
                到达时间 {renderSortIcon('arrival')}
              </div>
            </div>
            <div className="duration-header" onClick={() => handleSort('duration')}>
              历时 {renderSortIcon('duration')}
            </div>
          </div>
          <div className="seat-headers">
            {seatTypes.map(seatType => (
              <div key={seatType.key} className="seat-header" title={seatType.label}>
                {seatType.shortLabel}
              </div>
            ))}
          </div>
          <div className="action-header">
            <div>备注</div>
          </div>
        </div>
      </div>

      <div className="train-list-body">
        {sortedTrains.map((train, index) => (
          <div key={`${train.trainNo}-${index}`} className="train-row">
            <div className="train-info">
              <div className="train-no">
                <span className={`train-type ${getTrainTypeClass(train.trainType)}`}>
                  {train.trainNo}
                </span>
              </div>
              <div className="stations-info">
                <div className="station-line">
                  <span className="station-name">{train.fromStation}</span>
                </div>
                <div className="station-line">
                  <span className="station-name">{train.toStation}</span>
                </div>
              </div>
              <div className="times-info">
                <div className="time-line">
                  <span className="time">{train.fromTime}</span>
                </div>
                <div className="time-line">
                  <span className="time">{train.toTime}</span>
                </div>
                <div className="time-line">
                  <span className="arrival-note">{getArrivalNote(train.fromTime, train.toTime)}</span>
                </div>
              </div>
              <div className="duration-info">
                <div className="duration">{train.duration}</div>
              </div>
            </div>

            <div className="seat-info">
              {seatTypes.map(seatType => (
                <div key={seatType.key} className="seat-cell">
                  {renderSeatInfo(train, seatType.key)}
                </div>
              ))}
            </div>

            <div className="action-info">
              <div className="remarks">
                {train.remarks || '--'}
              </div>
              <button 
                className={`book-button ${train.canBook ? 'available' : 'disabled'}`}
                disabled={!train.canBook}
                onClick={() => train.canBook && onTrainSelect?.(train)}
              >
                {train.canBook ? '预订' : '不可预订'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedTrains.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚄</div>
          <div className="empty-text">暂无符合条件的车次</div>
          <div className="empty-hint">请尝试调整筛选条件或更换日期</div>
        </div>
      )}
    </div>
  );
};

export default TrainList;