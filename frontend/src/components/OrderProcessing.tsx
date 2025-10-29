import React, { useEffect, useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

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
          <h3>订单处理中</h3>
          <div className="order-id">订单号：{orderData.orderId}</div>
        </div>
        
        <div className="processing-content">
          <div className="loading-animation">
            <div className="spinner"></div>
          </div>
          
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </div>
          
          <div className="steps-list">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`step-item ${
                  index < currentStep ? 'completed' : 
                  index === currentStep ? 'active' : 'pending'
                }`}
              >
                <div className="step-icon">
                  {index < currentStep ? '✓' : 
                   index === currentStep ? '⟳' : '○'}
                </div>
                <div className="step-text">{step.text}</div>
              </div>
            ))}
          </div>
          
          <div className="order-summary">
            <div className="summary-item">
              <span>车次：</span>
              <span>{orderData.trainInfo?.trainNumber}</span>
            </div>
            <div className="summary-item">
              <span>乘车人数：</span>
              <span>{orderData.passengers?.length}人</span>
            </div>
            <div className="summary-item">
              <span>总金额：</span>
              <span className="price">¥{orderData.totalPrice}</span>
            </div>
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