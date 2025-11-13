import React, { useState, useCallback } from 'react';
import { parseCityStationInput } from '../utils/cityStationMap';
import './SearchConditions.css';

interface SearchConditionsProps {
  fromStation: string;
  toStation: string;
  departDate: string;
  passengerType: 'adult' | 'student';
  trainType: 'all' | 'high_speed';
  returnDate?: string;
  tripType?: 'single' | 'round';
  onConditionsChange?: (conditions: SearchConditions) => void;
  onStationFilterChange?: (filters: { fromStations?: string[]; toStations?: string[] }) => void;
}

interface SearchConditions {
  fromStation: string;
  toStation: string;
  departDate: string;
  returnDate: string;
  passengerType: 'adult' | 'student';
  trainType: 'all' | 'high_speed';
  tripType: 'single' | 'round';
}

const SearchConditions: React.FC<SearchConditionsProps> = ({
  fromStation,
  toStation,
  departDate,
  passengerType,
  trainType,
  onConditionsChange,
  onStationFilterChange,
  returnDate = '',
  tripType = 'single'
}) => {
  const [conditions, setConditions] = useState<SearchConditions>({
    fromStation,
    toStation,
    departDate,
    returnDate,
    passengerType,
    trainType,
    tripType
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  // 智能解析输入并自动设置车站筛选
  const getAutoStationFilters = useCallback(() => {
    const fromResult = parseCityStationInput(conditions.fromStation);
    const toResult = parseCityStationInput(conditions.toStation);
    
    const filters: { fromStations?: string[]; toStations?: string[] } = {};
    
    if (fromResult.isCity) {
      filters.fromStations = fromResult.stations;
    }
    
    if (toResult.isCity) {
      filters.toStations = toResult.stations;
    }
    
    return filters;
  }, [conditions.fromStation, conditions.toStation]);

  // 日期范围：今天至30天后
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const getMaxDateString = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSwapStations = () => {
    const newConditions = {
      ...conditions,
      fromStation: conditions.toStation,
      toStation: conditions.fromStation
    };
    setConditions(newConditions);
  };

  const handleDateChange = (date: string) => {
    const newConditions = { ...conditions, departDate: date };
    setConditions(newConditions);
  };

  const handlePassengerTypeChange = (type: 'adult' | 'student') => {
    const newConditions = { ...conditions, passengerType: type };
    setConditions(newConditions);
  };

  const handleTripTypeChange = (type: 'single' | 'round') => {
    const newConditions = {
      ...conditions,
      tripType: type,
      // 单程时清空返程日期
      returnDate: type === 'single' ? '' : conditions.returnDate
    };
    setConditions(newConditions);
  };

  const handleReturnDateChange = (date: string) => {
    const newConditions = { ...conditions, returnDate: date };
    setConditions(newConditions);
  };

  const handleFromStationChange = (value: string) => {
    const newConditions = { ...conditions, fromStation: value };
    setConditions(newConditions);
    if (errorMessage && value.trim() && newConditions.toStation.trim()) {
      setErrorMessage('');
    }
  };

  const handleToStationChange = (value: string) => {
    const newConditions = { ...conditions, toStation: value };
    setConditions(newConditions);
    if (errorMessage && value.trim() && newConditions.fromStation.trim()) {
      setErrorMessage('');
    }
  };

  // 点击查询才触发提交
  const handleSubmitQuery = () => {
    if (!conditions.fromStation.trim() || !conditions.toStation.trim()) {
      setErrorMessage('请填写出发地和目的地');
      return;
    }
    setErrorMessage('');
    
    // 自动获取车站筛选信息并传递
    const autoFilters = getAutoStationFilters();
    if (autoFilters.fromStations || autoFilters.toStations) {
      onStationFilterChange?.(autoFilters);
    }
    
    onConditionsChange?.(conditions);
  };

  // 已移除日期导航与其相关的日期选项生成逻辑

  return (
    <div className="search-conditions">
      {/* 查询条件主区域 */}
      <div className="search-main">
        {/* 左侧：单程/往返 */}
        <div className="trip-type-column">
          <label className="trip-type-item">
            <input
              type="radio"
              name="tripType"
              value="single"
              checked={conditions.tripType === 'single'}
              onChange={() => handleTripTypeChange('single')}
            />
            单程
          </label>
          <label className="trip-type-item">
            <input
              type="radio"
              name="tripType"
              value="round"
              checked={conditions.tripType === 'round'}
              onChange={() => handleTripTypeChange('round')}
            />
            往返
          </label>
        </div>

        <div className="station-selector">
          <div className="station-item">
            <label>出发地</label>
            <input
              type="text"
              className={`station-input ${errorMessage && !conditions.fromStation.trim() ? 'invalid' : ''}`}
              placeholder="请选择"
              value={conditions.fromStation}
              onChange={(e) => handleFromStationChange(e.target.value)}
            />
          </div>

          <button 
            className="swap-button"
            onClick={handleSwapStations}
            title="交换出发地和目的地"
          >
            ⇄
          </button>

          <div className="station-item">
            <label>目的地</label>
            <input
              type="text"
              className={`station-input ${errorMessage && !conditions.toStation.trim() ? 'invalid' : ''}`}
              placeholder="请选择"
              value={conditions.toStation}
              onChange={(e) => handleToStationChange(e.target.value)}
            />
          </div>
        </div>

        <div className="date-selector">
          <label>出发日期</label>
          <input
            id="departure-date"
            type="date"
            className="date-input"
            value={conditions.departDate}
            min={getTodayString()}
            max={getMaxDateString()}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div className={`date-selector ${conditions.tripType === 'single' ? 'disabled' : ''}`}>
          <label>返程日期</label>
          <input
            id="return-date"
            type="date"
            className="date-input"
            value={conditions.returnDate}
            min={conditions.departDate || getTodayString()}
            max={getMaxDateString()}
            onChange={(e) => handleReturnDateChange(e.target.value)}
            disabled={conditions.tripType === 'single'}
          />
        </div>

        <div className="passenger-type-selector">
          <label>乘客类型</label>
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="passengerType"
                value="adult"
                checked={conditions.passengerType === 'adult'}
                onChange={() => handlePassengerTypeChange('adult')}
              />
              成人
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="passengerType"
                value="student"
                checked={conditions.passengerType === 'student'}
                onChange={() => handlePassengerTypeChange('student')}
              />
              学生
            </label>
          </div>
        </div>

        <button className="search-button" onClick={handleSubmitQuery}>
          查询
        </button>
        {errorMessage && (
          <div className="form-error" role="alert" aria-live="polite">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchConditions;