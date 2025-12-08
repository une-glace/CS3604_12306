import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './RefundSuccessPage.css';

interface RefundSuccessState {
  orderId: string;
  refundAmount: number;
  refundFee: number;
  ticketPrice: number;
  trainNumber: string;
  departureDate: string;
  departureTime: string;
}

const RefundSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RefundSuccessState;

  useEffect(() => {
    if (!state) {
      navigate('/profile');
    }
  }, [state, navigate]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } catch (e) {
      return dateStr;
    }
  };

  const feeRate = state.ticketPrice > 0 
    ? Math.round((state.refundFee / state.ticketPrice) * 100) 
    : 0;

  return (
    <div className="refund-success-page">
      <header className="header">
        <div className="header-container header-top">
          <div className="brand">
            <img className="brand-logo" src="/铁路12306-512x512.png" alt="中国铁路12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="header-links">
             <button className="link-btn" onClick={() => navigate('/profile')}>我的12306</button>
          </div>
        </div>
      </header>
      
      <Navbar />

      <div className="refund-success-container">
        
        {/* Top Section: Success Info (Green Background) */}
        <div className="success-section">
          <div className="success-header-row">
            <div className="success-icon-large">✓</div>
            <div className="success-title">操作成功！</div>
            <div className="order-serial">
              业务流水号：<span className="text-orange">{state.orderId}</span>
            </div>
          </div>

          <div className="success-details-rows">
            <div className="detail-row">
              <span className="label">乘车日期：</span>
              <span className="value-orange">{formatDate(state.departureDate)}</span>
              
              <span className="label ml-large">车次：</span>
              <span className="value-orange">{state.trainNumber}</span>
              
              <span className="label ml-large">共计退款：</span>
              <span className="value-orange large-text">{state.refundAmount.toFixed(1)}元</span>
            </div>

            <div className="detail-row">
              <span className="label">票款原价：</span>
              <span className="value-orange">{state.ticketPrice.toFixed(1)}元</span>
              
              <span className="label ml-large">退票手续费：</span>
              <span className="value-orange">{state.refundFee.toFixed(1)}元</span>
              <span className="fee-note">（按{feeRate}% 收取退票手续费）</span>
            </div>
          </div>

          <div className="success-actions">
            <button className="btn-continue" onClick={() => navigate('/')}>继续购票</button>
            <button className="btn-details" onClick={() => navigate(`/order-detail/${state.orderId}`)}>查询订单详情</button>
          </div>
        </div>

        {/* Bottom Section: Notes (Yellow Background) */}
        <div className="notes-section">
          <ol className="notes-list">
            <li>使用现金购买或已领取报销凭证的电子票，线上完成退票后，请持相关证件（购票证件、报销凭证）至车站窗口完成退款。</li>
            <li>应退款项按银行规定时限退还至购票时所使用的网上支付工具账户，请注意查询，如有疑问请致电12306人工客服查询。</li>
            <li>如您需要退票费报销凭证，请凭购票所使用的乘车人有效身份证件原件和订单号码在办理退票之日起30日内到车站退票窗口索取。</li>
            <li>消息通知方式进行相关调整，将通过“铁路12306”App客户端为您推送相关消息（需开启接收推送权限）。您也可以关注“铁路12306”微信公众号或支付宝生活号，选择通过微信或支付宝接收。</li>
          </ol>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default RefundSuccessPage;
