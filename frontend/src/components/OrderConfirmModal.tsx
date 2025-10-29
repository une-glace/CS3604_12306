import React from 'react';
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
  onConfirm: () => void;
  trainInfo: TrainInfo | null;
  passengers: Passenger[];
  ticketInfos: TicketInfo[];
  totalPrice: number;
}

const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trainInfo,
  ticketInfos,
  totalPrice
}) => {
  if (!isOpen || !trainInfo) return null;

  return (
    <div className="order-confirm-overlay">
      <div className="order-confirm-modal">
        <div className="modal-header">
          <h3>确认订单信息</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* 车次信息 */}
          <div className="train-info-section">
            <h4>车次信息</h4>
            <div className="train-details">
              <div className="train-number">{trainInfo.trainNumber}</div>
              <div className="route-info">
                <span className="station">{trainInfo.from}</span>
                <span className="arrow">→</span>
                <span className="station">{trainInfo.to}</span>
              </div>
              <div className="time-info">
                <span>{trainInfo.date} {trainInfo.departureTime}</span>
                <span className="duration">历时{trainInfo.duration}</span>
                <span>{trainInfo.arrivalTime}</span>
              </div>
            </div>
          </div>

          {/* 乘车人信息 */}
          <div className="passengers-section">
            <h4>乘车人信息</h4>
            <div className="passengers-list">
              {ticketInfos.map((ticket, index) => (
                <div key={index} className="passenger-item">
                  <div className="passenger-name">{ticket.passengerName}</div>
                  <div className="passenger-details">
                    <span className="seat-type">{ticket.seatType}</span>
                    <span className="ticket-type">{ticket.ticketType}</span>
                    <span className="price">¥{ticket.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 费用明细 */}
          <div className="price-section">
            <div className="price-breakdown">
              <div className="price-item">
                <span>票价总计</span>
                <span>¥{totalPrice}</span>
              </div>
              <div className="price-item total">
                <span>应付金额</span>
                <span className="total-amount">¥{totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="confirm-btn" onClick={onConfirm}>确认订单</button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmModal;