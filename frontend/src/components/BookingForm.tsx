import React, { useState } from 'react'
import './BookingForm.css'

interface BookingFormProps {
  onSearch?: (searchData: BookingData) => void
}

interface BookingData {
  from: string
  to: string
  date: string
}

const BookingForm: React.FC<BookingFormProps> = ({ onSearch }) => {
  const [formData, setFormData] = useState<BookingData>({
    from: '',
    to: '',
    date: ''
  })

  // 常用城市列表
  const popularCities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', 
    '武汉', '成都', '西安', '重庆', '天津', '苏州'
  ]

  // 已移除“车次类型”选择，仅保留基础查询字段

  // 获取今天的日期字符串
  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // 获取30天后的日期字符串
  const getMaxDateString = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  // 处理表单输入变化
  const handleInputChange = (field: keyof BookingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 交换出发地和目的地
  const swapStations = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }))
  }

  // 处理搜索
  const handleSearch = () => {
    if (!formData.from || !formData.to || !formData.date) {
      alert('请填写完整的出行信息')
      return
    }

    if (formData.from === formData.to) {
      alert('出发地和目的地不能相同')
      return
    }

    onSearch?.(formData)
  }

  return (
    <div className="booking-form">
      <div className="form-header">
        <h3>车票预订</h3>
      </div>
      
      <div className="form-content">
        {/* 出发地和目的地 */}
        <div className="station-group">
          <div className="station-input-group">
            <label htmlFor="from-station">出发地</label>
            <input
              id="from-station"
              type="text"
              placeholder="请输入出发城市"
              value={formData.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              list="cities-list"
            />
          </div>
          
          <button 
            className="swap-button" 
            onClick={swapStations}
            title="交换出发地和目的地"
          >
            ⇄
          </button>
          
          <div className="station-input-group">
            <label htmlFor="to-station">目的地</label>
            <input
              id="to-station"
              type="text"
              placeholder="请输入到达城市"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              list="cities-list"
            />
          </div>
        </div>

        {/* 出发日期 */}
        <div className="date-group">
          <label htmlFor="departure-date">出发日期</label>
          <input
            id="departure-date"
            type="date"
            value={formData.date}
            min={getTodayString()}
            max={getMaxDateString()}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>

        {/* 搜索按钮 */}
        <button className="search-button" onClick={handleSearch}>
          查 询
        </button>
      </div>

      {/* 常用城市数据列表 */}
      <datalist id="cities-list">
        {popularCities.map(city => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  )
}

export default BookingForm