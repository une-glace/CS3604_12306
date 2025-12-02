import React, { useEffect, useState } from 'react';
import './ForgotPasswordVerifyPage.css';
import Footer from '../components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendPhoneCode, verifyPhoneCode } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const ForgotPasswordVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  interface FPState { countryCode?: string; phone?: string; idNumber?: string }
  const routeState = (location.state as FPState) || {};
  const displayCountryCode = routeState.countryCode || '+86';
  const displayPhone = routeState.phone || '';
  const idNumber = routeState.idNumber || '';
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const onSend = async () => { 
    if (sending) return; 
    try {
      setSending(true);
      const resp = await sendPhoneCode({ countryCode: displayCountryCode, phoneNumber: displayPhone });
      if (!resp.success) {
        alert(resp.message || '发送验证码失败');
        setSending(false);
        return;
      }
      setCooldown(60);
    } catch (e: any) {
      alert(e?.message || '发送验证码失败');
      setSending(false);
    }
  };
  useEffect(() => {
    if (!sending || cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [sending, cooldown]);
  useEffect(() => {
    if (cooldown === 0 && sending) setSending(false);
  }, [cooldown, sending]);
  const onSubmit = async () => {
    if (verifying) return;
    if (!code || code.length < 4) return;
    setVerifying(true);
    try {
      const resp = await verifyPhoneCode({ countryCode: displayCountryCode, phoneNumber: displayPhone, code });
      if (resp.success) {
        navigate('/forgot-password/reset', { state: { countryCode: displayCountryCode, phone: displayPhone, idNumber } });
      } else {
        alert(resp.message || '验证码校验失败');
      }
    } catch (e: any) {
      alert(e?.message || '验证码校验失败');
    } finally {
      setVerifying(false);
    }
  };
  return (
    <div className="forgot-page">
      <header className="header">
        <div className="header-container header-top">
          <div className="brand">
            <img className="brand-logo" src="/铁路12306-512x512.png" alt="中国铁路12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="header-search">
            <input className="search-input" type="text" placeholder="搜索车票、 餐饮、 常旅客、 相关规章" />
            <button className="search-button">Q</button>
          </div>
          <div className="header-links">
            <a href="#" className="link">无障碍</a>
            <span className="sep">|</span>
            <a href="#" className="link">敬老版</a>
            <span className="sep">|</span>
            <a href="#" className="link">English</a>
            <span className="sep">|</span>
            <button className="link-btn" onClick={() => { if (isLoggedIn) { navigate('/profile'); } else { navigate('/login'); } }}>我的12306</button>
            <span className="sep">|</span>
            {isLoggedIn ? (
              <button className="link-btn" onClick={async () => { if (window.confirm('确定要退出登录吗？')) { await logout(); window.location.reload(); } }}>退出</button>
            ) : (
              <>
                <button className="link-btn" onClick={() => navigate('/login')}>登录</button>
                <span className="space" />
                <button className="link-btn" onClick={() => navigate('/register')}>注册</button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="/" className="active">首页</a></li>
            <li><a href="/train-list">车票</a></li>
            <li><a href="#">团购服务</a></li>
            <li><a href="#">会员服务</a></li>
            <li><a href="#">站车服务</a></li>
            <li><a href="#">商旅服务</a></li>
            <li><a href="#">出行指南</a></li>
            <li><a href="#">信息查询</a></li>
          </ul>
        </div>
      </nav>
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
              <input className="fp-input fp-code" type="text" aria-label="验证码" placeholder="" value={code} onChange={e => setCode(e.target.value)} />
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