import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddPassengerModal from '../components/AddPassengerModal';
import { getPassengers as apiGetPassengers, addPassenger as apiAddPassenger, updatePassenger as apiUpdatePassenger, deletePassenger as apiDeletePassenger, type PassengerFormData } from '../services/passengerService';
import PaymentModal from '../components/PaymentModal';
import './ProfilePage.css';
import './HomePage.css';
import Navbar from '../components/Navbar';

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
  idType?: string;
  isDefault?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  trainNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  bookDate?: string;
  tripDate?: string;
  passenger: string;
  seat: string;
  passengers?: Array<{ name: string; seatNumber?: string; seatType?: string; carriage?: string | number }>;
  price: number;
  status: 'paid' | 'unpaid' | 'cancelled' | 'refunded' | 'completed';
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, isLoading, refreshUser, setUserLocal } = useAuth();
  const [urlSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('center-home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [orderFilter, setOrderFilter] = useState('unpaid');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateMode, setDateMode] = useState<'book' | 'trip'>('book');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  // 搜索与批量选择
  const [searchInput, setSearchInput] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);
  
  // 乘客数据 - 必须在所有条件渲染之前声明
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  
  // 订单数据 - 必须在所有条件渲染之前声明
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOrderData, setPaymentOrderData] = useState<{ orderId: string; totalPrice: number; trainNumber: string; fromStation: string; toStation: string; departureDate: string; passengerCount: number } | null>(null);
  const [paymentOrderBackendId, setPaymentOrderBackendId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<{ orders: boolean; personal: boolean; common: boolean }>({ orders: true, personal: true, common: true });
  
  // ===== 编辑按钮占位处理（保留现有跳转关系） =====
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [countryCodeInput, setCountryCodeInput] = useState('+86');

  // 检查登录状态
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      const hasToken = !!localStorage.getItem('authToken');
      if (hasToken || import.meta.env.VITE_E2E === 'true') {
        return;
      }
      navigate('/login');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // 根据URL参数预设当前分区（如 ?section=orders）
  useEffect(() => {
    const section = urlSearchParams.get('section');
    if (section === 'orders') {
      setActiveSection('orders');
    } else if (section === 'passengers') {
      setActiveSection('passengers');
    } else if (section === 'personal-info') {
      setActiveSection('personal-info');
    }
  }, [urlSearchParams]);

  // 获取乘车人数据 - 必须在条件渲染之前声明
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const passengerList = await apiGetPassengers();
        // 强制保证首位为登录用户本人
        const normalized = passengerList.slice();
        if (user) {
          const hasSelf = normalized.some(p => p.isDefault || (p.name === user.realName && p.idCard === user.idNumber));
          if (!hasSelf) {
            normalized.unshift({
              id: 'self',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            });
          }
        }
        setPassengers(normalized);
      } catch (error) {
        console.error('获取乘车人信息失败:', error);
        // 如果获取失败，使用用户基本信息作为默认乘车人
        if (user) {
          setPassengers([
            {
              id: '1',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            }
          ]);
        }
      }
    };

    if (user) {
      setPassengers(prev => {
        const hasSelf = prev.some(p => p.isDefault || (p.name === user.realName && p.idCard === user.idNumber));
        if (!hasSelf) {
          return [
            {
              id: 'self',
              name: user.realName,
              idCard: user.idNumber,
              phone: user.phoneNumber,
              passengerType: '成人',
              idType: user.idType,
              isDefault: true
            },
            ...prev
          ];
        }
        return prev;
      });
      fetchPassengers();
    }
  }, [user]);

  const fetchOrders = React.useCallback(async (page = 1, status = orderFilter) => {
    try {
      setIsLoadingOrders(true);
      const { fetchUserOrdersFormatted, getOrderDetail } = await import('../services/orderService');
      const data = await fetchUserOrdersFormatted(page, orderPagination.limit, status);
      const formattedOrders = data.orders;
      setOrders(formattedOrders);
      setOrderPagination(data.pagination);

      const enriched = await Promise.all(formattedOrders.map(async (o: Order) => {
        const hasSeat = (o.passengers && o.passengers[0]?.seatNumber) || (o.seat && o.seat !== '待分配');
        if (hasSeat) return o;
        try {
          const localById = localStorage.getItem(`orderSeatAssignments:${o.id}`);
          const localByNum = localStorage.getItem(`orderSeatAssignments:${o.orderNumber}`);
          let local = localById || localByNum;
          if (!local) {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i) || '';
              if (k.startsWith('orderSeatAssignments:')) {
                const v = localStorage.getItem(k);
                if (v) {
                  try {
                    const parsed = JSON.parse(v);
                    if (parsed && parsed.orderNumber && String(parsed.orderNumber) === String(o.orderNumber)) { local = v; break; }
                  } catch (e) { console.warn('解析本地键失败', e); }
                }
              }
            }
          }
          if (local) {
            const parsed = JSON.parse(local) as { passengers?: Array<{ name: string; seatNumber?: string; carriage?: string | number; seatType?: string }> };
            const lp = Array.isArray(parsed.passengers) ? parsed.passengers : [];
            if (lp.length > 0) {
              const p0 = lp[0];
              const pad2 = (val: string | number) => String(val).padStart(2, '0');
              const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
              const seatText = (p0.carriage && p0.seatNumber) ? `${pad2(p0.carriage)}车${cleanSeat(p0.seatNumber)}` : (o.seat || '待分配');
              return { ...o, seat: seatText, passengers: lp };
            }
          }
        } catch (e) { console.warn('读取本地座位映射失败', e); }
        try {
          let detail: unknown;
          try { if (o.id) detail = await getOrderDetail(String(o.id)); } catch (e) { console.warn('按ID获取订单详情失败', e); }
          if (!detail) { try { detail = await getOrderDetail(String(o.orderNumber)); } catch (e) { console.warn('按订单号获取订单详情失败', e); } }
          const d1 = detail as Record<string, unknown> | null | undefined;
          const maybePassengers = d1 && Array.isArray((d1 as Record<string, unknown>).passengers) ? (d1 as Record<string, unknown>).passengers as unknown[] : undefined;
          const maybeData = d1 && typeof (d1 as Record<string, unknown>).data === 'object' ? (d1 as Record<string, unknown>).data as Record<string, unknown> : undefined;
          const maybeOrder = maybeData && typeof maybeData.order === 'object' ? (maybeData.order as Record<string, unknown>) : undefined;
          const passengers = Array.isArray(maybePassengers) ? maybePassengers : (Array.isArray(maybeOrder?.passengers) ? (maybeOrder!.passengers as unknown[]) : []);
          if (Array.isArray(passengers) && passengers.length > 0) {
            const p0 = passengers[0] as { passengerName?: string; name?: string; seatNumber?: string; seatType?: string; carriage?: string | number };
            const carriage = p0.carriage;
            const seatNumber = p0.seatNumber;
            const pad2 = (val: string | number) => String(val).padStart(2, '0');
            const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
            const seatText = (carriage && seatNumber) ? `${pad2(carriage)}车${cleanSeat(seatNumber)}` : (o.seat || '待分配');
            return { ...o, seat: seatText, passengers: [{ name: p0.passengerName || p0.name || '未知', seatNumber, seatType: p0.seatType, carriage }] };
          }
          const maybeSeat = d1 && typeof (d1 as Record<string, unknown>).seat === 'string' ? (d1 as Record<string, unknown>).seat as string : undefined;
          const rawSeat = typeof maybeOrder?.seat === 'string' ? (maybeOrder!.seat as string) : maybeSeat;
          if (typeof rawSeat === 'string' && rawSeat && rawSeat !== '待分配') {
            const m = rawSeat.match(/^(\d{1,2})车(\S+)$/);
            if (m) {
              const carriage = m[1];
              const seatNumber = m[2];
              const pad2 = (val: string | number) => String(val).padStart(2, '0');
              const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
              const seatText = `${pad2(carriage)}车${cleanSeat(seatNumber)}`;
              return { ...o, seat: seatText, passengers: [{ name: o.passenger || '未知', seatNumber, seatType: '二等座', carriage }] };
            }
          }
        } catch (e) { console.warn('补充订单详情失败', e); }
        return o;
      }));
      setOrders(enriched);
    } catch (error) {
      console.error('获取订单错误:', error);
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams({ page: String(page), limit: String(orderPagination.limit) });
        if (status && status !== 'all') params.append('status', status);
        const response = await fetch(`http://localhost:3000/api/v1/orders?${params}`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const formattedOrders = data.data.orders.map((order: unknown) => {
              const o = order as { id?: string; orderId?: string; trainNumber?: string; fromStation?: string; toStation?: string; departureTime?: string; arrivalTime?: string; departureDate?: string; orderDate?: string; bookDate?: string; createdAt?: unknown; passengers?: Array<{ passengerName?: string; name?: string; seatNumber?: string; seatType?: string; carriage?: string | number }>; totalPrice?: number; status?: string };
              return ({ id: o.id || '', orderNumber: o.orderId || '', trainNumber: o.trainNumber || '', departure: o.fromStation || '', arrival: o.toStation || '', departureTime: o.departureTime || '', arrivalTime: o.arrivalTime || '', date: o.departureDate || '', bookDate: o.orderDate || o.bookDate || (o.createdAt ? String(o.createdAt).slice(0,10) : undefined), tripDate: o.departureDate || '', passenger: (o.passengers && o.passengers[0]?.passengerName) ? String(o.passengers[0]!.passengerName) : '未知', seat: (o.passengers && o.passengers[0]?.seatNumber) ? String(o.passengers[0]!.seatNumber) : '待分配', passengers: Array.isArray(o.passengers) ? o.passengers.map(p => ({ name: p.passengerName || p.name || '未知', seatNumber: p.seatNumber, seatType: p.seatType, carriage: p.carriage })) : undefined, price: o.totalPrice || 0, status: (o.status === 'unpaid' ? 'unpaid' : o.status === 'paid' ? 'paid' : o.status === 'cancelled' ? 'cancelled' : o.status === 'refunded' ? 'refunded' : o.status === 'completed' ? 'completed' : 'unpaid') });
            });
            setOrders(formattedOrders);
            setOrderPagination({ page: data.data.pagination.page, limit: data.data.pagination.limit, total: data.data.pagination.total, totalPages: data.data.pagination.totalPages });
            try {
              const { getOrderDetail } = await import('../services/orderService');
              const enriched = await Promise.all(formattedOrders.map(async (o: Order) => {
                const hasSeat = (o.passengers && o.passengers[0]?.seatNumber) || (o.seat && o.seat !== '待分配');
                if (hasSeat) return o;
                try {
                  const localById = localStorage.getItem(`orderSeatAssignments:${o.id}`);
                  const localByNum = localStorage.getItem(`orderSeatAssignments:${o.orderNumber}`);
                  let local = localById || localByNum;
                  if (!local) {
                    for (let i = 0; i < localStorage.length; i++) {
                      const k = localStorage.key(i) || '';
                      if (k.startsWith('orderSeatAssignments:')) {
                        const v = localStorage.getItem(k);
                        if (v) {
                          try { const parsed = JSON.parse(v); if (parsed && parsed.orderNumber && String(parsed.orderNumber) === String(o.orderNumber)) { local = v; break; } } catch (e) { console.warn('解析本地键失败', e); }
                        }
                      }
                    }
                  }
                  if (local) {
                    const parsed = JSON.parse(local) as { passengers?: Array<{ name: string; seatNumber?: string; carriage?: string | number; seatType?: string }> };
                    const lp = Array.isArray(parsed.passengers) ? parsed.passengers : [];
                    if (lp.length > 0) {
                      const p0 = lp[0];
                      const pad2 = (val: string | number) => String(val).padStart(2, '0');
                      const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
                      const seatText = (p0.carriage && p0.seatNumber) ? `${pad2(p0.carriage)}车${cleanSeat(p0.seatNumber)}` : (o.seat || '待分配');
                      return { ...o, seat: seatText, passengers: lp };
                    }
                  }
                } catch (e) { console.warn('读取本地座位映射失败', e); }
                try {
                  let detail: unknown;
                  try { if (o.id) detail = await getOrderDetail(String(o.id)); } catch (e) { console.warn('按ID获取订单详情失败', e); }
                  if (!detail) { try { detail = await getOrderDetail(String(o.orderNumber)); } catch (e) { console.warn('按订单号获取订单详情失败', e); } }
                  const d1 = detail as Record<string, unknown> | null | undefined;
                  const maybePassengers = d1 && Array.isArray((d1 as Record<string, unknown>).passengers) ? (d1 as Record<string, unknown>).passengers as unknown[] : undefined;
                  const maybeData = d1 && typeof (d1 as Record<string, unknown>).data === 'object' ? (d1 as Record<string, unknown>).data as Record<string, unknown> : undefined;
                  const maybeOrder = maybeData && typeof maybeData.order === 'object' ? (maybeData.order as Record<string, unknown>) : undefined;
                  const passengers = Array.isArray(maybePassengers) ? maybePassengers : (Array.isArray(maybeOrder?.passengers) ? (maybeOrder!.passengers as unknown[]) : []);
                  if (Array.isArray(passengers) && passengers.length > 0) {
                    const p0 = passengers[0] as { passengerName?: string; name?: string; seatNumber?: string; seatType?: string; carriage?: string | number };
                    const carriage = p0.carriage;
                    const seatNumber = p0.seatNumber;
                    const pad2 = (val: string | number) => String(val).padStart(2, '0');
                    const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
                    const seatText = (carriage && seatNumber) ? `${pad2(carriage)}车${cleanSeat(seatNumber)}` : (o.seat || '待分配');
                    return { ...o, seat: seatText, passengers: [{ name: p0.passengerName || p0.name || '未知', seatNumber, seatType: p0.seatType, carriage }] };
                  }
                  const maybeSeat = d1 && typeof (d1 as Record<string, unknown>).seat === 'string' ? (d1 as Record<string, unknown>).seat as string : undefined;
                  const rawSeat = typeof maybeOrder?.seat === 'string' ? (maybeOrder!.seat as string) : maybeSeat;
                  if (typeof rawSeat === 'string' && rawSeat && rawSeat !== '待分配') {
                    const m = rawSeat.match(/^(\d{1,2})车(\S+)$/);
                    if (m) {
                      const carriage = m[1];
                      const seatNumber = m[2];
                      const pad2 = (val: string | number) => String(val).padStart(2, '0');
                      const cleanSeat = (s: string) => String(s).replace(/号$/u, '');
                      const seatText = `${pad2(carriage)}车${cleanSeat(seatNumber)}`;
                      return { ...o, seat: seatText, passengers: [{ name: o.passenger || '未知', seatNumber, seatType: '二等座', carriage }] };
                    }
                  }
                } catch (e) { console.warn('补充订单详情失败', e); }
                return o;
              }));
              setOrders(enriched);
            } catch (e) { console.warn('补充订单详情失败（外层）', e); }
          }
        } else {
          console.error('获取订单失败:', response.statusText);
        }
      } catch (fallbackError) {
        console.error('获取订单失败（回退方式也失败）:', fallbackError);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, [orderFilter, orderPagination.limit]);

  // 监听订单筛选变化 - 必须在条件渲染之前声明
  useEffect(() => {
    if (activeSection === 'orders') {
      // 延迟调用fetchOrders，确保函数已定义
      const timer = setTimeout(() => {
        fetchOrders(1, orderFilter);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [orderFilter, activeSection, fetchOrders]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  // 如果未登录，不渲染内容（会被重定向）
  if (!isLoggedIn || !user) {
    return null;
  }

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout();
      // 与首页保持一致：退出后刷新页面状态
      window.location.reload();
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // 当切换到订单页面时，加载订单数据
    if (section === 'orders') {
      fetchOrders();
    }
  };

  const toggleGroup = (key: 'orders' | 'personal' | 'common') => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarCrumbs = (() => {
    if (activeSection === 'orders') return [{ label: '订单中心', section: 'orders' }, { label: '火车票订单', section: 'orders' }];
    if (activeSection === 'personal-info') return [{ label: '个人信息', section: 'personal-info' }, { label: '查看个人信息', section: 'personal-info' }];
    if (activeSection === 'passengers') return [{ label: '常用信息管理', section: 'passengers' }, { label: '乘车人', section: 'passengers' }];
    return [{ label: '个人中心', section: 'center-home' }];
  })();

  const getGreetingPeriod = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午';
    if (hour < 18) return '下午';
    return '晚上';
  };

  // ===== 辅助函数：脱敏显示与格式化 =====
  const maskIdNumber = (id: string | undefined) => {
    if (!id) return '未设置';
    const len = id.length;
    if (len <= 7) return id;
    const first = id.slice(0, 4);
    const last = id.slice(-3);
    return first + '*'.repeat(len - 7) + last;
  };

  const maskPhoneNumber = (phone: string | undefined) => {
    if (!phone) return '未设置';
    const country = user?.countryCode || (phone.startsWith('+') ? `+${phone.replace(/\D/g, '').slice(0, 2)}` : '+86');
    const digits = phone.replace(/\D/g, '');
    const len = digits.length;
    if (len < 7) return `(${country}) ${digits}`;
    const first3 = digits.slice(0, 3);
    const last4 = digits.slice(-4);
    const stars = '*'.repeat(Math.max(0, len - 7));
    return `(${country}) ${first3}${stars}${last4}`;
  };

  const formatIdType = (idType: string | undefined) => {
    if (!idType) return '未设置';
    const t = idType.toLowerCase();
    if (t === 'id_card' || t === '1') return '中国居民身份证';
    if (t === '2') return '外国人永久身份证';
    if (t === '3') return '港澳台居民身份证';
    return idType;
  };

  const formatPassengerType = (type: string | undefined) => {
    if (!type) return '未设置';
    const t = type.toLowerCase();
    if (t === 'adult' || t === '1') return '成人';
    if (t === 'child' || t === '2') return '儿童';
    if (t === 'student' || t === '3') return '学生';
    return type;
  };

  const countryLabel = (code?: string) => {
    const map: Record<string, string> = {
      '+86': '中国 China (+86)',
      '+852': '中国香港 Hong Kong (+852)',
      '+853': '中国澳门 Macao (+853)',
      '+886': '中国台湾 Taiwan (+886)',
      '+1': '美国/加拿大 (+1)',
      '+44': '英国 (+44)',
      '+81': '日本 (+81)',
      '+82': '韩国 (+82)',
      '+49': '德国 (+49)',
      '+33': '法国 (+33)',
      '+65': '新加坡 (+65)',
      '+91': '印度 (+91)',
      '+61': '澳大利亚 (+61)'
    };
    return map[code || '+86'] || `${code} (未识别)`;
  };

  const handleEditContact = () => {
    setIsEditingContact(true);
    setEmailInput(user?.email || '');
    setPhoneInput(user?.phoneNumber || '');
    setCountryCodeInput(user?.countryCode || '+86');
  };
  const handleSaveContact = async () => {
    try {
      if (import.meta.env.VITE_E2E === 'true') {
        try {
          localStorage.setItem('e2eUserPatch', JSON.stringify({ email: emailInput, phoneNumber: phoneInput, countryCode: countryCodeInput }));
        } catch (e) { console.warn('写入本地用户补丁失败', e); }
        setUserLocal({ email: emailInput, phoneNumber: phoneInput, countryCode: countryCodeInput });
        alert('修改成功');
        setIsEditingContact(false);
        return;
      }
      const { updateProfile } = await import('../services/auth');
      const resp = await updateProfile({ email: emailInput, phoneNumber: phoneInput, countryCode: countryCodeInput });
      if (resp.success) {
        await refreshUser();
        alert('修改成功');
        setIsEditingContact(false);
      } else {
        alert(resp.message || '修改失败');
      }
    } catch (e: unknown) {
      console.error('保存邮箱失败', e);
      const msg = e instanceof Error ? e.message : '修改失败';
      alert(msg);
      setIsEditingContact(false);
    }
  };

  const handleEditExtra = () => {
    console.log('编辑附加信息');
  };

  const handleStudentRefresh = () => {
    console.log('学生资质刷新');
  };

  const handleStudentQuery = () => {
    console.log('学生资质查询');
  };


  const handleAddPassenger = () => {
    setEditingPassenger(null);
    setIsModalOpen(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setIsModalOpen(true);
  };

  const handleDeletePassenger = async (id: string) => {
    const target = passengers.find(p => p.id === id);
    if (target?.isDefault) {
      alert('不能删除默认乘车人（本人）');
      return;
    }
    if (window.confirm('确定要删除这个乘车人吗？')) {
      try {
        await apiDeletePassenger(id);
        setPassengers(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('删除乘车人失败:', error);
        // 开发环境降级：仍在本地移除
        setPassengers(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPassenger(null);
  };

  const handlePassengerAdd = async (passengerData: PassengerFormData) => {
    const optimistic: Passenger = {
      id: `optimistic-${Date.now()}`,
      name: passengerData.name,
      idCard: passengerData.idCard,
      phone: passengerData.phone,
      passengerType: passengerData.passengerType,
      idType: '1',
      isDefault: false
    };
    setPassengers(prev => [...prev, optimistic]);
    try {
      const newPassenger = await apiAddPassenger(passengerData);
      setPassengers(prev => prev.map(p => p.id === optimistic.id ? newPassenger : p));
      if (import.meta.env.VITE_E2E !== 'true') {
        try {
          const passengerList = await apiGetPassengers();
          const normalized = passengerList.slice();
          if (user) {
            const hasSelf = normalized.some(p => p.isDefault || (p.name === user.realName && p.idCard === user.idNumber));
            if (!hasSelf) {
              normalized.unshift({
                id: 'self',
                name: user.realName,
                idCard: user.idNumber,
                phone: user.phoneNumber,
                passengerType: '成人',
                idType: user.idType,
                isDefault: true
              });
            }
          }
          setPassengers(normalized);
        } catch (e) { console.warn('刷新后获取乘客失败', e); }
      }
    } catch (error: unknown) {
      console.error('添加乘车人失败:', error);
      setPassengers(prev => prev.map(p => p.id === optimistic.id ? { ...p, id: `local-${Date.now()}` } : p));
    }
  };

  const handlePassengerEdit = async (id: string, passengerData: PassengerFormData) => {
    try {
      const updatedPassenger = await apiUpdatePassenger(id, passengerData);
      setPassengers(prev => prev.map(p => 
        p.id === id ? updatedPassenger : p
      ));
    } catch (error) {
      console.error('更新乘车人失败:', error);
      alert('更新乘车人失败，请稍后重试');
    }
  };

  // 订单相关处理函数
  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      paid: '已支付',
      unpaid: '未支付',
      cancelled: '已取消',
      refunded: '已退票',
      completed: '已出行'
    };
    return statusMap[status];
  };

  const getStatusClass = (status: Order['status']) => {
    return status;
  };

  const handleOrderDetail = (orderId: string) => {
    // 导航到订单详情页面
    navigate(`/order-detail/${orderId}`);
  };

  const handleRefund = async (orderId: string) => {
    if (window.confirm('确定要申请退票吗？退票可能产生手续费。')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/cancel`, {
          method: 'PUT', // 修改为PUT方法，与后端路由一致
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert('退票申请成功！');
            // 重新加载订单列表
            fetchOrders(orderPagination.page, orderFilter);
          } else {
            alert(data.message || '退票申请失败');
          }
        } else {
          alert('退票申请失败，请稍后重试');
        }
      } catch (error) {
        console.error('退票申请错误:', error);
        alert('退票申请失败，请稍后重试');
      }
    }
  };

  const handlePayOpen = (order: Order) => {
    setPaymentOrderBackendId(order.id);
    setPaymentOrderData({
      orderId: order.orderNumber,
      totalPrice: order.price,
      trainNumber: order.trainNumber,
      fromStation: order.departure,
      toStation: order.arrival,
      departureDate: order.date,
      passengerCount: (order.passengers && order.passengers.length) ? order.passengers.length : 1
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!paymentOrderBackendId) {
      setIsPaymentModalOpen(false);
      return;
    }
    try {
      const { updateOrderStatus } = await import('../services/orderService');
      await updateOrderStatus(paymentOrderBackendId, 'paid', 'alipay');
      setIsPaymentModalOpen(false);
      alert('支付成功！');
      fetchOrders(orderPagination.page, orderFilter);
    } catch (error) {
      console.warn('支付状态更新失败', error);
      setIsPaymentModalOpen(false);
      alert('支付成功，但状态更新稍后刷新');
      fetchOrders(orderPagination.page, orderFilter);
    }
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= orderPagination.totalPages) {
      fetchOrders(newPage, orderFilter);
    }
  };

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const statusMatch = orderFilter ? order.status === orderFilter : true;
    const selectedDate = dateMode === 'book' ? (order.bookDate || order.date) : (order.tripDate || order.date);
    const dateMatch = (!dateStart || (selectedDate && selectedDate >= dateStart)) && (!dateEnd || (selectedDate && selectedDate <= dateEnd));
    const kw = keyword.trim();
    const keywords = [order.orderNumber, order.trainNumber, order.passenger, ...(order.passengers ? order.passengers.map(p => p.name) : [])].filter(Boolean) as string[];
    const keywordMatch = !kw || keywords.some(v => v.includes(kw));
    return statusMatch && dateMatch && keywordMatch;
  });

  const formatSeatText = (carriage?: string | number, seatNumber?: string, fallback?: string): string => {
    const pad2 = (val: string | number) => String(val).padStart(2, '0');
    const cleanSeat = (s: string) => s.replace(/号$/u, '');
    if (carriage !== undefined && carriage !== null && String(carriage).trim() !== '' && seatNumber) {
      return `${pad2(carriage)}车${cleanSeat(String(seatNumber))}`;
    }
    if (fallback) {
      const f = fallback.trim();
      const m = f.match(/^(\d{1,2})\D*(\S+)$/);
      if (m) return `${pad2(m[1])}车${cleanSeat(m[2])}`;
      return f || '待分配';
    }
    return '待分配';
  };

  const resolveSeatText = (order: Order): string => {
    const first = order.passengers && order.passengers[0];
    if (first && first.carriage !== undefined && first.seatNumber) {
      return formatSeatText(first.carriage, first.seatNumber);
    }
    try {
      const keyById = `orderSeatAssignments:${order.id}`;
      const keyByNum = `orderSeatAssignments:${order.orderNumber}`;
      let local = localStorage.getItem(keyById) || localStorage.getItem(keyByNum);
      if (!local) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || '';
          if (k.startsWith('orderSeatAssignments:')) {
            const v = localStorage.getItem(k);
            if (!v) continue;
            try {
              const parsed = JSON.parse(v) as { orderNumber?: string; passengers?: Array<{ seatNumber?: string; carriage?: string | number }> };
              if (parsed && parsed.orderNumber && String(parsed.orderNumber) === String(order.orderNumber)) { local = v; break; }
            } catch (e) { console.warn('解析本地键失败', e); }
          }
        }
      }
      if (local) {
        const parsed = JSON.parse(local) as { passengers?: Array<{ seatNumber?: string; carriage?: string | number }> };
        const lp = Array.isArray(parsed.passengers) ? parsed.passengers : [];
        if (lp.length > 0) {
          const p0 = lp[0];
          return formatSeatText(p0.carriage, p0.seatNumber, order.seat);
        }
      }
    } catch (e) { console.warn('解析本地座位缓存失败', e); }
    return formatSeatText(undefined, undefined, order.seat || '待分配');
  };

  const toggleOrderCollapse = (orderId: string) => {
    setCollapsedMap(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  return (
    <div className="profile-page">
      {/* 顶部导航栏（与首页一致）*/}
      <header className="header">
        <div className="header-container header-top">
          {/* 左侧：Logo与标题 */}
          <div className="brand">
            <img className="brand-logo" src="/铁路12306-512x512.png" alt="中国铁路12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>

          {/* 中间：搜索框 */}
          <div className="header-search">
            <input
              className="search-input"
              type="text"
              placeholder="搜索车票、 餐饮、 常旅客、 相关规章"
            />
            <button className="search-button">Q</button>
          </div>

          {/* 右侧：链接与操作 */}
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

      <Navbar />

      {/* 主要内容 */}
      <div className="profile-main">
        {/* 顶部面包屑，横向跨两列 */}
        <div className="sidebar-breadcrumb">
          <span className="crumb-label">当前位置：</span>
          {sidebarCrumbs.map((c, idx) => (
            <React.Fragment key={idx}>
              <button type="button" className="crumb-link" onClick={() => handleSectionChange(c.section)}>{c.label}</button>
              {idx < sidebarCrumbs.length - 1 && <span className="crumb-sep">{'>'}</span>}
            </React.Fragment>
          ))}
        </div>
        {/* 左侧导航 */}
        <aside className="profile-sidebar">
          {/* 删除用户信息卡片 */}
          <div className="sidebar-nav">
            {/* 顶层标题 */}
              <div className="nav-group">
                <h4>
                  <button
                    type="button"
                  className="group-button"
                  onClick={() => handleSectionChange('center-home')}
                  aria-pressed={activeSection === 'center-home'}
                >
                  个人中心
                </button>
              </h4>
              <ul />
            </div>

            {/* 订单中心 */}
            <div className="nav-group">
              <h4>
                <div className="tree-group-header">
                  <span>订单中心</span>
                  <button className="tree-toggle" aria-expanded={expandedGroups.orders} onClick={() => toggleGroup('orders')}>{expandedGroups.orders ? '▾' : '▸'}</button>
                </div>
              </h4>
              <ul className={`tree-list ${expandedGroups.orders ? 'expanded' : 'collapsed'}`}>
                <li>
                  <button
                    className={activeSection === 'orders' ? 'active' : ''}
                    onClick={() => handleSectionChange('orders')}
                  >
                    火车票订单
                  </button>
                </li>
                <li><button disabled>候补订单</button></li>
                <li><button disabled>计次•定期票订单</button></li>
                <li><button disabled>约号订单</button></li>
                <li><button disabled>雪具快运订单</button></li>
                <li><button disabled>餐饮•特产</button></li>
                <li><button disabled>保险订单</button></li>
                <li><button disabled>电子发票</button></li>
              </ul>
            </div>

            {/* 本人车票 */}
            <div className="nav-group">
              <h4>本人车票</h4>
              <ul />
            </div>

            {/* 会员中心 */}
            <div className="nav-group">
              <h4>会员中心</h4>
              <ul />
            </div>

            {/* 个人信息 */}
            <div className="nav-group">
              <h4>
                <div className="tree-group-header">
                  <span>个人信息</span>
                  <button className="tree-toggle" aria-expanded={expandedGroups.personal} onClick={() => toggleGroup('personal')}>{expandedGroups.personal ? '▾' : '▸'}</button>
                </div>
              </h4>
              <ul className={`tree-list ${expandedGroups.personal ? 'expanded' : 'collapsed'}`}>
                <li>
                  <button
                    className={activeSection === 'personal-info' ? 'active' : ''}
                    onClick={() => handleSectionChange('personal-info')}
                  >
                    查看个人信息
                  </button>
                </li>
                <li><button disabled>账号安全</button></li>
                <li><button disabled>手机核验</button></li>
                <li><button disabled>账号注销</button></li>
              </ul>
            </div>

            {/* 常用信息管理 */}
            <div className="nav-group">
              <h4>
                <div className="tree-group-header">
                  <span>常用信息管理</span>
                  <button className="tree-toggle" aria-expanded={expandedGroups.common} onClick={() => toggleGroup('common')}>{expandedGroups.common ? '▾' : '▸'}</button>
                </div>
              </h4>
              <ul className={`tree-list ${expandedGroups.common ? 'expanded' : 'collapsed'}`}>
                <li>
                  <button
                    className={activeSection === 'passengers' ? 'active' : ''}
                    onClick={() => handleSectionChange('passengers')}
                  >
                    乘车人
                  </button>
                </li>
                <li><button disabled>地址管理</button></li>
              </ul>
            </div>

            {/* 温馨服务 */}
            <div className="nav-group">
              <h4>温馨服务</h4>
              <ul>
                <li><button disabled>重点旅客预约</button></li>
                <li><button disabled>遗失物品查找</button></li>
                <li><button disabled>服务查询</button></li>
              </ul>
            </div>

            {/* 投诉和建议 */}
            <div className="nav-group">
              <h4>投诉和建议</h4>
              <ul>
                <li><button disabled>投诉</button></li>
                <li><button disabled>建议</button></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* 右侧内容区域 */}
        <main className="profile-content">
          {activeSection === 'center-home' && (
            <div className="content-section">
              <div className="center-welcome">
                <div className="welcome-header">
                  <div className="megaphone-icon" aria-hidden="true" />
                  <div className="greeting-text">
                    {user && user.realName ? (
                      <>
                        <span className="greeting-name">{user.realName}</span>
                        <span>，{getGreetingPeriod()}好！</span>
                      </>
                    ) : (
                      <>
                        <span>您好</span>
                        <span>，{getGreetingPeriod()}好！</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="notice-card">
                  <p>欢迎您登录中国铁路客户服务中心网站。</p>
                  <p>如果您的密码在其他网站也使用，建议您修改本网站密码。</p>
                  <p><a className="action-link" href="#" onClick={(e) => e.preventDefault()}>点击成为会员</a></p>
                  <p>如果您需要预订车票，请您点击<a className="action-link" href="/train-list">车票预订</a>。</p>
                </div>
                <div className="qr-grid">
                  <div className="qr-card">
                    <div className="qr-code" />
                    <div className="qr-text">使用微信扫一扫，可通过<br />微信公众号接收12306行程通知</div>
                  </div>
                  <div className="qr-card">
                    <div className="qr-code" />
                    <div className="qr-text">使用支付宝扫一扫，可通过<br />支付宝通知提醒接收12306行程通知</div>
                  </div>
                </div>
                <div className="warm-tips">
                  <div className="tips-title">温馨提示：</div>
                  <ol>
                    <li>消息通知方式进行相关调整，将通过“铁路12306”App客户端为您推送相关消息（需开启通知权限）。您也可以扫描关注“铁路12306”微信公众号或支付宝生活号，选择通过微信或支付宝接收。列车运行调整的通知仍然发送短信通知给您。</li>
                    <li>您可通过“账号安全”中的“通知设置”修改您接收信息服务的方式。</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'personal-info' && (
            <div className="content-section person-info">
              <h2>个人信息</h2>

              {/* 基本信息 */}
              <section className="info-section">
                <div className="section-title">基本信息</div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 用户名：</label>
                    <span className="kv-value">{user.username}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 姓名：</label>
                    <span className="kv-value">{user.realName}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">国家/地区：</label>
                    <span className="kv-value">{countryLabel(user.countryCode)}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 证件类型：</label>
                    <span className="kv-value">{formatIdType(user.idType)}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">* 证件号码：</label>
                    <span className="kv-value">{maskIdNumber(user.idNumber)}</span>
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">核验状态：</label>
                    <span className="kv-value verified-tag">已通过</span>
                  </div>
                </div>
              </section>

              {/* 联系方式 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">联系方式</div>
                  <div className="section-toolbar">
                    <button className="edit-btn" onClick={handleEditContact}>编辑</button>
                  </div>
                </div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 手机号：</label>
                    {isEditingContact ? (
                      <div className="phone-row">
                        <select
                          className="country-select"
                          value={countryCodeInput}
                          onChange={(e) => setCountryCodeInput(e.target.value)}
                        >
                          <option value="+86">+86 中国</option>
                          <option value="+852">+852 中国香港</option>
                          <option value="+853">+853 中国澳门</option>
                          <option value="+886">+886 中国台湾</option>
                          <option value="+1">+1 美国/加拿大</option>
                          <option value="+44">+44 英国</option>
                          <option value="+81">+81 日本</option>
                          <option value="+82">+82 韩国</option>
                          <option value="+49">+49 德国</option>
                          <option value="+33">+33 法国</option>
                          <option value="+65">+65 新加坡</option>
                          <option value="+91">+91 印度</option>
                          <option value="+61">+61 澳大利亚</option>
                        </select>
                        <input
                          id="phoneNumber"
                          type="tel"
                          className="kv-input"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <span className="kv-value">{maskPhoneNumber(user.phoneNumber)}</span>
                        <span className="verified-inline">已通过核验</span>
                      </>
                    )}
                  </div>
                  <div className="kv-item">
                    <label className="kv-label">邮箱：</label>
                    {isEditingContact ? (
                      <>
                        <input
                          id="email"
                          type="email"
                          className="kv-input"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <button className="save-btn" onClick={handleSaveContact}>保存</button>
                      </>
                    ) : (
                      <span className="kv-value">{user.email || '未设置'}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* 附加信息 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">附加信息</div>
                  <div className="section-toolbar">
                    <button className="edit-btn" onClick={handleEditExtra}>编辑</button>
                  </div>
                </div>
                <div className="kv-list">
                  <div className="kv-item">
                    <label className="kv-label">* 优惠(待)类型：</label>
                    <span className="kv-value">{formatPassengerType(user.passengerType)}</span>
                  </div>
                </div>
              </section>

              {/* 学生资质查询 */}
              <section className="info-section">
                <div className="section-header-inline">
                  <div className="section-title">学生资质查询</div>
                  <div className="section-toolbar">
                    <button className="detail-btn" onClick={handleStudentRefresh}>刷新</button>
                    <button className="detail-btn" onClick={handleStudentQuery}>查询</button>
                  </div>
                </div>
                <p className="section-note">
                  学生资质查询服务，提供查询本人的学生购票资质、购票优惠区间及年度剩余优惠票购票次数。
                </p>
              </section>
            </div>
          )}

          {activeSection === 'passengers' && (
            <div className="content-section">
              <h2>乘车人管理</h2>
              <div className="passengers-section">
                {/* 搜索工具栏 */}
                <div className="passenger-tools">
                  <div className="search-input-wrap">
                    <input
                      type="text"
                      placeholder="请输入乘客姓名"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="search-input"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        className="clear-btn"
                        aria-label="清空"
                        onClick={() => { setSearchInput(''); setSearchName(''); setSelectedPassengerIds([]); }}
                      >×</button>
                    )}
                  </div>
                  <button
                    className="search-btn"
                    onClick={() => { setSearchName(searchInput.trim()); setSelectedPassengerIds([]); }}
                  >查询</button>
                </div>

                
                {/* 乘车人表格 */}
                {(() => {
                  // 排序：默认乘车人优先
                  const sorted = [...passengers].sort((a, b) => (
                    (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
                  ));
                  const filtered = sorted.filter(p => !searchName || p.name.includes(searchName));
                  return (
                    <div className="passenger-table">
                      {/* 表头 */}
                      <div className="table-header">
                        <div className="col-check" />
                        <div className="col-index">序号</div>
                        <div className="col-name">姓名</div>
                        <div className="col-idtype">证件类型</div>
                        <div className="col-idnumber">证件号码</div>
                        <div className="col-phone">手机／电话</div>
                        <div className="col-verify">核验状态</div>
                        <div className="col-actions">操作</div>
                      </div>

                      {/* 表内操作栏 */}
                      <div className="table-action-row">
                        <button className="add-action" onClick={handleAddPassenger}>添加</button>
                        <button
                          className="bulk-delete-action"
                          onClick={async () => {
                            if (selectedPassengerIds.length === 0) {
                              alert('请选择需要删除的乘车人');
                              return;
                            }
                            if (!window.confirm(`确定批量删除选中的${selectedPassengerIds.length}个乘车人吗？`)) return;
                            try {
                              const toDelete = selectedPassengerIds.filter(id => {
                                const p = passengers.find(x => x.id === id);
                                return !p?.isDefault;
                              });
                              for (const id of toDelete) {
                                await apiDeletePassenger(id);
                              }
                              setPassengers(prev => prev.filter(p => !toDelete.includes(p.id)));
                              setSelectedPassengerIds([]);
                            } catch (err) {
                              console.error('批量删除失败:', err);
                              alert('批量删除失败，请稍后重试');
                            }
                          }}
                        >批量删除</button>
                      </div>

                      {/* 行 */}
                      {filtered.map((p, idx) => (
                        <div key={p.id} className="table-row">
                          <div className="col-check">
                            <input
                              type="checkbox"
                              checked={selectedPassengerIds.includes(p.id)}
                              disabled={!!p.isDefault}
                              onChange={() => {
                                if (p.isDefault) return;
                                setSelectedPassengerIds(prev => (
                                  prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                ));
                              }}
                            />
                          </div>
                          <div className="col-index">{idx + 1}</div>
                          <div className="col-name">{p.name}</div>
                          <div className="col-idtype">{formatIdType(p.idType)}</div>
                          <div className="col-idnumber">{maskIdNumber(p.idCard)}</div>
                          <div className="col-phone">{maskPhoneNumber(p.phone)}</div>
                          <div className="col-verify">
                            <span className="verify-badge" title="已核验">🪪<span className="dot ok" /> 已核验</span>
                          </div>
                          <div className="col-actions">
                            {!p.isDefault && (
                              <button
                                className="op-btn delete"
                                title="删除"
                                onClick={() => handleDeletePassenger(p.id)}
                              >🗑</button>
                            )}
                            <button
                              className="op-btn edit"
                              title="编辑"
                              onClick={() => handleEditPassenger(p)}
                            >✎</button>
                          </div>
                        </div>
                      ))}

                      {filtered.length === 0 && (
                        <div className="empty-state">
                          <p>未找到乘车人，请调整查询条件或添加乘车人</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="content-section">
              <div className="orders-section">
                <div className="order-tabs">
                  <button className={`tab-btn ${orderFilter === 'unpaid' ? 'active' : ''}`} data-testid="orders-tab-unfinished" onClick={() => setOrderFilter('unpaid')}>未完成订单</button>
                  <button className={`tab-btn ${orderFilter === 'paid' ? 'active' : ''}`} data-testid="orders-tab-not-travelled" onClick={() => setOrderFilter('paid')}>未出行订单</button>
                  <button className={`tab-btn ${orderFilter === 'completed' ? 'active' : ''}`} data-testid="orders-tab-travelled" onClick={() => setOrderFilter('completed')}>已出行订单</button>
                </div>
                <div className="order-filters advanced">
                  <select className="filter-select date-mode" value={dateMode} onChange={(e) => setDateMode(e.target.value as 'book' | 'trip')}>
                    <option value="book">按订票日期查询</option>
                    <option value="trip">按乘车日期查询</option>
                  </select>
                  <input type="date" className="date-filter" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                  <span className="date-sep">—</span>
                  <input type="date" className="date-filter" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                  <div className="search-input-wrap small">
                    <input
                      type="text"
                      placeholder="订单号/车次/姓名"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="search-input"
                    />
                    {keywordInput && (
                      <button type="button" className="clear-btn" aria-label="清空" onClick={() => { setKeywordInput(''); setKeyword(''); }}>
                        ×
                      </button>
                    )}
                  </div>
                  <button className="search-btn" onClick={() => setKeyword(keywordInput.trim())}>查询</button>
                </div>

                <div className="orders-list">
                  {isLoadingOrders ? (
                    <div className="loading-state">
                      <p>加载中...</p>
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    <>
                      <div className="orders-table-header">
                        <div>车次信息</div>
                        <div>旅客信息</div>
                        <div>席位信息</div>
                        <div>票价</div>
                        <div>车票状态</div>
                      </div>
                      {filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                          <div className="order-meta">
                            <button className="toggle-btn" aria-expanded={!collapsedMap[order.id]} onClick={() => toggleOrderCollapse(order.id)}>{collapsedMap[order.id] ? '▸' : '▾'}</button>
                            <span>订票日期：{order.bookDate || order.date}</span><span className="meta-sep">订单号：{order.orderNumber}</span>
                          </div>
                          {!collapsedMap[order.id] && (
                          <div className="orders-table-row">
                            <div className="train-col">
                              <div className="train-route">{order.departure} → {order.arrival}</div>
                              <div className="train-time">{order.date} {order.departureTime} 开</div>
                            </div>
                            <div className="passenger-col">
                              <div className="passenger-name">{(order.passengers && order.passengers.length > 0) ? (order.passengers[0]?.name || order.passenger) : order.passenger}</div>
                              <button className="link-btn small" onClick={() => handleOrderDetail(order.orderNumber)}>打印信息单</button>
                              <div className="id-type">居民身份证</div>
                            </div>
                            <div className="seat-col">
                              <div>{(order.passengers && order.passengers.length > 0) ? (order.passengers[0]?.seatType || '二等座') : '二等座'}</div>
                              <div>{resolveSeatText(order)}</div>
                            </div>
                            <div className="price-col">
                              <div>成人票</div>
                              <div className="price-val">{typeof order.price === 'number' ? `${order.price}元` : order.price}</div>
                            </div>
                            <div className="status-col">
                              <div className={`ticket-status ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</div>
                              {order.status === 'paid' && (
                                <button className="link-btn small" onClick={() => handleRefund(order.id)}>退票</button>
                              )}
                              {order.status === 'unpaid' && (
                                <button className="link-btn small pay-btn" onClick={() => handlePayOpen(order)}>去支付</button>
                              )}
                            </div>
                          </div>
                          )}
                          <div className="order-ops">
                            <button className="detail-btn" onClick={() => handleOrderDetail(order.orderNumber)}>订单详情</button>
                            <button className="ops-btn" disabled>添加免费乘车儿童</button>
                            <button className="ops-btn" disabled>购/赔/退保险</button>
                            <button className="ops-btn" disabled>改签</button>
                            <button className="ops-btn" disabled>变更到站</button>
                            <button className="ops-btn" onClick={() => navigate('/train-list')}>餐饮•特产</button>
                          </div>
                        </div>
                      ))}
                      {orderPagination.totalPages > 1 && (
                        <div className="pagination">
                          <button className="page-btn" disabled={orderPagination.page === 1} onClick={() => handlePageChange(orderPagination.page - 1)}>上一页</button>
                          <span className="page-info">第 {orderPagination.page} 页，共 {orderPagination.totalPages} 页</span>
                          <button className="page-btn" disabled={orderPagination.page === orderPagination.totalPages} onClick={() => handlePageChange(orderPagination.page + 1)}>下一页</button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>暂无订单记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 添加乘车人模态框 */}
      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAdd={handlePassengerAdd}
        onEdit={handlePassengerEdit}
        editingPassenger={editingPassenger}
      />

      {/* 页脚（与主页一致的灰色区域）*/}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-bottom">
            <p>版权所有©2008-2025 中国铁道科学研究院集团有限公司 技术支持：铁旅科技有限公司</p>
            <p>公安 京公网安备 11010802038392号 | 京ICP备05020493号-4 | ICP证：京B2-20202537 | 营业执照</p>
          </div>
        </div>
      </footer>

      {paymentOrderData && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          onPaymentSuccess={handlePaymentSuccess}
          orderData={paymentOrderData}
        />
      )}
    </div>
  );
};

export default ProfilePage;
 
