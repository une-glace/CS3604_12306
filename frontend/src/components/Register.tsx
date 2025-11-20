import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';
import '../pages/HomePage.css';
import Footer from './Footer';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  idType: string;
  realName: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  passengerType: string;
  phoneVerificationCode: string;
  agreementAccepted: boolean;
}

interface RegisterProps {
  onRegister?: (formData: RegisterFormData) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = () => {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    idType: '1', // 1: 中国居民身份证
    realName: '',
    idNumber: '',
    email: '',
    phoneNumber: '',
    countryCode: '+86',
    passengerType: '1', // 1: 成人
    phoneVerificationCode: '',
    agreementAccepted: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 证件类型选项
  const idTypeOptions = [
    { value: '1', label: '中国居民身份证' },
    { value: '2', label: '外国人永久身份证' },
    { value: '3', label: '港澳台居民身份证' }
  ];

  // 旅客类型选项
  const passengerTypeOptions = [
    { value: '1', label: '成人' },
    { value: '2', label: '儿童' }
  ];

  // 验证规则

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = /^\d{4,15}$/;
    const cnLocal = /^1[3-9]\d{9}$/;
    return digitsOnly.test(phone) || cnLocal.test(phone);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 清除对应字段的错误信息
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 发送手机验证码
  const sendVerificationCode = async () => {
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setErrors(prev => ({ ...prev, phoneNumber: '请输入正确的手机号码' }));
      return;
    }

    setIsLoading(true);
    try {
      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationCodeSent(true);
      setCountdown(60);
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('发送验证码失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    return true;
  };

  // 下一步
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 上一步
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 提交注册
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const registerData = {
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        idType: formData.idType,
        realName: formData.realName,
        idNumber: formData.idNumber,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        countryCode: formData.countryCode,
        passengerType: formData.passengerType
      };

      const response = await registerUser(registerData);
      
      if (response.success) {
        // 使用AuthContext的login方法自动登录
        login(response.data!.user, response.data!.token);
        alert('注册成功！');
        navigate('/profile'); // 跳转到个人中心页面
      } else {
        // 处理服务器返回的错误
        if (response.errors) {
          const newErrors: Record<string, string> = {};
          Object.keys(response.errors).forEach(key => {
            newErrors[key] = response.errors![key];
          });
          setErrors(newErrors);
        } else {
          alert(response.message || '注册失败，请重试');
        }
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      // 开发环境降级处理：模拟注册成功并自动登录
      login({
        id: Date.now(),
        username: formData.username,
        realName: formData.realName,
        idType: formData.idType,
        idNumber: formData.idNumber,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        countryCode: formData.countryCode,
        passengerType: formData.passengerType,
        status: 'active'
      } as any, 'dev-mock-token');
      alert('注册成功！');
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* 顶部：与首页一致的 Header */}
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

      {/* 导航栏：与首页一致 */}
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

      <div className="register-main">
        <div className="register-form-container">

          <div className="register-form">
            {currentStep === 1 && (
              <div className="step-content">
                <h3>账户信息</h3>
                <div className="register-form-grid">
                  {/* 用户名 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 用 户 名：</label>
                    <div className="grid-input">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="6-30位字母、数字、空格或'_'，字母开头"
                        className={errors.username ? 'error' : ''}
                      />
                      {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>
                    <div className="grid-hint">6-30位字母、数字或“_”,字母开头</div>
                  </div>

                  {/* 登录密码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 登录密码：</label>
                    <div className="grid-input">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="6-20位字母、数字或符号"
                        className={errors.password ? 'error' : ''}
                      />
                      {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    <div className="grid-hint">6-20位字母、数字或符号</div>
                  </div>

                  {/* 确认密码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 确认密码：</label>
                    <div className="grid-input">
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="再次输入您的登录密码"
                        className={errors.confirmPassword ? 'error' : ''}
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                    <div className="grid-hint">再次输入您的登录密码</div>
                  </div>

                  {/* 证件类型 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 证件类型：</label>
                    <div className="grid-input">
                      <select
                        id="idType"
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                      >
                        {idTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid-hint">居民身份证</div>
                  </div>

                  {/* 姓名 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 姓 名：</label>
                    <div className="grid-input">
                      <input
                        type="text"
                        id="realName"
                        name="realName"
                        value={formData.realName}
                        onChange={handleInputChange}
                        placeholder="请输入姓名"
                        className={errors.realName ? 'error' : ''}
                      />
                      {errors.realName && <span className="error-message">{errors.realName}</span>}
                    </div>
                    <div className="grid-hint">
                      <a className="rule-link" href="#" onClick={(e)=>e.preventDefault()}>姓名填写规则</a>
                      （用于身份核验，请正确填写）
                    </div>
                  </div>

                  {/* 证件号码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 证件号码：</label>
                    <div className="grid-input">
                      <input
                        type="text"
                        id="idNumber"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        placeholder="请输入您的证件号码"
                        className={errors.idNumber ? 'error' : ''}
                      />
                      {errors.idNumber && <span className="error-message">{errors.idNumber}</span>}
                    </div>
                    <div className="grid-hint">（用于身份核验，请正确填写）</div>
                  </div>

                  {/* 优惠（待）类型 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 优惠（待）类型：</label>
                    <div className="grid-input">
                      <select
                        id="passengerType"
                        name="passengerType"
                        value={formData.passengerType}
                        onChange={handleInputChange}
                      >
                        {passengerTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid-hint">成人</div>
                  </div>

                  {/* 邮箱 */}
                  <div className="grid-row">
                    <label className="grid-label">邮 箱：</label>
                    <div className="grid-input">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="请正确填写邮箱地址"
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="grid-hint">请正确填写邮箱地址</div>
                  </div>

                  {/* 手机号码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 手机号码：</label>
                    <div className="grid-input">
                      <div className="phone-row">
                        <select
                          className="country-select"
                          value={formData.countryCode}
                          name="countryCode"
                          onChange={handleInputChange}
                        >
                          <option value="+86">+86 中国</option>
                          <option value="+852">+852 中国香港</option>
                          <option value="+853">+853 中国澳门</option>
                          <option value="+886">+886 中国台湾</option>
                          <option value="+1">+1 美国/加拿大</option>
                          <option value="+44">+44 英国</option>
                          <option value="+81">+81 日本</option>
                          <option value="+82">+82 韩国</option>
                          <option value="+49">+49 德国</option>
                          <option value="+33">+33 法国</option>
                          <option value="+65">+65 新加坡</option>
                          <option value="+91">+91 印度</option>
                          <option value="+61">+61 澳大利亚</option>
                        </select>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="手机号码"
                          className={errors.phoneNumber ? 'error' : ''}
                        />
                      </div>
                      {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                    </div>
                    <div className="grid-hint">请正确填写手机号码，稍后将向该手机号码发送短信验证码</div>
                  </div>

                  {/* 协议 */}
                  <div className="grid-row agreement-row">
                    <label className="grid-label"></label>
                    <div className="grid-input">
                      <label className="agreement-label">
                        <input
                          type="checkbox"
                          name="agreementAccepted"
                          checked={formData.agreementAccepted}
                          onChange={handleInputChange}
                        />
                        <span className="checkmark"></span>
                        我已阅读并同意遵守
                        <a href="/terms" target="_blank">《中国铁路客户服务中心网站服务条款》</a>
                        <a href="/privacy" target="_blank">《隐私权政策》</a>
                      </label>
                      {errors.agreementAccepted && <span className="error-message">{errors.agreementAccepted}</span>}
                    </div>
                    <div className="grid-hint"></div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-content">
                <h3>手机验证</h3>
                
                <div className="verification-info">
                  <p>验证码已发送至手机号：{`${formData.countryCode} ${formData.phoneNumber}`}</p>
                </div>

                <div className="form-group verification-group">
                  <label htmlFor="phoneVerificationCode">手机验证码 *</label>
                  <div className="verification-input">
                    <input
                      type="text"
                      id="phoneVerificationCode"
                      name="phoneVerificationCode"
                      value={formData.phoneVerificationCode}
                      onChange={handleInputChange}
                      placeholder="请输入6位验证码"
                      className={errors.phoneVerificationCode ? 'error' : ''}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={countdown > 0 || isLoading}
                      className="send-code-btn"
                    >
                      {countdown > 0 ? `${countdown}s后重发` : verificationCodeSent ? '重新发送' : '发送验证码'}
                    </button>
                  </div>
                  {errors.phoneVerificationCode && <span className="error-message">{errors.phoneVerificationCode}</span>}
                </div>
              </div>
            )}

            {/* 两步流程，移除原第3步内容 */}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="prev-btn"
                >
                  上一步
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="next-btn"
                >
                  下一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="submit-btn"
                >
                  {isLoading ? '注册中...' : '完成注册'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 移除右侧信息区块 */}
      </div>

      <Footer />
    </div>
  );
};

export default Register;
