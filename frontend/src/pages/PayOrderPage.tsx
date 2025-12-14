import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import { getOrderDetail, cancelOrder, getUserOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import './HomePage.css';
import './OrderPage.css';

type TrainInfo = { trainNumber: string; from: string; to: string; departureTime: string; arrivalTime: string; date: string };
type Passenger = { id: string; name?: string; idType?: string; idCard?: string };
type TicketInfo = { passengerId: string; ticketType: string; seatType: string; price: number };
type RouteState = { backendOrderId?: string; orderId?: string; trainInfo?: TrainInfo; passengers?: Passenger[]; ticketInfos?: TicketInfo[]; totalPrice?: number; assignedSeats?: Array<{ passengerId: string; carriage: string | number; seatNumber: string }>; isChangeMode?: boolean };
type OrderPassenger = { name?: string; idType: string; idCard: string; ticketType: string; seatType: string; carriage?: string | number; seatNumber?: string; price: number };
type OrderDetail = { id: string; orderNumber: string; trainNumber: string; departure: string; arrival: string; departureTime: string; arrivalTime: string; date: string; price: number; passengers: OrderPassenger[]; status?: string };
type RawPassenger = { passengerName?: string; name?: string; idType?: string; idCard?: string; idNumber?: string; ticketType?: string; seatType?: string; seatNumber?: string; carriage?: string | number; price?: number };
type RawOrder = { id?: string; orderId?: string; trainNumber?: string; fromStation?: string; toStation?: string; departureStation?: string; arrivalStation?: string; departureTime?: string; arrivalTime?: string; departureDate?: string; date?: string; totalPrice?: number; price?: number; passengers?: RawPassenger[]; status?: string };

const PayOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId') || '';
  const routeState = location.state as RouteState | null;

  const buildFallbackDetail = (): OrderDetail | null => {
    try {
      if (!routeState) return null;
      const t = routeState.trainInfo || {} as TrainInfo;
      const passengers: OrderPassenger[] = (routeState.ticketInfos || []).map((ti: TicketInfo) => {
        const p = (routeState.passengers || []).find((pp: Passenger) => pp.id === ti.passengerId);
        const s = (routeState.assignedSeats || []).find((as) => as.passengerId === ti.passengerId);
        return {
          name: p?.name || '',
          idType: p?.idType ? (p.idType === '1' ? '居民身份证' : (p.idType === '2' ? '外国人永久居留身份证' : (p.idType === '3' ? '港澳台居民居住证' : p.idType))) : '居民身份证',
          idCard: p?.idCard || '',
          ticketType: ti.ticketType,
          seatType: ti.seatType,
          carriage: s?.carriage,
          seatNumber: s?.seatNumber,
          price: ti.price
        };
      });
      return {
        id: routeState.backendOrderId || routeState.orderId || '',
        orderNumber: routeState.orderId || '',
        trainNumber: t.trainNumber,
        departure: t.from,
        arrival: t.to,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        date: t.date,
        price: routeState.totalPrice ?? 0,
        passengers,
        status: 'unpaid'
      };
    } catch {
      return null;
    }
  };

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(buildFallbackDetail());
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const initialMs = useMemo(() => 20 * 60 * 1000, []);
  const [remainMs, setRemainMs] = useState<number>(initialMs);

  useEffect(() => {
    setRemainMs(initialMs);
    const timer = window.setInterval(() => {
      setRemainMs(prev => {
        const next = Math.max(0, prev - 1000);
        return next;
      });
    }, 1000);
    return () => { clearInterval(timer); };
  }, [initialMs]);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      try {
        let raw: RawOrder | null = null;
        if (isLoggedIn) {
          try {
            raw = await getOrderDetail(orderId) as unknown as RawOrder;
          } catch (err) {
            console.warn('按后台ID获取详情失败', err);
          }
          if (!raw && routeState?.orderId) {
            try { raw = await getOrderDetail(routeState.orderId) as unknown as RawOrder; } catch (err2) {
              console.warn('按订单号获取详情失败', err2);
            }
          }
        }
        if (!raw) {
          // 后端详情不可用时，尝试通过订单列表获取概要信息
          if (isLoggedIn) {
            try {
              const list = await getUserOrders(1, 50, 'unpaid');
              const found = (list.orders || []).find((o: Order) => String(o.id) === String(orderId));
              if (found) {
                const f = found as unknown as Record<string, unknown>;
                raw = {
                  id: String(f.id as string | number),
                  orderId: String((f.orderId ?? f.orderNumber ?? '')),
                  trainNumber: f.trainNumber as string,
                  fromStation: ((f.fromStation ?? f.departure) as string),
                  toStation: ((f.toStation ?? f.arrival) as string),
                  departureTime: f.departureTime as string,
                  arrivalTime: f.arrivalTime as string,
                  departureDate: ((f.departureDate ?? f.date) as string),
                  price: ((f.totalPrice ?? f.price) as number),
                  status: f.status as string,
                  passengers: Array.isArray(f.passengers) ? (f.passengers as Record<string, unknown>[]).map((p) => ({
                    passengerName: (p.passengerName ?? p.name) as string,
                    idType: p.idType as string,
                    idCard: ((p.idCard ?? p.idNumber) as string),
                    ticketType: p.ticketType as string,
                    seatType: p.seatType as string,
                    carriage: (p.carriage as string | number | undefined),
                    seatNumber: (p.seatNumber as string | undefined),
                    price: (p.price as number | undefined)
                  })) : []
                } as RawOrder;
              }
            } catch (err3) {
              console.warn('通过列表获取订单概要失败', err3);
            }
          }
        }
        if (!raw) throw new Error('订单不存在');
        const normalizeSeat = (carriage: unknown, seat: unknown): { carriage?: string | number; seatNumber?: string } => {
          if (carriage !== undefined && carriage !== null && String(carriage).trim() !== '') {
            return { carriage: carriage as string | number, seatNumber: seat ? String(seat) : undefined };
          }
          const s = typeof seat === 'string' ? seat.trim() : '';
          if (s) {
            const m = s.match(/^(\d{1,2})\D*(\S+)$/);
            if (m) return { carriage: m[1], seatNumber: m[2] };
            return { seatNumber: s };
          }
          return {};
        };

        const normalized: OrderDetail = {
          id: raw?.id || raw?.orderId || '',
          orderNumber: raw?.orderId || '',
          trainNumber: raw?.trainNumber || '',
          departure: raw?.fromStation || raw?.departureStation || '',
          arrival: raw?.toStation || raw?.arrivalStation || '',
          departureTime: raw?.departureTime || '',
          arrivalTime: raw?.arrivalTime || '',
          date: raw?.departureDate || raw?.date || '',
          price: typeof raw?.totalPrice === 'number' ? raw.totalPrice : (typeof raw?.price === 'number' ? raw.price : 0),
          status: raw?.status,
          passengers: Array.isArray(raw?.passengers) ? raw.passengers.map((p: RawPassenger) => {
            const seat = normalizeSeat(p?.carriage, p?.seatNumber);
            const routePassenger = routeState?.passengers?.find(rp => (rp.name || '').trim() === (p.passengerName || p.name || '').trim());
            return {
              name: p?.passengerName || p?.name || '',
              idType: p?.idType ? (p.idType === '1' ? '居民身份证' : (String(p.idType) === '2' ? '外国人永久居留身份证' : (String(p.idType) === '3' ? '港澳台居民居住证' : String(p.idType)))) : '居民身份证',
              idCard: routePassenger?.idCard || p?.idCard || p?.idNumber || '',
              ticketType: p?.ticketType || '成人票',
              seatType: p?.seatType || '',
              carriage: seat.carriage,
              seatNumber: seat.seatNumber,
              price: typeof p?.price === 'number' ? p.price : (typeof raw?.price === 'number' ? raw.price : (typeof raw?.totalPrice === 'number' ? raw.totalPrice : 0))
            } as OrderPassenger;
          }) : (orderDetail?.passengers || [])
        };

        // 使用本地座位映射进行统一回填，避免不同来源造成座位不一致
        try {
          const keyByBackend = `orderSeatAssignments:${normalized.id || orderId}`;
          const keyByNumber = normalized.orderNumber ? `orderSeatAssignments:${normalized.orderNumber}` : undefined;
          const v = localStorage.getItem(keyByBackend) || (keyByNumber ? localStorage.getItem(keyByNumber) : null);
          if (v) {
            const parsed = JSON.parse(v) as { passengers?: Array<{ name?: string; seatNumber?: string; carriage?: string | number; seatType?: string }> };
            const lp = Array.isArray(parsed?.passengers) ? parsed.passengers : [];
            if (lp.length > 0) {
              const merged: OrderPassenger[] = (normalized.passengers || []).map((p) => {
                const matchByName = lp.find((m) => (m.name || '').trim() === (p.name || '').trim());
                const use = matchByName || lp[0];
                return {
                  ...p,
                  carriage: use?.carriage ?? p.carriage,
                  seatNumber: use?.seatNumber ?? p.seatNumber,
                  seatType: use?.seatType ?? p.seatType
                };
              });
              normalized.passengers = merged;
            }
          }
        } catch (errMerge) {
          console.warn('合并本地座位映射失败', errMerge);
        }
        setOrderDetail(normalized);
      } catch (e) {
        // 后端无该订单时，使用路由状态作为回退数据，避免报错空白
        let fallback = buildFallbackDetail();
        // 尝试从本地座位映射回填乘客座位
        try {
          const keyByBackend = `orderSeatAssignments:${orderId}`;
          const keyByNumber = routeState?.orderId ? `orderSeatAssignments:${routeState.orderId}` : undefined;
          const v = localStorage.getItem(keyByBackend) || (keyByNumber ? localStorage.getItem(keyByNumber) : null);
          if (v) {
            const parsed = JSON.parse(v) as { orderNumber?: string; passengers?: Array<{ name?: string; seatNumber?: string; carriage?: string | number; seatType?: string }> };
            const lp = Array.isArray(parsed?.passengers) ? parsed.passengers : [];
            if (lp.length > 0) {
              const t = routeState?.trainInfo || {} as TrainInfo;
              fallback = {
                id: routeState?.backendOrderId || orderId,
                orderNumber: routeState?.orderId || parsed?.orderNumber || '',
                trainNumber: t.trainNumber || '',
                departure: t.from || '',
                arrival: t.to || '',
                departureTime: t.departureTime || '',
                arrivalTime: t.arrivalTime || '',
                date: t.date || '',
                price: routeState?.totalPrice ?? 0,
                status: 'unpaid',
                passengers: lp.map((p) => {
                  const rp = (routeState?.passengers || []).find(pp => (pp.name || '').trim() === (p.name || '').trim());
                  const idTypeLabel = rp?.idType ? (rp.idType === '1' ? '居民身份证' : (rp.idType === '2' ? '外国人永久居留身份证' : (rp.idType === '3' ? '港澳台居民居住证' : rp.idType))) : '居民身份证';
                  return {
                    name: p.name || '',
                    idType: idTypeLabel,
                    idCard: rp?.idCard || '',
                    ticketType: p.seatType || '成人票',
                    seatType: p.seatType || '',
                    carriage: p.carriage,
                    seatNumber: p.seatNumber,
                    price: routeState?.totalPrice ?? 0
                  };
                })
              };
            }
          }
        } catch (err4) {
          console.warn('本地座位映射构建回退失败', err4);
        }
        if (fallback) {
          setOrderDetail(fallback);
        }
        console.warn('获取订单详情失败，已使用前端回退数据', e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isLoggedIn]);

  useEffect(() => {
    if (!orderDetail) return;
    try {
      const seatPassengers = (orderDetail.passengers || []).map(p => ({
        name: p.name || '',
        seatNumber: p.seatNumber,
        carriage: p.carriage,
        seatType: p.seatType
      }));
      const valid = seatPassengers.filter(sp => sp.carriage !== undefined && sp.seatNumber !== undefined);
      if (valid.length > 0) {
        const payload = { orderNumber: orderDetail.orderNumber, passengers: valid };
        const keyByBackend = `orderSeatAssignments:${orderDetail.id || orderId}`;
        const keyByNumber = `orderSeatAssignments:${orderDetail.orderNumber || ''}`;
        const existingBackend = localStorage.getItem(keyByBackend);
        const existingNumber = orderDetail.orderNumber ? localStorage.getItem(keyByNumber) : null;
        const needUpdateBackend = (() => {
          if (!existingBackend) return true;
          try {
            const parsed = JSON.parse(existingBackend);
            if (!parsed || !parsed.passengers || parsed.passengers.length === 0) return true;
            if (parsed.orderNumber !== payload.orderNumber) return true;
          } catch { return true; }
          return false;
        })();
        const needUpdateNumber = (() => {
          if (!orderDetail.orderNumber) return false;
          if (!existingNumber) return true;
          try {
            const parsed = JSON.parse(existingNumber);
            if (!parsed || !parsed.passengers || parsed.passengers.length === 0) return true;
            if (parsed.orderNumber !== payload.orderNumber) return true;
          } catch { return true; }
          return false;
        })();
        if (needUpdateBackend) localStorage.setItem(keyByBackend, JSON.stringify(payload));
        if (needUpdateNumber) localStorage.setItem(keyByNumber, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('座位映射写入失败', e);
    }
  }, [orderDetail, orderId]);

  const mm = String(Math.floor(remainMs / 1000 / 60)).padStart(2, '0');
  const ss = String(Math.floor((remainMs / 1000) % 60)).padStart(2, '0');

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };
  const handleLoginClick = () => { navigate('/login'); };
  const handleRegisterClick = () => { navigate('/register'); };
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      window.location.reload();
    }
  };

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
        <div className="pay-banner">
          <div className="banner-icon" aria-hidden>🔒</div>
          <div className="banner-text">席位已锁定，请在提示时间内尽快完成支付，完成购票。支付剩余时间：<span className="countdown"><span className="count-mm">{mm}</span>分<span className="count-ss">{ss}</span>秒</span></div>
        </div>

        <div className="pay-card">
          <div className="pay-card-header">订单信息</div>
          <div className="pay-card-body">
            <div className="pay-info-row">
              <div className="pay-info-date">{orderDetail?.date}</div>
              <div className="pay-info-train"><span className="pay-train-strong">{orderDetail?.trainNumber}</span> <span className="train-suffix">次</span></div>
              <div className="pay-info-stations">
                <span className="station-strong">{orderDetail?.departure}</span><span className="station-suffix">站</span>
                <span className="sp">（</span>
                <span className="depart-strong">{orderDetail?.departureTime}</span>
                <span className="sp">开） — </span>
                <span className="station-strong">{orderDetail?.arrival}</span><span className="station-suffix">站</span>
                <span className="arrival-small">（</span>
                <span className="arrival-small">{orderDetail?.arrivalTime}</span>
                <span className="arrival-small">到）</span>
              </div>
            </div>

            <div className="pay-passenger-table">
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
              </div>
              {(orderDetail?.passengers || []).map((p: OrderPassenger, idx: number) => (
                <div className="pay-table-row" key={idx}>
                  <div>{String(idx + 1).padStart(2, '0')}</div>
                  <div>{p.name || ''}</div>
                  <div>{p.idType || '居民身份证'}</div>
                  <div>{p.idCard || ''}</div>
                  <div>{p.ticketType || '成人票'}</div>
                  <div>{p.seatType || ''}</div>
                  <div>{p.carriage ?? '待分配'}</div>
                  <div>{p.seatNumber ?? '待分配'}</div>
                  <div>{p.price || orderDetail?.price || 0}</div>
                </div>
              ))}
            </div>

            <div className="pay-insurance">
              <div className="ins-text">添加铁路乘意险（最高赔付额度可选）</div>
              <button className="ins-btn" type="button">添加保险</button>
            </div>
          </div>

          <div className="pay-card-footer">
            <div className="pay-total-row"><span className="pay-total-label">总票价：</span><span className="total-val">¥{orderDetail?.price || 0}</span></div>
            <div className="pay-divider" />
            <div className="pay-action-row">
              <button className="cancel-btn" type="button" onClick={async () => {
                try {
                  const backendId = orderDetail?.id || routeState?.backendOrderId || '';
                  if (!backendId) { alert('未找到订单编号'); return; }
                  await cancelOrder(backendId);
                  alert('订单已取消');
                  navigate('/profile?section=orders');
                } catch (e) {
                  console.error('取消订单失败:', e);
                  alert('取消订单失败，请稍后重试');
                }
              }}>取消订单</button>
              <button className="pay-btn" type="button" onClick={() => setIsPaymentOpen(true)}>网上支付</button>
            </div>
            <div className="warm-tips">
              <div className="warm-tips-title">温馨提示：</div>
              <ol className="warm-tips-list">
                <li>请在指定时间内完成网上支付。</li>
                <li>逾期未支付，系统将取消本次交易。</li>
                <li>在完成支付或取消本订单之前，您将无法购买其他车票。</li>
                <li>退票费核收详见 <a href="#" className="link">退改说明</a>。</li>
                <li>购买铁路乘意险保障您的出行安全，提供意外伤害身故伤残、意外伤害医疗费用、意外伤害住院津贴、突发急性病身故保障，同时保障您和随行被监护人因疏忽或过失造成第三者人身伤亡和财产损失依法应由您承担的直接经济赔偿责任，详见保险条款。</li>
                <li>请充分理解保险责任、责任免除、保险期间、合同解除等约定，详见保险条款。电子保单查询或下载请登录 <a href="http://www.china-ric.com" target="_blank" rel="noreferrer" className="link">www.china-ric.com</a>。查看电子保单或下载电子发票。</li>
                <li>如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。</li>
                <li>跨境旅客旅行须知详见铁路跨境旅客相关运输组织规则和车站公告。</li>
                <li>未尽事宜详见《国铁集团铁路旅客运输规程》等有关规定和车站公告。</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={useCallback(() => {
          const id = orderDetail?.id || routeState?.backendOrderId || orderId || '';
          
          // 检查订单状态
          if (orderDetail && ['cancelled', 'refunded', 'changed'].includes(orderDetail.status || '')) {
            alert(`订单状态为 ${orderDetail.status === 'changed' ? '已改签' : (orderDetail.status === 'refunded' ? '已退款' : '已取消')}，无法支付`);
            return;
          }

          (async () => {
            try {
              const { updateOrderStatus } = await import('../services/orderService');
              await updateOrderStatus(String(id), 'paid', 'alipay');
              
              const detail = {
                orderId: (orderDetail?.orderNumber || '') || id,
                trainNumber: orderDetail?.trainNumber || '',
                fromStation: orderDetail?.departure || '',
                toStation: orderDetail?.arrival || '',
                departureDate: orderDetail?.date || '',
                departureTime: orderDetail?.departureTime || '',
                arrivalTime: orderDetail?.arrivalTime || '',
                status: 'paid',
                totalPrice: orderDetail?.price || 0,
                passengers: (orderDetail?.passengers || []).map(p => ({
                  passengerName: p.name || '',
                  idType: p.idType,
                  idCard: p.idCard,
                  ticketType: p.ticketType,
                  seatType: p.seatType,
                  carriage: p.carriage,
                  seatNumber: p.seatNumber,
                  price: p.price
                }))
              };
              navigate(`/order-detail/${encodeURIComponent(id)}`, { state: { detail, isChangeSuccess: !!routeState?.isChangeMode } });
            } catch (e) {
              console.warn('支付后更新订单状态失败', e);
              let msg = '未知错误';
              if (e instanceof Error) {
                msg = e.message;
              } else if (typeof e === 'object' && e !== null && 'response' in e) {
                const resp = (e as { response?: { data?: { message?: string } } }).response;
                msg = resp?.data?.message ?? msg;
              }
              alert(`支付失败：${msg}`);
            }
          })();
        }, [navigate, orderDetail, routeState, orderId])}
        orderData={{
          orderId: orderId || orderDetail?.id || routeState?.backendOrderId || routeState?.orderId || '',
          totalPrice: orderDetail?.price || 0,
          trainNumber: orderDetail?.trainNumber || '',
          fromStation: orderDetail?.departure || '',
          toStation: orderDetail?.arrival || '',
          departureDate: orderDetail?.date || '',
          passengerCount: (orderDetail?.passengers || []).length || 1
        }}
      />

      <Footer />
    </div>
  );
};

export default PayOrderPage;
