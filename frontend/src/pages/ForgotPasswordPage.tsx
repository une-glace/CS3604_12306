import React, { useState } from 'react';
import './ForgotPasswordPage.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState('+86');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('居民身份证');
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const onSubmit = () => {
    if (isLoading) return;
    if (!phone || !idNumber) return;
    setIsLoading(true);
    navigate('/forgot-password/verify', { state: { countryCode, phone } });
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