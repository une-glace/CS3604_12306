import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  idType: string;
  realName: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  passengerType: string;
  phoneVerificationCode: string;
  agreementAccepted: boolean;
}

interface RegisterProps {
  onRegister?: (formData: RegisterFormData) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
  const validateUsername = (username: string): boolean => {
    const regex = /^[A-Za-z]{1}([A-Za-z0-9]|[_]){0,29}$/;
    return regex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phone);
  };

  const validateIdNumber = (idNumber: string, idType: string): boolean => {
    if (idType === '1') {
      // 中国居民身份证验证
      const regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if (!regex.test(idNumber)) return false;
      
      // 校验码验证
      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      
      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(idNumber[i]) * weights[i];
      }
      
      const checkCode = checkCodes[sum % 11];
      return idNumber[17].toUpperCase() === checkCode;
    }
    return idNumber.length >= 8; // 其他证件类型简单长度验证
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
    const newErrors: {[key: string]: string} = {};

    if (currentStep === 1) {
      // 验证账户信息
      if (!formData.username.trim()) {
        newErrors.username = '请输入用户名';
      } else if (!validateUsername(formData.username)) {
        newErrors.username = '用户名格式不正确（6-30位字母、数字或"_"，字母开头）';
      }

      if (!formData.password) {
        newErrors.password = '请输入密码';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = '密码至少6位字符';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
    } else if (currentStep === 2) {
      // 验证个人信息
      if (!formData.realName.trim()) {
        newErrors.realName = '请输入真实姓名';
      }

      if (!formData.idNumber.trim()) {
        newErrors.idNumber = '请输入证件号码';
      } else if (!validateIdNumber(formData.idNumber, formData.idType)) {
        newErrors.idNumber = '证件号码格式不正确';
      }

      if (!formData.email.trim()) {
        newErrors.email = '请输入邮箱地址';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = '邮箱格式不正确';
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = '请输入手机号码';
      } else if (!validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = '手机号码格式不正确';
      }
    } else if (currentStep === 3) {
      // 验证手机验证码
      if (!formData.phoneVerificationCode.trim()) {
        newErrors.phoneVerificationCode = '请输入手机验证码';
      }

      if (!formData.agreementAccepted) {
        newErrors.agreementAccepted = '请阅读并同意服务条款';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        passengerType: formData.passengerType
      };

      const response = await registerUser(registerData);
      
      if (response.success) {
        // 使用AuthContext的login方法自动登录
        login(response.data!.user, response.data!.token);
        alert('注册成功！');
        navigate('/');
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
      alert(error.message || '注册失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="register-logo">
          <img src="/logo.png" alt="12306" />
          <span>中国铁路12306</span>
        </div>
        <nav className="register-nav">
          <a href="/">首页</a>
          <button onClick={onNavigateToLogin} className="login-link">登录</button>
        </nav>
      </div>

      <div className="register-main">
        <div className="register-form-container">
          <div className="register-form-header">
            <h2>用户注册</h2>
            <div className="step-indicator">
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">账户信息</span>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">个人信息</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">验证完成</span>
              </div>
            </div>
          </div>

          <div className="register-form">
            {currentStep === 1 && (
              <div className="step-content">
                <h3>设置账户信息</h3>
                
                <div className="form-group">
                  <label htmlFor="username">用户名 *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="6-30位字母、数字或'_'，字母开头"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">登录密码 *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="至少6位字符"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">确认密码 *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入密码"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-content">
                <h3>填写个人信息</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="idType">证件类型 *</label>
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

                  <div className="form-group">
                    <label htmlFor="passengerType">旅客类型 *</label>
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
                </div>

                <div className="form-group">
                  <label htmlFor="realName">姓名 *</label>
                  <input
                    type="text"
                    id="realName"
                    name="realName"
                    value={formData.realName}
                    onChange={handleInputChange}
                    placeholder="请输入证件上的中文姓名"
                    className={errors.realName ? 'error' : ''}
                  />
                  {errors.realName && <span className="error-message">{errors.realName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="idNumber">证件号码 *</label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder="请输入证件号码"
                    className={errors.idNumber ? 'error' : ''}
                  />
                  {errors.idNumber && <span className="error-message">{errors.idNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">邮箱 *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">手机号码 *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="请输入11位手机号码"
                    className={errors.phoneNumber ? 'error' : ''}
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="step-content">
                <h3>手机验证</h3>
                
                <div className="verification-info">
                  <p>验证码已发送至手机号：{formData.phoneNumber}</p>
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

                <div className="agreement-section">
                  <label className="agreement-label">
                    <input
                      type="checkbox"
                      name="agreementAccepted"
                      checked={formData.agreementAccepted}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    我已阅读并同意
                    <a href="/terms" target="_blank">《12306用户服务条款》</a>
                    和
                    <a href="/privacy" target="_blank">《隐私政策》</a>
                  </label>
                  {errors.agreementAccepted && <span className="error-message">{errors.agreementAccepted}</span>}
                </div>
              </div>
            )}

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
              
              {currentStep < 3 ? (
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

        <div className="register-info">
          <div className="info-section">
            <h3>注册须知</h3>
            <ul>
              <li>请使用真实姓名和证件信息注册，以便正常购票和乘车</li>
              <li>一个证件号码只能注册一个12306账户</li>
              <li>注册信息一经提交，证件信息不可修改</li>
              <li>请妥善保管您的账户信息，避免泄露</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>安全保障</h3>
            <div className="security-features">
              <div className="security-item">
                <span className="security-icon">🔐</span>
                <span>实名认证</span>
              </div>
              <div className="security-item">
                <span className="security-icon">📱</span>
                <span>手机验证</span>
              </div>
              <div className="security-item">
                <span className="security-icon">🛡️</span>
                <span>信息加密</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="register-footer">
        <div className="footer-links">
          <a href="/about">关于我们</a>
          <a href="/privacy">隐私政策</a>
          <a href="/terms">服务条款</a>
          <a href="/contact">联系我们</a>
        </div>
        <p className="copyright">
          © 2024 中国铁路客户服务中心 版权所有
        </p>
      </div>
    </div>
  );
};

export default Register;