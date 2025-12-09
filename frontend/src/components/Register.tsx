import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, sendPhoneCode, verifyPhoneCode, loginUser, checkUsernameAvailability } from '../services/auth';
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
  const [isVerified, setIsVerified] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);
  const [isConfirmValid, setIsConfirmValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 提交级错误提示（全局）
  const [submitError, setSubmitError] = useState<string>('');

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
    const cnLocal = /^\d{11}$/;
    return cnLocal.test(phone);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let nextValue: string | boolean = type === 'checkbox' ? checked : value;
    if (name === 'phoneNumber') {
      nextValue = String(nextValue).replace(/\D/g, '').slice(0, 11);
    }
    if (name === 'idNumber' && formData.idType === '1') {
      nextValue = String(nextValue).slice(0, 18);
    }
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    if (name === 'username') {
      setIsUsernameAvailable(null);
    }
    if (name === 'password') {
      setIsPasswordValid(null);
      setPasswordStrength(0);
    }
    if (name === 'confirmPassword') {
      setIsConfirmValid(null);
    }

    if (name === 'idNumber' && formData.idType === '1' && value.length > 18) {
      setFormData(prev => ({ ...prev, idNumber: value.slice(0, 18) }));
    }

    // 清除对应字段的错误信息
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUsernameBlur = async () => {
    const u = (formData.username || '').trim();
    if (!u) {
      setErrors(prev => ({ ...prev, username: '' }));
      setIsUsernameAvailable(null);
      return;
    }
    if (u.length < 6) {
      setErrors(prev => ({ ...prev, username: '用户名长度不能少于6个字符！' }));
      setIsUsernameAvailable(null);
      return;
    }
    if (u.length > 30) {
      setErrors(prev => ({ ...prev, username: '用户名长度不能超过30个字符！' }));
      setIsUsernameAvailable(null);
      return;
    }
    const pattern = /^[A-Za-z][A-Za-z0-9_]*$/;
    if (!pattern.test(u)) {
      setErrors(prev => ({ ...prev, username: '用户名只能由字母、数字和_组成，须以字母开头！' }));
      setIsUsernameAvailable(null);
      return;
    }
    try {
      const resp = await checkUsernameAvailability(u);
      if (resp.success && resp.data) {
        if (resp.data.available) {
          setErrors(prev => ({ ...prev, username: '' }));
          setIsUsernameAvailable(true);
        } else {
          setErrors(prev => ({ ...prev, username: '该用户名已经占用，请重新选择用户名！' }));
          setIsUsernameAvailable(false);
        }
      } else {
        setIsUsernameAvailable(null);
      }
    } catch {
      setIsUsernameAvailable(null);
    }
  };

  const computeNameDisplayLength = (s: string): number => {
    let len = 0;
    for (const ch of s) {
      if (/^[\u4e00-\u9fa5]$/.test(ch)) {
        len += 2;
      } else {
        len += 1;
      }
    }
    return len;
  };

  const handleRealNameBlur = () => {
    const name = (formData.realName || '').trim();
    if (!name) {
      setErrors(prev => ({ ...prev, realName: '请输入姓名！' }));
      return;
    }
    const allowed = /^[A-Za-z\u4e00-\u9fa5. ]+$/;
    if (!allowed.test(name)) {
      setErrors(prev => ({ ...prev, realName: '请输入姓名！' }));
      return;
    }
    const dlen = computeNameDisplayLength(name);
    if (dlen < 3 || dlen > 30) {
      setErrors(prev => ({ ...prev, realName: '允许输入的字符串在3-30个字符之间！' }));
      return;
    }
    setErrors(prev => ({ ...prev, realName: '' }));
  };

  const handlePhoneNumberBlur = () => {
    const num = (formData.phoneNumber || '').trim();
    if (!/^\d{11}$/.test(num)) {
      setErrors(prev => ({ ...prev, phoneNumber: '您输入的手机号码不是有效的格式！' }));
      return;
    }
    setErrors(prev => ({ ...prev, phoneNumber: '' }));
  };

  const handleIdNumberBlur = () => {
    let id = (formData.idNumber || '').trim();
    if (formData.idType === '1' && id.length > 18) {
      id = id.slice(0, 18);
      setFormData(prev => ({ ...prev, idNumber: id }));
    }
    const allowed = /^[A-Za-z0-9]+$/;
    if (id && !allowed.test(id)) {
      setErrors(prev => ({ ...prev, idNumber: '输入的证件编号中包含中文信息或特殊字符！' }));
      return;
    }
    if (formData.idType === '1') {
      if (!id || id.length !== 18) {
        setErrors(prev => ({ ...prev, idNumber: '请正确输入18位证件号码！' }));
        return;
      }
      const pattern = /^\d{17}[0-9Xx]$/;
      if (!pattern.test(id)) {
        setErrors(prev => ({ ...prev, idNumber: '请正确输入18位证件号码！' }));
        return;
      }
      // 放宽校验：不做校验码计算，只检查长度与字符范围
    }
    setErrors(prev => ({ ...prev, idNumber: '' }));
  };

  const computePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    if (pwd.length < 6) return 1;
    if (!/^[_A-Za-z0-9]+$/.test(pwd)) return 1;
    let types = 0;
    if (/[A-Za-z]/.test(pwd)) types++;
    if (/\d/.test(pwd)) types++;
    if (/_/.test(pwd)) types++;
    if (types <= 1) return 1;
    if (types === 2) return 2;
    return 3;
  };

  const handlePasswordBlur = () => {
    const pwd = formData.password || '';
    const strength = computePasswordStrength(pwd);
    setPasswordStrength(strength);
    if (pwd.length < 6) {
      setErrors(prev => ({ ...prev, password: '密码长度不能少于6个字符！' }));
      setIsPasswordValid(null);
      return;
    }
    if (!/^[_A-Za-z0-9]+$/.test(pwd)) {
      setErrors(prev => ({ ...prev, password: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！' }));
      setIsPasswordValid(null);
      return;
    }
    const types = (/[A-Za-z]/.test(pwd) ? 1 : 0) + (/\d/.test(pwd) ? 1 : 0) + (/_/.test(pwd) ? 1 : 0);
    if (types <= 1) {
      setErrors(prev => ({ ...prev, password: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！' }));
      setIsPasswordValid(null);
      return;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    setIsPasswordValid(true);
  };

  const handleConfirmBlur = () => {
    const pwd = formData.password || '';
    const cpwd = formData.confirmPassword || '';
    if (!cpwd) {
      setErrors(prev => ({ ...prev, confirmPassword: '请再次输入登录密码' }));
      setIsConfirmValid(null);
      return;
    }
    if (pwd !== cpwd) {
      setErrors(prev => ({ ...prev, confirmPassword: '确认密码与密码不同！' }));
      setIsConfirmValid(null);
      return;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    setIsConfirmValid(true);
  };

  // 发送手机验证码
  const sendVerificationCode = async () => {
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setErrors(prev => ({ ...prev, phoneNumber: '您输入的手机号码不是有效的格式！', phoneVerificationCode: '您输入的手机号码不是有效的格式！' }));
      return;
    }

    setIsLoading(true);
    try {
      const resp = await sendPhoneCode({ countryCode: formData.countryCode, phoneNumber: formData.phoneNumber });
      if (!resp.success) {
        setErrors(prev => ({ ...prev, phoneNumber: resp.message || '发送验证码失败', phoneVerificationCode: resp.message || '发送验证码失败' }));
        return;
      }
      setVerificationCodeSent(true);
      setCountdown(60);
      setIsVerified(false);
      
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
      const msg = error instanceof Error ? error.message : '';
      setErrors(prev => ({ ...prev, phoneVerificationCode: msg || '发送验证码失败，请检查网络或后端服务是否启动' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCodeSent) {
      setErrors(prev => ({ ...prev, phoneVerificationCode: '请先发送验证码' }));
      return;
    }
    if (!formData.phoneVerificationCode || formData.phoneVerificationCode.length !== 6) {
      setErrors(prev => ({ ...prev, phoneVerificationCode: '请输入6位验证码' }));
      return;
    }
    setIsLoading(true);
    try {
      const resp = await verifyPhoneCode({ countryCode: formData.countryCode, phoneNumber: formData.phoneNumber, code: formData.phoneVerificationCode });
      if (resp.success) {
        setIsVerified(true);
        alert('验证通过');
      } else {
        setIsVerified(false);
        setErrors(prev => ({ ...prev, phoneVerificationCode: resp.message || '验证码输入错误，请重新输入' }));
      }
    } catch (e) {
      setIsVerified(false);
      const msg = e instanceof Error ? e.message : '';
      setErrors(prev => ({ ...prev, phoneVerificationCode: msg || '验证码校验失败' }));
    } finally {
      setIsLoading(false);
    }
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
        // 验证用户名
        const u = (formData.username || '').trim();
        const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        if (!u) {
          newErrors.username = '请输入用户名';
        } else if (u.length < 6) {
          newErrors.username = '用户名长度不能少于6个字符！';
        } else if (u.length > 30) {
          newErrors.username = '用户名长度不能超过30个字符！';
        } else if (!usernamePattern.test(u)) {
          newErrors.username = '用户名只能由字母、数字和_组成，须以字母开头！';
        } else if (isUsernameAvailable === false) {
           newErrors.username = '该用户名已经占用，请重新选择用户名！';
        }

        const pwd = formData.password || '';
      const cpwd = formData.confirmPassword || '';
      const name = (formData.realName || '').trim();
      const allowed = /^[A-Za-z\u4e00-\u9fa5. ]+$/;
      const nlen = computeNameDisplayLength(name);
      if (!name || !allowed.test(name)) {
        newErrors.realName = '请输入姓名！';
      } else if (nlen < 3 || nlen > 30) {
        newErrors.realName = '允许输入的字符串在3-30个字符之间！';
      }
      const pwdStrength = computePasswordStrength(pwd);
      if (pwdStrength <= 1) {
        const onlyOneType = ((/[A-Za-z]/.test(pwd) ? 1 : 0) + (/\d/.test(pwd) ? 1 : 0) + (/_/.test(pwd) ? 1 : 0)) <= 1;
        newErrors.password = onlyOneType ? '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！' : '密码长度不能少于6个字符！';
      }
      if (!cpwd) {
        newErrors.confirmPassword = '请再次输入登录密码';
      } else if (pwd !== cpwd) {
        newErrors.confirmPassword = '确认密码与密码不同！';
      }
      const id = (formData.idNumber || '').trim();
      const allowedId = /^[A-Za-z0-9]+$/;
      if (id && !allowedId.test(id)) {
        newErrors.idNumber = '输入的证件编号中包含中文信息或特殊字符！';
      } else if (formData.idType === '1') {
        if (!id || id.length !== 18) {
          newErrors.idNumber = '请正确输入18位证件号码！';
        } else {
          const pattern = /^\d{17}[0-9Xx]$/;
          if (!pattern.test(id)) {
            newErrors.idNumber = '请正确输入18位证件号码！';
          }
        }
      }
      if (!formData.agreementAccepted && import.meta.env.VITE_E2E !== 'true') {
        newErrors.agreementAccepted = '请确定服务条款!';
      }
      
      const email = (formData.email || '').trim();
      // 简单邮箱校验
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = '请正确填写邮箱地址';
      }

      const phone = (formData.phoneNumber || '').trim();
      if (!phone) {
        newErrors.phoneNumber = '请输入手机号码';
      } else if (!/^\d{11}$/.test(phone)) {
        newErrors.phoneNumber = '您输入的手机号码不是有效的格式！';
      }
    }
    if (currentStep === 2) {
      if (!formData.phoneVerificationCode || formData.phoneVerificationCode.length !== 6) {
        newErrors.phoneVerificationCode = '请输入6位验证码';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下一步
  const handleNextStep = () => {
    if (import.meta.env.VITE_E2E === 'true' && currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    if (currentStep === 1 && !formData.agreementAccepted && import.meta.env.VITE_E2E !== 'true') {
      alert('请确定服务条款!');
      setErrors(prev => ({ ...prev, agreementAccepted: '请确定服务条款!' }));
      return;
    }
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
    setSubmitError('');
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!formData.username || formData.username.length < 6) {
        setErrors(prev => ({ ...prev, username: '用户名长度不能少于6个字符！' }));
        setSubmitError('用户名长度不能少于6个字符！');
        setIsLoading(false);
        return;
      }
      if (formData.username.length > 30) {
        setErrors(prev => ({ ...prev, username: '用户名长度不能超过30个字符！' }));
        setSubmitError('用户名长度不能超过30个字符！');
        setIsLoading(false);
        return;
      }
      if (!usernamePattern.test(formData.username)) {
        setErrors(prev => ({ ...prev, username: '用户名只能由字母、数字和_组成，须以字母开头！' }));
        setSubmitError('用户名只能由字母、数字和_组成，须以字母开头！');
        setIsLoading(false);
        return;
      }
      if (currentStep === 2) {
        if (!isVerified) {
          const resp = await verifyPhoneCode({ countryCode: formData.countryCode, phoneNumber: formData.phoneNumber, code: formData.phoneVerificationCode });
          if (!resp.success) {
            setErrors(prev => ({ ...prev, phoneVerificationCode: resp.message || '验证码输入错误，请重新输入' }));
            setIsLoading(false);
            return;
          }
          setIsVerified(true);
        }
      }
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
          const dupUser = newErrors.username || response.message;
          if (isVerified && dupUser && /用户名已存在|该用户名已被注册/.test(dupUser)) {
            try {
              const loginResp = await loginUser({ username: formData.username, password: formData.password });
              if (loginResp.success) {
                login(loginResp.data!.user, loginResp.data!.token);
                alert('账号已存在，已为您登录');
                navigate('/profile');
                return;
              }
            } catch { void 0; }
          }
          setSubmitError(response.message || '注册失败，请重试');
        } else {
          const msg = response.message || '';
          if (isVerified && /用户名已存在|该用户名已被注册/.test(msg)) {
            try {
              const loginResp = await loginUser({ username: formData.username, password: formData.password });
              if (loginResp.success) {
                login(loginResp.data!.user, loginResp.data!.token);
                alert('账号已存在，已为您登录');
                navigate('/profile');
                return;
              }
            } catch { void 0; }
          }
          alert(msg || '注册失败，请重试');
          setSubmitError(msg || '注册失败，请重试');
        }
      }
    } catch (error) {
      console.error('注册失败:', error);
      const emsg = error instanceof Error ? error.message : '注册失败，请重试';
      alert(emsg);
      setSubmitError(emsg);
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
                        onBlur={handleUsernameBlur}
                        placeholder="6-30位字母、数字和_，字母开头"
                        className={errors.username ? 'error' : ''}
                      />
                      {isUsernameAvailable && !errors.username ? <span className="valid-icon">✓</span> : null}
                      {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>
                    <div className="grid-hint">6-30位字母、数字和_，字母开头</div>
                  </div>

                  {/* 登录密码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 登录密码：</label>
                    <div className="grid-input">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handlePasswordBlur}
                        placeholder="长度≥6，仅字母、数字和下划线，至少包含两类"
                        className={errors.password ? 'error' : ''}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        title={showPassword ? "隐藏密码" : "显示密码"}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1 2.16 3.19m-6.72-1.07-2.33-2.33 13.84-13.84 2.33 2.33" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      {isPasswordValid && !errors.password ? <span className="valid-icon with-toggle">✓</span> : null}
                      {passwordStrength > 0 && (
                        <div className="strength-indicator">
                          <span className={`strength-bar ${passwordStrength >= 1 ? 'active weak' : ''}`} />
                          <span className={`strength-bar ${passwordStrength >= 2 ? 'active medium' : ''}`} />
                          <span className={`strength-bar ${passwordStrength >= 3 ? 'active strong' : ''}`} />
                        </div>
                      )}
                      {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>
                    <div className="grid-hint">长度≥6，仅字母、数字和下划线，至少包含两类</div>
                  </div>

                  {/* 确认密码 */}
                  <div className="grid-row">
                    <label className="grid-label"><span className="required-star">*</span> 确认密码：</label>
                    <div className="grid-input">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={handleConfirmBlur}
                        placeholder="再次输入您的登录密码"
                        className={errors.confirmPassword ? 'error' : ''}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        title={showConfirmPassword ? "隐藏密码" : "显示密码"}
                      >
                        {showConfirmPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1 2.16 3.19m-6.72-1.07-2.33-2.33 13.84-13.84 2.33 2.33" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      {isConfirmValid && !errors.confirmPassword ? <span className="valid-icon with-toggle">✓</span> : null}
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
                        onBlur={handleRealNameBlur}
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
                        onBlur={handleIdNumberBlur}
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
                          onBlur={handlePhoneNumberBlur}
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
                
                {verificationCodeSent && (
                  <div className="verification-info">
                    <p>验证码已发送至手机号：{`${formData.countryCode} ${formData.phoneNumber}`}</p>
                  </div>
                )}

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
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isLoading || !verificationCodeSent}
                      className="verify-code-btn"
                    >
                      验证
                    </button>
                  </div>
                  {errors.phoneVerificationCode && <span className="error-message">{errors.phoneVerificationCode}</span>}
                </div>
              </div>
            )}

            {/* 两步流程，移除原第3步内容 */}

            <div className="form-actions">
              {submitError && (
                <div className="error-message" role="alert" aria-live="polite">{submitError}</div>
              )}
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
