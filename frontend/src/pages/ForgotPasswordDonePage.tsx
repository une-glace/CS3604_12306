import React from 'react';
import './ForgotPasswordDonePage.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordDonePage: React.FC = () => {
  const navigate = useNavigate();
  const goLogin = () => navigate('/login');
  return (
    <div className="forgot-page">
      <div className="fp-container">
        <div className="fp-tabs">
          <div className="fp-tab">人脸找回</div>
          <div className="fp-tab fp-tab-active">手机找回</div>
          <div className="fp-tab">邮箱找回</div>
        </div>

        <div className="fp-steps">
          <div className="fp-step">
            <span className="fp-step-circle">1</span>
            <span className="fp-step-text">填写账户信息</span>
          </div>
          <div className="fp-step"><span className="fp-step-line" /></div>
          <div className="fp-step">
            <span className="fp-step-circle">2</span>
            <span className="fp-step-text">获取验证码</span>
          </div>
          <div className="fp-step"><span className="fp-step-line" /></div>
          <div className="fp-step">
            <span className="fp-step-circle">3</span>
            <span className="fp-step-text">设置新密码</span>
          </div>
          <div className="fp-step"><span className="fp-step-line" /></div>
          <div className="fp-step fp-step-active">
            <span className="fp-step-circle">4</span>
            <span className="fp-step-text">完成</span>
          </div>
        </div>

        <div className="fp-core fp-core-center">
          <div className="fp-success-box">
            <span className="fp-success-text">新密码设置成功，您可以使用新密码登录系统！</span>
            <button className="fp-login-link" onClick={goLogin}>登录系统</button>
          </div>

          <div className="fp-extra">
            <span className="fp-extra-text">手机号码未通过校验？</span>
            <a className="fp-extra-link" href="#">试试邮箱找回</a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPasswordDonePage;