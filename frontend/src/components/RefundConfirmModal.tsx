import React from 'react';
import './RefundConfirmModal.css';

interface RefundConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundFee: number, refundAmount: number) => void;
  ticketInfo: {
    trainNumber: string;
    departureDate: string;
    departureTime: string;
    price: number;
    orderId: string;
  };
}

const RefundConfirmModal: React.FC<RefundConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketInfo
}) => {
  if (!isOpen) return null;

  // Calculate refund fee based on time difference
  const calculateRefundFee = () => {
    try {
      const departureStr = `${ticketInfo.departureDate}T${ticketInfo.departureTime}:00`;
      const departureTime = new Date(departureStr).getTime();
      const now = new Date().getTime();
      const diffHours = (departureTime - now) / (1000 * 60 * 60);

      let feeRate = 0;
      if (diffHours >= 8 * 24) {
        feeRate = 0; // No fee more than 8 days before
      } else if (diffHours >= 48) {
        feeRate = 0.05; // 5% fee more than 48 hours before
      } else if (diffHours >= 24) {
        feeRate = 0.10; // 10% fee between 24 and 48 hours
      } else {
        feeRate = 0.20; // 20% fee less than 24 hours
      }

      let fee = ticketInfo.price * feeRate;
      
      // Rounding logic: 5-angle rounding (nearest 0.5)
      // < 2.5 jiao -> 0; >= 2.5 && < 7.5 -> 0.5; >= 7.5 -> 1
      // This is equivalent to Math.round(fee * 2) / 2
      fee = Math.round(fee * 2) / 2;

      // Minimum fee logic: if feeRate > 0, minimum is 2 yuan
      if (feeRate > 0 && fee < 2) {
        fee = 2;
      }
      
      // Safety check: fee cannot exceed price
      if (fee > ticketInfo.price) {
          fee = ticketInfo.price;
      }

      return fee;
    } catch (e) {
      console.error('Error calculating refund fee:', e);
      return 0;
    }
  };

  const refundFee = calculateRefundFee();
  const refundAmount = ticketInfo.price - refundFee; // Keep as number

  // Helper to format currency (remove trailing zeros if integer)
  const formatMoney = (amount: number) => {
      // If integer, return integer string. If x.5, return x.5. If x.0, return x.
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
  };

  return (
    <div className="refund-modal-overlay">
      <div className="refund-modal">
        <div className="refund-modal-header">
          <h3>退票申请</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="refund-modal-content">
          <div className="refund-confirm-header">
            <div className="confirm-icon">?</div>
            <div className="confirm-text">
              <div className="confirm-title">您确认要退票吗？</div>
              <div className="confirm-subtitle">如有订餐饮或特产，请按规定到网站自行办理退订。</div>
            </div>
          </div>
          
          <div className="total-refund-section">
            <span className="label">共计退款：</span>
            <span className="amount-large">{formatMoney(refundAmount)}元</span>
          </div>
          
          <div className="fee-details-section">
             <div className="fee-row">
                <span className="label">手续费用：</span>
                <span className="value">{formatMoney(refundFee)}元</span>
                {refundFee === 0 && <span className="fee-note">（当前时间退票不收取手续费）</span>}
             </div>
             <div className="fee-row">
                <span className="label">车票票价：</span>
                <span className="value">{formatMoney(ticketInfo.price)}元</span>
             </div>
             <div className="fee-row">
                <span className="label">应退票款：</span>
                <span className="value highlight">{formatMoney(refundAmount)}元</span>
             </div>
          </div>
          
          <div className="warning-section">
             <div className="warning-item">
                <span className="warning-icon-small">!</span>
                <span className="warning-text">实际核收退票费及应退票款将按最终交易时间计算。</span>
             </div>
             <div className="warning-item">
                <span className="warning-icon-small">!</span>
                <span className="warning-text">如你需要办理该次列车前续、后续退票业务，请于退票车次票面开车时间前办理。</span>
             </div>
          </div>

          <div className="refund-rules-section">
            <ol>
              <li>使用现金购买或已领取报销凭证的电子票，线上完成退票后，请持相关证件（购票证件、报销凭证）至车站窗口完成退款。如您同时购买了“乘意险”，可在车站窗口退款时一并办理。</li>
              <li>退票费按如下规则核收：票面乘车站开车时间前8天（含）以上不收取退票费，48小时以上的按票价5%计，24小时以上、不足48小时的按票价10%计，不足24小时的按票价20%计。上述计算的尾数以5角为单位，尾数小于2.5角的舍去、2.5角（含）以上且小于7.5角的计为5角、7.5角（含）以上的进为1元。退票费最低按2元计收。更多退票规则请查看<a href="#" className="link-blue">《退改说明》</a>。</li>
              <li>应退款项按银行规定时限退还至购票时所使用的网上支付工具账户，请注意查询，如有疑问请致电12306 人工客服查询。</li>
              <li>跨境旅客旅行须知详见铁路跨境旅客相关运输组织规则和车站公告。</li>
            </ol>
          </div>
        </div>
        
        <div className="refund-modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="confirm-btn" onClick={() => onConfirm(refundFee, refundAmount)}>确定</button>
        </div>
      </div>
    </div>
  );
};

export default RefundConfirmModal;
