import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderProcessing.css';

interface OrderProcessingProps {
  isOpen: boolean;
  onComplete: () => void;
  orderData: {
    orderId: string;
    trainInfo: any;
    passengers: any[];
    totalPrice: number;
  };
}

const OrderProcessing: React.FC<OrderProcessingProps> = ({
  isOpen,
  onComplete,
  orderData
}) => {
  const navigate = useNavigate();
  const [, setCurrentStep] = useState(0);
  const [, setProgress] = useState(0);

  const steps = [
    { text: '验证订单信息', duration: 1000 },
    { text: '查询剩余席位', duration: 1500 },
    { text: '分配座位号', duration: 2000 },
    { text: '生成订单', duration: 1000 },
    { text: '处理完成', duration: 500 }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let stepIndex = 0;
    let progressValue = 0;

    const processStep = () => {
      if (stepIndex >= steps.length) {
        setTimeout(() => {
          onComplete();
        }, 1000);
        return;
      }

      const step = steps[stepIndex];
      const stepProgress = 100 / steps.length;
      
      setCurrentStep(stepIndex);
      
      // 模拟进度条动画
      const progressInterval = setInterval(() => {
        progressValue += 2;
        setProgress(Math.min(progressValue, (stepIndex + 1) * stepProgress));
        
        if (progressValue >= (stepIndex + 1) * stepProgress) {
          clearInterval(progressInterval);
          stepIndex++;
          setTimeout(processStep, 200);
        }
      }, step.duration / 50);
    };

    processStep();
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="order-processing-overlay">
      <div className="order-processing-modal">
        <div className="processing-header">
          <h3>提示</h3>
          <div className="order-id">订单号：{orderData.orderId}</div>
        </div>
        
        <div className="processing-content simple">
          <div className="simple-icon" aria-hidden>
            <div className="icon-ring">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          <div className="simple-text">
            <div className="simple-title">订单已经提交，系统正在处理中，请稍等。</div>
            <div className="simple-sub">
              查看订单处理情况，请点击
              <button className="simple-link" onClick={() => navigate('/profile?section=orders')}>未完成订单</button>
            </div>
            <div className="simple-desc">欢迎购买铁路乘意险</div>
          </div>
        </div>
        
        <div className="processing-footer">
          <p className="tip">请耐心等待，正在为您处理订单...</p>
        </div>
      </div>
    </div>
  );
};

export default OrderProcessing;
