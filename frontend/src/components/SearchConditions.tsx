import React, { useState, useCallback, useEffect } from 'react';
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
  readOnlyStations?: boolean;
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
  tripType = 'single',
  readOnlyStations = false
}) => {
  const HOT_CITIES = [
    '北京','上海','天津','重庆','长沙','长春','成都','福州','广州','贵阳','呼和浩特','哈尔滨','合肥','杭州','海口','济南','昆明','拉萨','兰州','南宁','南京','南昌','沈阳','石家庄','太原','乌鲁木齐','武汉','西宁','西安','银川','郑州','深圳','厦门'
  ];
  const TAB_LABELS = ['热门','ABCDE','FGHIJ','KLMNO','PQRST','UVWXYZ'] as const;
  const [dropdownOpenFor, setDropdownOpenFor] = useState<'from'|'to'|null>(null);
  const [activeTab, setActiveTab] = useState<typeof TAB_LABELS[number]>('热门');
  const [scope, setScope] = useState<'domestic'|'international'>('domestic');
  const [conditions, setConditions] = useState<SearchConditions>({
    fromStation,
    toStation,
    departDate,
    returnDate,
    passengerType,
    trainType,
    tripType
  });
  useEffect(() => {
    setConditions(prev => ({ ...prev, departDate }));
  }, [departDate]);
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

  const openDropdown = (which: 'from'|'to') => {
    setDropdownOpenFor(which);
    setActiveTab('热门');
  };
  const closeDropdown = () => setDropdownOpenFor(null);
  const pickCity = (which: 'from'|'to', city: string) => {
    if (which === 'from') {
      handleFromStationChange(city);
    } else {
      handleToStationChange(city);
    }
    closeDropdown();
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
              onFocus={() => { if (!readOnlyStations) openDropdown('from'); }}
              onClick={() => { if (!readOnlyStations) openDropdown('from'); }}
              readOnly={readOnlyStations}
              disabled={readOnlyStations}
            />
            {dropdownOpenFor === 'from' && !readOnlyStations && (
              <div className="station-dropdown" role="dialog" aria-label="选择出发地">
                <div className="dropdown-inner">
                  <div className="scope-column">
                    <button type="button" className={`scope-btn ${scope==='domestic'?'active':''}`} onClick={() => setScope('domestic')}>国内站点</button>
                    <button type="button" className={`scope-btn ${scope==='international'?'active':''}`} onClick={() => setScope('international')}>国际站点</button>
                  </div>
                  <div className="dropdown-main">
                    <div className="dropdown-header">拼音支持首字母输入</div>
                    <div className="dropdown-tabs">
                      {TAB_LABELS.map(label => (
                        <button key={`tab-${label}`} className={`dropdown-tab ${activeTab===label?'active':''}`} onClick={() => setActiveTab(label)}>{label}</button>
                      ))}
                      <button type="button" className="dropdown-close" aria-label="关闭" onClick={closeDropdown}>×</button>
                    </div>
                    <div className="dropdown-content">
                      <div className="city-grid">
                        {(activeTab==='热门' ? HOT_CITIES : HOT_CITIES).map(city => (
                          <button type="button" key={`from-dd-${city}`} className="city-item" onClick={() => pickCity('from', city)}>{city}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="station-item">
            <label>目的地</label>
            <input
              type="text"
              className={`station-input ${errorMessage && !conditions.toStation.trim() ? 'invalid' : ''}`}
              placeholder="请选择"
              value={conditions.toStation}
              onChange={(e) => handleToStationChange(e.target.value)}
              onFocus={() => { if (!readOnlyStations) openDropdown('to'); }}
              onClick={() => { if (!readOnlyStations) openDropdown('to'); }}
              readOnly={readOnlyStations}
              disabled={readOnlyStations}
            />
            {dropdownOpenFor === 'to' && !readOnlyStations && (
              <div className="station-dropdown" role="dialog" aria-label="选择目的地">
                <div className="dropdown-inner">
                  <div className="scope-column">
                    <button type="button" className={`scope-btn ${scope==='domestic'?'active':''}`} onClick={() => setScope('domestic')}>国内站点</button>
                    <button type="button" className={`scope-btn ${scope==='international'?'active':''}`} onClick={() => setScope('international')}>国际站点</button>
                  </div>
                  <div className="dropdown-main">
                    <div className="dropdown-header">拼音支持首字母输入</div>
                    <div className="dropdown-tabs">
                      {TAB_LABELS.map(label => (
                        <button key={`tab2-${label}`} className={`dropdown-tab ${activeTab===label?'active':''}`} onClick={() => setActiveTab(label)}>{label}</button>
                      ))}
                      <button type="button" className="dropdown-close" aria-label="关闭" onClick={closeDropdown}>×</button>
                    </div>
                    <div className="dropdown-content">
                      <div className="city-grid">
                        {(activeTab==='热门' ? HOT_CITIES : HOT_CITIES).map(city => (
                          <button type="button" key={`to-dd-${city}`} className="city-item" onClick={() => pickCity('to', city)}>{city}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="passengerType"
                value="adult"
                checked={conditions.passengerType === 'adult'}
                onChange={() => handlePassengerTypeChange('adult')}
              />
              普通
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
