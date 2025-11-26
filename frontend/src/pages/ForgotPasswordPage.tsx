import React, { useState } from 'react';
import './ForgotPasswordPage.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { validateResetAccount } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [countryCode, setCountryCode] = useState('+86');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('居民身份证');
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const onSubmit = async () => {
    if (isLoading) return;
    if (!phone || !idNumber) return;
    setIsLoading(true);
    try {
      const resp = await validateResetAccount({ countryCode, phoneNumber: phone, idNumber });
      if (resp.success) {
        navigate('/forgot-password/verify', { state: { countryCode, phone, idNumber } });
      } else {
        alert(resp.message || '账户校验失败，请检查手机号与证件号码');
      }
    } catch (e: any) {
      alert(e?.message || '账户校验失败，请检查手机号与证件号码');
    } finally {
      setIsLoading(false);
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
              <>
                <button className="link-btn" onClick={() => navigate('/profile')}>您好，{user?.realName || '用户'}</button>
                <span className="sep">|</span>
                <button className="link-btn" onClick={async () => { if (window.confirm('确定要退出登录吗？')) { await logout(); window.location.reload(); } }}>退出</button>
              </>
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
          <div className="fp-step fp-step-active">
            <span className="fp-step-circle">1</span>
            <span className="fp-step-text">填写账户信息</span>
          </div>
          <div className="fp-step">
            <span className="fp-step-line" />
          </div>
          <div className="fp-step">
            <span className="fp-step-circle">2</span>
            <span className="fp-step-text">获取验证码</span>
          </div>
          <div className="fp-step">
            <span className="fp-step-line" />
          </div>
          <div className="fp-step">
            <span className="fp-step-circle">3</span>
            <span className="fp-step-text">设置新密码</span>
          </div>
          <div className="fp-step">
            <span className="fp-step-line" />
          </div>
          <div className="fp-step">
            <span className="fp-step-circle">4</span>
            <span className="fp-step-text">完成</span>
          </div>
        </div>

        <div className="fp-core">
          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 手机号码：</label>
            <div className="fp-field-group">
              <select className="fp-select fp-country" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                <option value="+86">+86</option>
              </select>
              <input className="fp-input" type="text" placeholder="" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="fp-hint fp-hint-ok">已通过校验的手机号码</div>
          </div>

          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 证件类型：</label>
            <div className="fp-field-group">
              <select className="fp-select" value={idType} onChange={e => setIdType(e.target.value)}>
                <option>居民身份证</option>
                <option>护照</option>
                <option>港澳通行证</option>
                <option>台湾通行证</option>
              </select>
            </div>
            <div className="fp-hint">请选择证件类型</div>
          </div>

          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 证件号码：</label>
            <div className="fp-field-group">
              <input className="fp-input" type="text" placeholder="" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
            </div>
            <div className="fp-hint">请填写证件号码</div>
          </div>

          <div className="fp-actions">
            <button className="fp-submit" type="button" disabled={isLoading} onClick={onSubmit}>提交</button>
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

export default ForgotPasswordPage;