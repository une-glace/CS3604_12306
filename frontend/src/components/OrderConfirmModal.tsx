import React, { useState } from 'react';
import './OrderConfirmModal.css';

interface TrainInfo {
  trainNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  duration: string;
  seatType: string;
  price: number;
}

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
  idType?: string;
}

interface TicketInfo {
  passengerId: string;
  passengerName: string;
  seatType: string;
  ticketType: '成人票' | '儿童票' | '学生票';
  price: number;
}

interface OrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSeatCodes: string[]) => void;
  trainInfo: TrainInfo | null;
  passengers: Passenger[];
  ticketInfos: TicketInfo[];
  totalPrice: number;
  seatInfo?: Record<string, { price: number; availableSeats: number; totalSeats: number; isAvailable: boolean }>;
}

const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trainInfo,
  passengers,
  ticketInfos,
  seatInfo
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  if (!isOpen || !trainInfo) return null;

  const weekDay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['周日','周一','周二','周三','周四','周五','周六'];
      return days[d.getDay()] || '';
    } catch {
      return '';
    }
  };

  const maskId = (id: string) => {
    if (!id) return '';
    const len = id.length;
    if (len <= 7) return id;
    return `${id.slice(0,4)}${'*'.repeat(len - 7)}${id.slice(len-3)}`;
  };

  const formatIdType = (idType?: string) => {
    if (!idType) return '中国居民身份证';
    const t = idType.toLowerCase();
    if (t === '1' || t === 'id_card') return '中国居民身份证';
    if (t === '2') return '外国人永久身份证';
    if (t === '3') return '港澳台居民身份证';
    return idType;
  };

  const getPassengerById = (pid: string) => passengers.find(p => p.id === pid);

  const buildStockNodes = () => {
    if (!seatInfo || Object.keys(seatInfo).length === 0) return null;
    const parts: React.ReactNode[] = [];
    Object.entries(seatInfo).forEach(([type, info]) => {
      if (typeof info.availableSeats === 'number') {
        parts.push(
          <span key={type}>
            {type}余票<span className="stock-num">{info.availableSeats}</span>张
          </span>
        );
      } else if (info.isAvailable) {
        parts.push(<span key={type}>{type}有票</span>);
      } else {
        parts.push(<span key={type}>{type}无票</span>);
      }
    });
    return (
      <>
        {parts.map((node, i) => (
          <React.Fragment key={i}>
            {node}
            {i < parts.length - 1 ? '，' : '。'}
          </React.Fragment>
        ))}
      </>
    );
  };

  const toggleSeat = (code: string) => {
    setSelectedCodes(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      if (prev.length >= ticketInfos.length) return prev;
      return [...prev, code];
    });
  };
  const hasStudentTicket = ticketInfos.some(t => t.ticketType === '学生票');

  return (
    <div className="order-confirm-overlay">
      <div className="order-confirm-modal">
        <div className="modal-header confirm-header">
          <h3>请核对以下信息</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* 信息总览（日期 + 车次 + 区间 + 时间）*/}
          <div className="info-summary">
            <span className="date-text">{trainInfo.date}（{weekDay(trainInfo.date)}）</span>
            <span className="sp">&nbsp;</span>
            <span className="train-strong">{trainInfo.trainNumber}</span>
            <span className="text-small">次</span>
            <span className="sp">&nbsp;</span>
            <span className="station-strong">{trainInfo.from}</span>
            <span className="sp">（</span>
            <span className="depart-strong">{trainInfo.departureTime}</span>
            <span className="sp">开） — </span>
            <span className="station-strong">{trainInfo.to}</span>
            <span className="sp">（</span>
            <span className="arrival-small">{trainInfo.arrivalTime}</span>
            <span className="sp">到）</span>
          </div>

          {/* 核对表格 */}
          <div className="check-table">
            <div className="check-table-header">
              <div>序号</div>
              <div>席别</div>
              <div>票种</div>
              <div>姓名</div>
              <div>证件类型</div>
              <div>证件号码</div>
            </div>
            {ticketInfos.map((ticket, index) => {
              const p = getPassengerById(ticket.passengerId);
              return (
                <div key={index} className="check-table-row">
                  <div>{index + 1}</div>
                  <div>{ticket.seatType}</div>
                  <div>{ticket.ticketType}</div>
                  <div>{ticket.passengerName}</div>
                  <div>{formatIdType(p?.idType)}</div>
                  <div>{maskId(p?.idCard || '')}</div>
                </div>
              );
            })}
          </div>

          {/* 说明与选座展示（交互）*/}
          <div className="note-line">*如果本次列车剩余席位无法满足您的选座需求，系统将自动为您分配席位。</div>

          <div className="seat-preference">
            <div className="seat-pref-title">
              <span className="bell" aria-hidden>🔔</span>
              选座啦
            </div>
            <div className="seat-pref-grid">
              <span className="muted">窗</span>
              <span className="seat-sep" aria-hidden />
              <button
                className={`seat-opt${selectedCodes.includes('A') ? ' selected' : ''}`}
                onClick={() => toggleSeat('A')}
                disabled={selectedCodes.length >= ticketInfos.length && !selectedCodes.includes('A')}
              >A</button>
              <button
                className={`seat-opt${selectedCodes.includes('B') ? ' selected' : ''}`}
                onClick={() => toggleSeat('B')}
                disabled={selectedCodes.length >= ticketInfos.length && !selectedCodes.includes('B')}
              >B</button>
              <button
                className={`seat-opt${selectedCodes.includes('C') ? ' selected' : ''}`}
                onClick={() => toggleSeat('C')}
                disabled={selectedCodes.length >= ticketInfos.length && !selectedCodes.includes('C')}
              >C</button>
              <span className="seat-sep" aria-hidden />
              <span className="muted aisle">过道</span>
              <span className="seat-sep" aria-hidden />
              <button
                className={`seat-opt${selectedCodes.includes('D') ? ' selected' : ''}`}
                onClick={() => toggleSeat('D')}
                disabled={selectedCodes.length >= ticketInfos.length && !selectedCodes.includes('D')}
              >D</button>
              <button
                className={`seat-opt${selectedCodes.includes('F') ? ' selected' : ''}`}
                onClick={() => toggleSeat('F')}
                disabled={selectedCodes.length >= ticketInfos.length && !selectedCodes.includes('F')}
              >F</button>
              <span className="seat-sep" aria-hidden />
              <span className="muted">窗</span>
            </div>
            <div className="seat-selected">已选座 {selectedCodes.length}/{ticketInfos.length}</div>
          </div>

          {hasStudentTicket && (
            <div className="tip-red">*按现行规定，学生票购票区间必须与学生证上的乘车区间一致，否则车站将不予换票。</div>
          )}
          <div className="stock-info">本次列车，{buildStockNodes()}</div>

          
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>返回修改</button>
          <button className="confirm-btn" onClick={() => onConfirm(selectedCodes)}>确认</button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmModal;
