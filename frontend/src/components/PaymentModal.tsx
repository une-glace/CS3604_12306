import React, { useState, useEffect } from 'react';
import './PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  orderData: {
    orderId: string;
    totalPrice: number;
    trainNumber: string;
    fromStation: string;
    toStation: string;
    departureDate: string;
    passengerCount: number;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  orderData
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(900); // 15分钟倒计时
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 生成支付宝二维码URL（模拟）
      generateQRCode();
      
      // 开始倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentStatus('failed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 模拟支付状态检查
      const paymentTimer = setTimeout(() => {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess();
        }, 500);
      }, 3000);

      return () => {
        clearInterval(timer);
        clearTimeout(paymentTimer);
      };
    }
  }, [isOpen, onPaymentSuccess]);

  const generateQRCode = () => {
    // 模拟生成支付宝二维码
    // 实际项目中应该调用支付宝API生成真实的二维码
    const mockQRData = `alipay://pay?orderId=${orderData.orderId}&amount=${orderData.totalPrice}`;
    
    // 使用在线二维码生成服务（仅用于演示）
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockQRData)}`;
    setQrCodeUrl(qrUrl);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRetryPayment = () => {
    setPaymentStatus('waiting');
    setCountdown(900);
    generateQRCode();
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h2>订单支付</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-content">
          {/* 订单信息 */}
          <div className="order-summary">
            <h3>订单信息</h3>
            <div className="order-details">
              <div className="detail-row">
                <span>订单号：</span>
                <span>{orderData.orderId}</span>
              </div>
              <div className="detail-row">
                <span>车次：</span>
                <span>{orderData.trainNumber}</span>
              </div>
              <div className="detail-row">
                <span>行程：</span>
                <span>{orderData.fromStation} → {orderData.toStation}</span>
              </div>
              <div className="detail-row">
                <span>出发日期：</span>
                <span>{orderData.departureDate}</span>
              </div>
              <div className="detail-row">
                <span>乘车人：</span>
                <span>{orderData.passengerCount}人</span>
              </div>
              <div className="detail-row total-price">
                <span>应付金额：</span>
                <span className="price">¥{orderData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 支付区域 */}
          <div className="payment-area">
            {paymentStatus === 'waiting' && (
              <>
                <div className="payment-method">
                  <div className="method-header">
                    <img src="/alipay-logo.png" alt="支付宝" className="payment-logo" />
                    <span>支付宝扫码支付</span>
                  </div>
                  <div className="qr-code-container">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="支付二维码" className="qr-code" />
                    ) : (
                      <div className="qr-code-loading">正在生成二维码...</div>
                    )}
                    <p className="qr-tip">请使用支付宝扫描二维码完成支付</p>
                  </div>
                </div>
                
                <div className="payment-timer">
                  <span className="timer-text">支付剩余时间：</span>
                  <span className="timer-countdown">{formatTime(countdown)}</span>
                </div>
              </>
            )}

            {paymentStatus === 'processing' && (
              <div className="payment-processing">
                <div className="loading-spinner"></div>
                <p>支付处理中，请稍候...</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="payment-success">
                <div className="success-icon">✓</div>
                <h3>支付成功！</h3>
                <p>订单已支付完成，正在跳转到订单详情...</p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="payment-failed">
                <div className="failed-icon">✗</div>
                <h3>支付失败</h3>
                <p>支付超时或支付失败，请重试</p>
                <button className="retry-btn" onClick={handleRetryPayment}>
                  重新支付
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="payment-footer">
          <div className="security-info">
            <span className="security-icon">🔒</span>
            <span>支付环境安全，请放心支付</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;