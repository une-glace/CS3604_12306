import React, { useState, useEffect, useRef } from 'react';
import { searchStations } from '../services/stationService';
import type { Station } from '../services/stationService';
import './StationAutocomplete.css';

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // 点击外部关闭建议列表
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val); // 实时更新父组件

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchStations(val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Search failed', error);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        selectStation(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectStation = (station: Station) => {
    setInputValue(station.name);
    onChange(station.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className={`station-autocomplete ${className}`} ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
      />
      {showSuggestions && (
        <div className="autocomplete-dropdown">
          <div className="dropdown-header">按"{inputValue}"检索：</div>
          <ul className="dropdown-list">
            {suggestions.map((station, index) => (
              <li
                key={station.id}
                className={`dropdown-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => selectStation(station)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="station-name">{station.name}</span>
                <span className="station-pinyin">{station.pinyin}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StationAutocomplete;
