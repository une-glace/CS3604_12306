import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import './HomePage.css'
import './ProfilePage.css'
import './OrderPage.css'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

interface DetailPassenger {
  passengerName: string
  idType?: string
  idCard?: string
  ticketType?: string
  seatType?: string
  carriage?: string | number
  seatNumber?: string
  price?: number
}

interface DetailOrder {
  orderId: string
  trainNumber: string
  fromStation: string
  toStation: string
  departureDate: string
  departureTime?: string
  arrivalTime?: string
  status: string
  totalPrice: number
  passengers?: DetailPassenger[]
}

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()
  const [order, setOrder] = useState<DetailOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      const routeDetail = (location.state as { detail?: Partial<DetailOrder> } | null)?.detail
      if (routeDetail && routeDetail.orderId) {
        setOrder({
          orderId: routeDetail.orderId || '',
          trainNumber: routeDetail.trainNumber || '',
          fromStation: routeDetail.fromStation || '',
          toStation: routeDetail.toStation || '',
          departureDate: routeDetail.departureDate || '',
          departureTime: routeDetail.departureTime || '',
          arrivalTime: routeDetail.arrivalTime || '',
          status: routeDetail.status || 'paid',
          totalPrice: routeDetail.totalPrice || 0,
          passengers: Array.isArray(routeDetail.passengers) ? routeDetail.passengers : []
        })
        setLoading(false)
        return
      }
      if (!isLoggedIn) {
        setError('请先登录')
        setLoading(false)
        return
      }
      try {
        const { getOrderDetail } = await import('../services/orderService')
        const data = await getOrderDetail(orderId || '') as unknown

      const getProp = (obj: unknown, key: string): unknown => {
        if (typeof obj === 'object' && obj !== null && key in (obj as Record<string, unknown>)) {
          return (obj as Record<string, unknown>)[key]
        }
        return undefined
      }

      const directOrder = getProp(data, 'order')
      const maybeData = getProp(data, 'data')
      const nestedOrder = getProp(maybeData, 'order')
      const oObj = (nestedOrder ?? directOrder ?? data) as Record<string, unknown>

      const getStr = (obj: Record<string, unknown>, key: string): string => {
        const v = obj[key]
        return v === undefined || v === null ? '' : String(v)
      }
      const getNum = (obj: Record<string, unknown>, key: string, def = 0): number => {
        const v = obj[key]
        return typeof v === 'number' ? v : def
      }
      const getArr = (obj: Record<string, unknown>, key: string): unknown[] => {
        const v = obj[key]
        return Array.isArray(v) ? v : []
      }

      if (!oObj || Object.keys(oObj).length === 0) {
        setError('未找到订单详情')
        setLoading(false)
        return
      }

      const rawPassengers = getArr(oObj, 'passengers')
      const passengers: DetailPassenger[] = rawPassengers.map((pp) => {
        const p = pp as Record<string, unknown>
        return {
          passengerName: String(p.passengerName ?? p.name ?? ''),
          idType: getStr(p as Record<string, unknown>, 'idType'),
          idCard: getStr(p as Record<string, unknown>, 'idCard') || getStr(p as Record<string, unknown>, 'idNumber'),
          ticketType: getStr(p as Record<string, unknown>, 'ticketType'),
          seatType: getStr(p as Record<string, unknown>, 'seatType'),
          carriage: ((): string | number | undefined => {
            const v = p.carriage as unknown
            return v === undefined || v === null ? undefined : (typeof v === 'number' ? v : String(v))
          })(),
          seatNumber: getStr(p as Record<string, unknown>, 'seatNumber') || undefined,
          price: ((): number | undefined => {
            const v = p.price as unknown
            return typeof v === 'number' ? v : undefined
          })()
        }
      })

      setOrder({
        orderId: getStr(oObj, 'orderId'),
        trainNumber: getStr(oObj, 'trainNumber'),
        fromStation: getStr(oObj, 'departure') || getStr(oObj, 'fromStation'),
        toStation: getStr(oObj, 'arrival') || getStr(oObj, 'toStation'),
        departureDate: getStr(oObj, 'date') || getStr(oObj, 'departureDate'),
        departureTime: getStr(oObj, 'departureTime') || undefined,
        arrivalTime: getStr(oObj, 'arrivalTime') || undefined,
        status: getStr(oObj, 'status') || 'paid',
        totalPrice: getNum(oObj, 'totalPrice', getNum(oObj, 'price', 0)),
        passengers
      })
      setLoading(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '获取订单详情失败'
      setError(msg)
      setLoading(false)
    }
    }
    fetchDetail()
  }, [orderId, location.state, isLoggedIn])


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-main">
          <main className="profile-content">
            <div className="content-section">
              <div className="section-header">
                <h2>订单详情</h2>
                <div className="breadcrumb">
                  <span>订单中心</span>
                  <span className="separator">{'>'}</span>
                  <span className="current">订单详情</span>
                </div>
              </div>
              <div className="empty-state">
                <p>{error}</p>
                <button className="detail-btn" onClick={() => navigate('/profile?section=orders')}>返回订单列表</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const firstPassenger = (order?.passengers || [])[0]
  const nameText = firstPassenger?.passengerName || ''
  const idTypeText = (() => {
    const t = firstPassenger?.idType
    if (!t) return '居民身份证'
    const tt = String(t).toLowerCase()
    if (tt === '1' || tt === 'id_card') return '居民身份证'
    if (tt === '2') return '外国人永久居留身份证'
    if (tt === '3') return '港澳台居民居住证'
    return String(t)
  })()

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile')
    } else {
      navigate('/login')
    }
  }
  const handleLoginClick = () => { navigate('/login') }
  const handleRegisterClick = () => { navigate('/register') }
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout()
      window.location.reload()
    }
  }

  return (
    <div className="pay-order-page">
      <header className="header">
        <div className="header-container header-top">
          <div className="brand">
            <img className="brand-logo" src="/铁路12306-512x512.png" alt="中国铁路12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="header-search">
            <input className="search-input" type="text" placeholder="搜索车票、 餐饮、 常旅客、 相关规章" />
            <button className="search-button">Q</button>
          </div>
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

      <Navbar active="tickets" />
      <div className="pay-container">
        {order && (
          <div className="pay-card">
            <div className="pay-card-body">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #c9e8d3',
                background: '#edffed', color: '#2f8f3b', padding: '10px 12px', borderRadius: 0
              }}>
                <div style={{width:28,height:28,background:'#27ae60',color:'#fff',borderRadius: '50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700, fontSize:18}}>✓</div>
                <div style={{ marginLeft: 4 }}>
                  <div>
                    <span style={{ fontSize: 16, color: '#2f8f3b', fontWeight: 400 }}>交易已成功！</span>
                    <span style={{ color: '#000' }}> 感谢您选择铁路出行！您的订单号：</span>
                    <span style={{ color: '#f47621ff' , fontSize:16}}>{order.orderId}</span>
                  </div>
                  <div style={{fontSize:12,color:'#666'}}>{nameText} 可持购票时所使用的{idTypeText}原件于购票后、列车开车前到车站直接检票乘车。</div>
                  <div style={{height:8}} />
                  <div style={{fontWeight:700, color: '#3e3f3fff'}}>消息通知方式进行相关调整，将通过“铁路12306”App客户端为您推送相关消息(需开启接收推送权限)。您也可以扫描关注下方“铁路12306”微信公众号或支付宝生活号二维码，选择通过微信或支付宝接收。</div>
                </div>
              </div>

              <div className="pay-card-header" style={{ marginTop: 12 }}>订单信息</div>
              <div className="pay-info-row" style={{marginTop:12}}>
                <div className="pay-info-date">{order.departureDate}</div>
                <div className="pay-info-train"><span className="pay-train-strong">{order.trainNumber}</span> <span className="train-suffix">次</span></div>
                <div className="pay-info-stations">
                  <span className="station-strong" style = {{fontSize:24, color:'#f42421ff', fontWeight:400}}>{order.fromStation}</span><span className="station-suffix">站</span>
                  <span className="sp">（</span>
                  <span className="depart-strong">{order.departureTime || ''}</span>
                  <span className="sp">开） — </span>
                  <span className="station-strong">{order.toStation}</span><span className="station-suffix">站</span>
                  <span className="arrival-small">（</span>
                  <span className="arrival-small">{order.arrivalTime || ''}</span>
                  <span className="arrival-small">到）</span>
                </div>
              </div>

              <div className="pay-passenger-table detail-passenger-table">
                <div className="pay-table-header">
                  <div>序号</div>
                  <div>姓名</div>
                  <div>证件类型</div>
                  <div>证件号码</div>
                  <div>票种</div>
                  <div>席别</div>
                  <div>车厢</div>
                  <div>席位号</div>
                  <div>票价（元）</div>
                  <div>订单状态</div>
                </div>
                {(order.passengers || []).map((p, idx) => (
                  <div className="pay-table-row" key={idx}>
                    <div>{String(idx + 1).padStart(2, '0')}</div>
                    <div>{p.passengerName || ''}</div>
                    <div>{p.idType || '居民身份证'}</div>
                    <div>{p.idCard || ''}</div>
                    <div>{p.ticketType || '成人票'}</div>
                    <div>{p.seatType || ''}</div>
                    <div>{p.carriage ?? '待分配'}</div>
                    <div>{p.seatNumber ?? '待分配'}</div>
                    <div>{typeof p.price === 'number' ? p.price : order.totalPrice}</div>
                    <div style={{ color: '#f47621' }}>已支付</div>
                  </div>
                ))}
              </div>

              <div className="pay-divider" />
              <div className="pay-action-row">
                <button className="ins-btn" type="button">餐饮•特产</button>
                <button className="ins-btn" type="button" onClick={() => navigate('/train-list')}>继续购票</button>
                <button className="pay-btn" type="button" onClick={() => navigate('/profile?section=orders')}>查看订单详情</button>
              </div>
              <div className="warm-tips">
                <div className="warm-tips-title">温馨提示：</div>
                <ol className="warm-tips-list">
                  <li>如需换票，请尽早携带购票时使用的乘车人有效身份证件到车站、售票窗口、自动售（取）票机、铁路客票代售点办理。</li>
                  <li>请乘车人持购票时使用的有效证件按时乘车。</li>
                  <li>投保后可在“我的12306-我的保险”查看电子保单号（登陆中国铁路保险www.china-ric.com 查看电子保单）。</li>
                  <li>完成微信或支付宝绑定后，购票、改签、退票、购买乘意险、退乘意险的通知消息，将会通过微信或支付宝通知提醒发送给您；手机号码核验、通过手机号码找回密码、列车运行调整的通知仍然通过短信发送给您。</li>
                  <li>未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。</li>
                </ol>
              </div>

              
            </div>
            
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default OrderDetailPage
