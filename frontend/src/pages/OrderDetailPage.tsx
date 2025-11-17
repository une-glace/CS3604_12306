import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './HomePage.css'
import './ProfilePage.css'

interface DetailPassenger {
  passengerName: string
  seatType?: string
  seatNumber?: string
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
  const navigate = useNavigate()
  const [order, setOrder] = useState<DetailOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const { getOrderDetail } = await import('../services/orderService')
        const data = await getOrderDetail(orderId || '')
        const o = (data as any)?.order || (data as any)?.data?.order || data
        if (!o) {
          setError('未找到订单详情')
          setLoading(false)
          return
        }
        setOrder({
          orderId: o.orderId || '',
          trainNumber: o.trainNumber,
          fromStation: o.fromStation,
          toStation: o.toStation,
          departureDate: o.departureDate,
          departureTime: o.departureTime,
          arrivalTime: o.arrivalTime,
          status: o.status,
          totalPrice: o.totalPrice,
          passengers: Array.isArray(o.passengers)
            ? o.passengers.map((p: any) => ({
                passengerName: p.passengerName,
                seatType: p.seatType,
                seatNumber: p.seatNumber,
              }))
            : [],
        })
        setLoading(false)
      } catch (e: any) {
        setError(e?.message || '获取订单详情失败')
        setLoading(false)
      }
    }
    fetchDetail()
  }, [orderId])

  const formatPassengers = (list: DetailPassenger[]) => {
    if (!list || list.length === 0) return '—'
    return list
      .map(p => `${p.passengerName} ${p.seatType || ''} ${p.seatNumber || '待分配'}`.trim())
      .join('；')
  }

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

            {order && (
              <div className="orders-section">
                <div className="order-card">
                  <div className="order-header">
                    <span className="order-number">订单号：{order.orderId}</span>
                    <span className={`order-status ${order.status}`}>{
                      order.status === 'paid' ? '已支付' :
                      order.status === 'unpaid' ? '未支付' :
                      order.status === 'completed' ? '已出行' :
                      order.status === 'cancelled' ? '已取消' :
                      order.status === 'refunded' ? '已退票' : order.status
                    }</span>
                  </div>
                  <div className="order-content">
                    <div className="train-info">
                      <h4>{order.trainNumber}</h4>
                      <p>{order.fromStation} → {order.toStation}</p>
                      <p>{order.departureDate} {order.departureTime || ''} - {order.arrivalTime || ''}</p>
                    </div>
                    <div className="passenger-info">
                      <p>乘车人与座位：{formatPassengers(order.passengers || [])}</p>
                    </div>
                    <div className="price-info">
                      <p className="price">¥{order.totalPrice}</p>
                    </div>
                  </div>
                  <div className="order-actions">
                    <button className="detail-btn" onClick={() => navigate('/profile?section=orders')}>返回订单列表</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default OrderDetailPage