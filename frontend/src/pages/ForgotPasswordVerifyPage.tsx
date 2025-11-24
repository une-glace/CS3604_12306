import React, { useEffect, useState } from 'react';
import './ForgotPasswordVerifyPage.css';
import Footer from '../components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';

const ForgotPasswordVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  interface FPState { countryCode?: string; phone?: string }
  const routeState = (location.state as FPState) || {};
  const displayCountryCode = routeState.countryCode || '+86';
  const displayPhone = routeState.phone || '';
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const onSend = () => { 
    if (sending) return; 
    setSending(true);
    setCooldown(60);
  };
  useEffect(() => {
    if (!sending || cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [sending, cooldown]);
  useEffect(() => {
    if (cooldown === 0 && sending) setSending(false);
  }, [cooldown, sending]);
  const onSubmit = () => {
    if (verifying) return;
    if (!code || code.length < 4) return;
    setVerifying(true);
    navigate('/forgot-password/reset');
  };
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
          <div className="fp-step fp-step-active">
            <span className="fp-step-circle">2</span>
            <span className="fp-step-text">获取验证码</span>
          </div>
          <div className="fp-step"><span className="fp-step-line" /></div>
          <div className="fp-step">
            <span className="fp-step-circle">3</span>
            <span className="fp-step-text">设置新密码</span>
          </div>
          <div className="fp-step"><span className="fp-step-line" /></div>
          <div className="fp-step">
            <span className="fp-step-circle">4</span>
            <span className="fp-step-text">完成</span>
          </div>
        </div>

        <div className="fp-core">
          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 手机号：</label>
            <div className="fp-field-group">
              <span className="fp-country-text">({displayCountryCode})</span>
              <span className="fp-phone">{displayPhone}</span>
            </div>
            <div className="fp-hint fp-hint-ok" />
          </div>

          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 请填写手机验证码：</label>
            <div className="fp-field-group">
              <input className="fp-input fp-code" type="text" placeholder="" value={code} onChange={e => setCode(e.target.value)} />
              <button type="button" className="fp-code-btn" onClick={onSend} disabled={sending}>
                {sending ? `重新获取(${cooldown}s)` : '获取手机验证码'}
              </button>
            </div>
            <div className="fp-hint">{sending ? '验证码已发送，请查收（60秒后可重新获取）' : ''}</div>
          </div>

          <div className="fp-actions">
            <button className="fp-submit" type="button" disabled={verifying} onClick={onSubmit}>提交</button>
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

export default ForgotPasswordVerifyPage;