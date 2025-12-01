import React from 'react'
import { useLocation } from 'react-router-dom'
import StationAutocomplete from '../components/StationAutocomplete'
import './CateringListPage.css'

const useQuery = () => new URLSearchParams(useLocation().search)

interface Store {
  id: number
  name: string
  image: string
  minPrice: number
  shippingFee: number
  startTime: string
  endTime: string
  tags?: string[]
}

interface StationCatering {
  stationName: string
  arriveTime?: string
  stores: Store[]
}

interface SelfOperatedItem {
  id: number
  name: string
  image: string
  price: number
}

const CateringListPage: React.FC = () => {
  const query = useQuery()
  const [date, setDate] = React.useState(query.get('date') || '')
  const [train, setTrain] = React.useState(query.get('train') || '')
  const [from, setFrom] = React.useState(query.get('from') || '')
  const [to, setTo] = React.useState(query.get('to') || '')
  const [selectedStation, setSelectedStation] = React.useState('全部')

  // 模拟数据
  const selfOperatedGoods: SelfOperatedItem[] = [
    { id: 1, name: '青岛啤酒鸿运当头', image: '/homepage/service/abanner01.jpg', price: 20.00 },
    { id: 2, name: '杏鲍菇烧牛肉套餐', image: '/homepage/service/abanner02.jpg', price: 68.00 },
    { id: 3, name: '依云矿泉水', image: '/homepage/service/abanner03.jpg', price: 13.00 },
  ]

  const stationCateringList: StationCatering[] = [
    {
      stationName: '上海虹桥',
      arriveTime: '12-02 15:00开',
      stores: [
        { id: 1, name: '永和大王 (上海虹桥站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: [] },
        { id: 2, name: '老娘舅 (上海虹桥站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: ['米饭套餐'] },
        { id: 3, name: '麦当劳 (上海虹桥站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: [] },
        { id: 4, name: '康师傅 (上海虹桥店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: ['牛肉面'] },
        { id: 5, name: '德克士 (上海虹桥店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: ['炸鸡汉堡'] },
        { id: 6, name: '真功夫 (上海虹桥站)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 14:00截止下单', tags: [] },
      ]
    },
    {
      stationName: '南京南',
      arriveTime: '12-02 16:01开',
      stores: [
        { id: 11, name: '如意菜饭 (南京南站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 15:01截止下单', tags: ['畅销17年'] },
        { id: 12, name: '谷稻云 (南京南站)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-18起售', endTime: '12-02 15:01截止下单', tags: ['米饭套餐'] },
        { id: 13, name: '回味鸭血粉丝 (南京南站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 15:01截止下单', tags: [] },
        { id: 14, name: '肯德基 (南京南站南广场站内三店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-18起售', endTime: '12-02 14:31截止下单', tags: ['咖啡2杯85折'] },
        { id: 15, name: '桂花鸭 (南京南站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 15:01截止下单', tags: [] },
      ]
    },
    {
      stationName: '济南西',
      arriveTime: '12-02 18:03开',
      stores: [
        { id: 21, name: '杨国福麻辣烫 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 17:03截止下单', tags: [] },
        { id: 22, name: '李先生牛肉面 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 17:03截止下单', tags: ['面条·米饭套餐'] },
        { id: 23, name: '书亦烧仙草 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-18起售', endTime: '12-02 17:03截止下单', tags: [] },
        { id: 24, name: '双黄蛋煎饼 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-18起售', endTime: '12-02 17:03截止下单', tags: ['经典蛋香'] },
        { id: 25, name: '汉堡王 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-03起售', endTime: '12-02 17:03截止下单', tags: [] },
        { id: 26, name: '周黑鸭 (济南西站店)', image: '/logo-12306.svg', minPrice: 0, shippingFee: 8, startTime: '11-18起售', endTime: '12-02 17:03截止下单', tags: ['中国卤味周黑鸭'] },
      ]
    }
  ]

  const filteredList = selectedStation === '全部'
    ? stationCateringList
    : stationCateringList.filter(s => s.stationName === selectedStation)

  return (
    <div className="catering-list">
      <div className="filter-card">
        <div className="row">
          <div className="field date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <span className="label">车次</span>
            <input type="text" value={train} onChange={(e) => setTrain(e.target.value)} />
          </div>
          <div className="field">
            <span className="label">乘站站</span>
            <StationAutocomplete value={from} onChange={setFrom} />
          </div>
          <div className="field">
            <span className="label">到达站</span>
            <StationAutocomplete value={to} onChange={setTo} />
          </div>
          <button className="search-btn">查询</button>
        </div>
        <div className="options">
          <span>配送站：</span>
          <span
            className={`chip ${selectedStation === '全部' ? 'active' : ''}`}
            onClick={() => setSelectedStation('全部')}
          >全部</span>
          {stationCateringList.map(s => (
            <span
              key={s.stationName}
              className={`chip ${selectedStation === s.stationName ? 'active' : ''}`}
              onClick={() => setSelectedStation(s.stationName)}
            >
              <input type="checkbox" checked={selectedStation === s.stationName} readOnly style={{ marginRight: 4 }} />
              {s.stationName}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
            <input type="checkbox" style={{ marginRight: 4 }} /> 显示可预订商家
          </label>
        </div>
      </div>

      {/* 列车自营商品 */}
      <div className="section-title">
        <span className="icon-train">🚆</span> 列车自营商品
      </div>
      <div className="self-operated-grid">
        {selfOperatedGoods.map(item => (
          <div key={item.id} className="self-operated-card">
            <img src={item.image} alt={item.name} />
            <div className="info">
              <div className="name">{item.name}</div>
              <div className="price">¥{item.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 站点餐饮列表 */}
      {filteredList.map(station => (
        <div key={station.stationName} className="station-section">
          <div className="station-header">
            <span className="icon-station">🚉</span>
            <span className="station-name">{station.stationName}</span>
            <span className="station-time">({station.arriveTime})</span>
          </div>
          <div className="store-grid">
            {station.stores.map(store => (
              <div key={store.id} className="store-card">
                <div className="store-content">
                  <img src={store.image} alt={store.name} className="store-logo" />
                  <div className="store-info">
                    <div className="store-name">{store.name}</div>
                    <div className="store-meta">
                      起送：¥{store.minPrice.toFixed(2)} | 配送费：¥{store.shippingFee.toFixed(2)}
                    </div>
                    {store.tags && store.tags.length > 0 && (
                      <div className="store-tags">
                        {store.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="store-footer">
                  <span className="start-time">{store.startTime}</span>
                  <span className="end-time">{store.endTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CateringListPage
