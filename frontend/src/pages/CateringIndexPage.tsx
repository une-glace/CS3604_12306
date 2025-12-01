import React from 'react'
import { useNavigate } from 'react-router-dom'
import StationAutocomplete from '../components/StationAutocomplete'
import './CateringIndexPage.css'

const CateringIndexPage: React.FC = () => {
  const navigate = useNavigate()
  const [date, setDate] = React.useState<string>(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  })
  const [train, setTrain] = React.useState('D1')
  const [from, setFrom] = React.useState('上海虹桥')
  const [to, setTo] = React.useState('洛杉矶')

  const onSearch = () => {
    const params = new URLSearchParams({ date, train, from, to })
    navigate(`/catering/list?${params.toString()}`)
  }

  return (
    <div className="catering-index">
      <div className="hero">
        <div className="hero-overlay">
          <div className="hero-title">带有温度的旅途配餐，享受星级的体验，</div>
          <div className="hero-title hero-title-strong">家乡的味道</div>
          <div className="hero-search">
            <div className="search-item date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="search-item">
              <span className="label">车次</span>
              <input type="text" value={train} onChange={(e) => setTrain(e.target.value)} />
            </div>
            <div className="search-item">
              <span className="label">乘站站</span>
              <StationAutocomplete value={from} onChange={setFrom} placeholder="请输入出发站" />
            </div>
            <div className="search-item">
              <span className="label">到达站</span>
              <StationAutocomplete value={to} onChange={setTo} placeholder="请输入到达站" />
            </div>
            <button className="search-btn" onClick={onSearch}>搜索</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CateringIndexPage

