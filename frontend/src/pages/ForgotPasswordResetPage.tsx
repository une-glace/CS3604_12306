import React, { useMemo, useState } from 'react';
import './ForgotPasswordResetPage.css';
import Footer from '../components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';
import Navbar from '../components/Navbar';

const ForgotPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  interface FPState { countryCode?: string; phone?: string; idNumber?: string }
  const routeState = (location.state as FPState) || {};
  const countryCode = routeState.countryCode || '+86';
  const phone = routeState.phone || '';
  const idNumber = routeState.idNumber || '';
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = (p: string) => {
    const len = p.length >= 8 && p.length <= 20;
    const classes = [/[a-zA-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    return len && classes >= 2;
  };
  const pwdError = useMemo(() => {
    if (!pwd) return '';
    return isValid(pwd) ? '' : '密码需为8-20位，包含字母、数字与符号的组合';
  }, [pwd]);
  const confirmError = useMemo(() => {
    if (!confirm) return '';
    return confirm === pwd ? '' : '两次输入密码不一致';
  }, [confirm, pwd]);
  const canSubmit = useMemo(() => {
    if (!pwd || !confirm) return false;
    if (!isValid(pwd)) return false;
    if (pwd !== confirm) return false;
    return true;
  }, [pwd, confirm]);
  const onSubmit = async () => {
    if (loading) return;
    if (!pwd) {
      setLoading(false);
      return;
    }
    if (!canSubmit) return;
    setLoading(true);
    try {
      const resp = await resetPassword({ countryCode, phoneNumber: phone, idNumber, newPassword: pwd, confirmPassword: confirm });
      if (resp.success) {
        navigate('/forgot-password/done');
      } else {
        alert(resp.message || '密码重置失败');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '密码重置失败';
      alert(msg);
    } finally {
      setLoading(false);
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

      <Navbar active="home" />
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
          <div className="fp-step fp-step-active">
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
            <label className="fp-label"><span className="fp-required">*</span> 新密码：</label>
            <div className="fp-field-group">
              <input className="fp-input" type="password" aria-label="新密码" placeholder="" value={pwd} onChange={e => setPwd(e.target.value)} />
            </div>
            <div className="fp-hint">需为8-20位，包含字母、数字与符号的组合</div>
            {pwdError && <div className="fp-error">{pwdError}</div>}
          </div>

          <div className="fp-row">
            <label className="fp-label"><span className="fp-required">*</span> 密码确认：</label>
            <div className="fp-field-group">
              <input className="fp-input" type="password" aria-label="密码确认" placeholder="" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <div className="fp-hint">请再次输入密码</div>
            {confirmError && <div className="fp-error">{confirmError}</div>}
          </div>

          <div className="fp-actions">
            <button className="fp-submit" type="button" disabled={loading || !canSubmit} onClick={onSubmit}>完成</button>
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

export default ForgotPasswordResetPage;
