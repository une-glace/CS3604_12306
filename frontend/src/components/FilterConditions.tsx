import React, { useMemo, useState } from 'react';
import './FilterConditions.css';

interface FilterConditionsProps {
  onFiltersChange?: (filters: FilterState) => void;
  currentDate: string;
  fromStation?: string;
  toStation?: string;
  availableDepartureStations?: string[];
  availableArrivalStations?: string[];
  onDateSelect?: (date: string) => void;
  hasQuery?: boolean;
}

interface FilterState {
  departureTime: string; // 单选：时间段
  trainTypes: string[];
  departureStations: string[];
  arrivalStations: string[];
  seatTypes: string[];
}

const FilterConditions: React.FC<FilterConditionsProps> = ({
  onFiltersChange,
  currentDate,
  fromStation,
  toStation,
  availableDepartureStations = [],
  availableArrivalStations = [],
  onDateSelect,
  hasQuery = false
}) => {
  const [filters, setFilters] = useState<FilterState>({
    departureTime: '00:00-24:00',
    trainTypes: [],
    departureStations: [],
    arrivalStations: [],
    seatTypes: []
  });

  const next15Days = useMemo(() => {
    const days: { date: string; label: string; weekday: string }[] = [];
    const start = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < 15; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const date = `${yyyy}-${mm}-${dd}`;
      const label = `${mm}-${dd}`;
      const weekday = weekdays[d.getDay()];
      days.push({ date, label, weekday });
    }
    return days;
  }, []);

  const trainTypeOptions = [
    { value: 'GC', label: 'GC-高铁/城际' },
    { value: 'D', label: 'D-动车' },
    { value: 'Z', label: 'Z-直达' },
    { value: 'T', label: 'T-特快' },
    { value: 'K', label: 'K-快速' },
    { value: 'other', label: '其他' },
    { value: 'fuxing', label: '复兴号' },
    { value: 'smart', label: '智能动车组' }
  ];

  const seatTypeOptions = [
    { value: 'business', label: '商务座' },
    { value: 'first_class_premium', label: '优选一等座' },
    { value: 'first_class', label: '一等座' },
    { value: 'second_class', label: '二等座' },
    { value: 'first_sleeper', label: '一等卧' },
    { value: 'second_sleeper', label: '二等卧' },
    { value: 'soft_sleeper', label: '软卧' },
    { value: 'hard_sleeper', label: '硬卧' },
    { value: 'hard_seat', label: '硬座' }
  ];

  const timeRangeOptions = [
    '00:00-24:00',
    '00:00-06:00',
    '06:00-12:00',
    '12:00-18:00',
    '18:00-24:00'
  ];

  const emitChange = (next: Partial<FilterState>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    onFiltersChange?.(merged);
  };

  const [expanded, setExpanded] = useState(true);

  const toggleAllTrainTypes = () => {
    const allValues = trainTypeOptions.map(o => o.value);
    const isAllSelected = filters.trainTypes.length === allValues.length;
    emitChange({ trainTypes: isAllSelected ? [] : allValues });
  };

  const toggleAllDepartureStations = () => {
    const allValues = availableDepartureStations;
    const isAllSelected = filters.departureStations.length === allValues.length;
    emitChange({ departureStations: isAllSelected ? [] : [...allValues] });
  };

  const toggleAllArrivalStations = () => {
    const allValues = availableArrivalStations;
    const isAllSelected = filters.arrivalStations.length === allValues.length;
    emitChange({ arrivalStations: isAllSelected ? [] : [...allValues] });
  };

  const toggleAllSeatTypes = () => {
    const allValues = seatTypeOptions.map(o => o.value);
    const isAllSelected = filters.seatTypes.length === allValues.length;
    emitChange({ seatTypes: isAllSelected ? [] : allValues });
  };

  return (
    <div className="filter-conditions horizontal">
      <div className="date-strip">
        {next15Days.map(d => {
          const isActive = d.date === currentDate;
          return (
            <button
              key={d.date}
              className={`date-item ${isActive ? 'active' : ''}`}
              onClick={() => onDateSelect?.(d.date)}
            >
              <div className="date-label">
                {d.label}
                {isActive && <span className="date-weekday">{d.weekday}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="filter-line">
        <span className="line-label">车次类型:</span>
        <button className="select-all-btn" onClick={toggleAllTrainTypes}>全部</button>
        <div className="line-options">
          {trainTypeOptions.map(opt => (
            <label key={opt.value} className="line-option">
              <input
                type="checkbox"
                checked={filters.trainTypes.includes(opt.value)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const cur = new Set(filters.trainTypes);
                  if (checked) {
                    cur.add(opt.value);
                  } else {
                    cur.delete(opt.value);
                  }
                  emitChange({ trainTypes: Array.from(cur) });
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="time-range in-line">
          <label className="time-label">发车时间:</label>
          <select
            className="time-select"
            value={filters.departureTime}
            onChange={(e) => emitChange({ departureTime: e.target.value })}
          >
            {timeRangeOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {!!fromStation && availableDepartureStations.length > 0 && (
        <div className="filter-line">
          <span className="line-label">出发车站:</span>
          <button className="select-all-btn" onClick={toggleAllDepartureStations}>全部</button>
          <div className="line-options">
            {availableDepartureStations.map(s => (
              <label key={s} className="line-option">
                <input
                  type="checkbox"
                  checked={filters.departureStations.includes(s)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const cur = new Set(filters.departureStations);
                    if (checked) {
                      cur.add(s);
                    } else {
                      cur.delete(s);
                    }
                    emitChange({ departureStations: Array.from(cur) });
                  }}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {expanded && !!toStation && availableArrivalStations.length > 0 && (
        <div className="filter-line">
          <span className="line-label">到达车站:</span>
          <button className="select-all-btn" onClick={toggleAllArrivalStations}>全部</button>
          <div className="line-options">
            {availableArrivalStations.map(s => (
              <label key={s} className="line-option">
                <input
                  type="checkbox"
                  checked={filters.arrivalStations.includes(s)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const cur = new Set(filters.arrivalStations);
                    if (checked) {
                      cur.add(s);
                    } else {
                      cur.delete(s);
                    }
                    emitChange({ arrivalStations: Array.from(cur) });
                  }}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="filter-line">
          <span className="line-label">车次席别:</span>
          <button className="select-all-btn" onClick={toggleAllSeatTypes}>全部</button>
          <div className="line-options">
            {hasQuery && seatTypeOptions.map(opt => (
              <label key={opt.value} className="line-option">
                <input
                  type="checkbox"
                  checked={filters.seatTypes.includes(opt.value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const cur = new Set(filters.seatTypes);
                    if (checked) {
                      cur.add(opt.value);
                    } else {
                      cur.delete(opt.value);
                    }
                    emitChange({ seatTypes: Array.from(cur) });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filter-toggle-row">
        <button className="toggle-filter-btn" onClick={() => setExpanded(!expanded)}>
          筛选 {expanded ? '▴' : '▾'}
        </button>
      </div>
    </div>
  );
};

export default FilterConditions;
