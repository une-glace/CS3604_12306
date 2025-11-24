import React, { useMemo, useState } from 'react';
import './ForgotPasswordResetPage.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
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
  const onSubmit = () => {
    if (loading) return;
    if (!pwd) {
      setLoading(false);
      return;
    }
    if (!canSubmit) return;
    setLoading(true);
    navigate('/forgot-password/done');
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