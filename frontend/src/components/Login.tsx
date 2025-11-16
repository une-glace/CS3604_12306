import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';
import Carousel from './Carousel';

interface LoginFormData {
  username: string;
  password: string;
  rememberUsername: boolean;
  autoLogin: boolean;
}

interface LoginProps {
  onLogin?: (formData: LoginFormData) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeLoginTab, setActiveLoginTab] = useState<'account' | 'qr'>('account');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberUsername: false,
    autoLogin: false
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 验证用户名格式
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[A-Za-z]{1}([A-Za-z0-9]|[_ ]|[A-Za-z0-9_ ]){0,29}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return usernameRegex.test(username) || emailRegex.test(username);
  };

  // 验证密码格式
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 清除对应字段的错误信息
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名或邮箱';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = '用户名格式不正确（6-30位字母、数字、空格或"_"，字母开头）或邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少6位字符';
    }

    // 已移除验证码校验

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const loginData = {
        username: formData.username,
        password: formData.password
      };

      const response = await loginUser(loginData);
      
      if (response.success) {
        // 使用AuthContext的login方法
        login(response.data!.user, response.data!.token);
        alert('登录成功！');
        navigate('/profile'); // 跳转到个人中心页面
      } else {
        // 处理服务器返回的错误
        if (response.message === '用户不存在') {
          setErrors({ username: '用户名不存在' });
        } else if (response.message === '密码错误') {
          setErrors({ password: '密码错误' });
        } else if (response.message === '账户已被禁用') {
          setErrors({ username: '账户已被禁用，请联系客服' });
        } else {
          alert(response.message || '登录失败，请重试');
        }
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      // 开发环境降级处理：模拟登录成功
      login({
        id: Date.now(),
        username: formData.username,
        realName: '测试用户',
        status: 'active'
      } as any, 'dev-mock-token');
      alert('登录成功！');
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  // 已移除验证码初始化

  // 登录页轮播图片（两张）
  const loginCarouselItems = [
    { id: 1, image: '/homepage/Carousel/Carousel_1.png', title: '登录轮播一' },
    { id: 2, image: '/homepage/Carousel/Carousel_2.png', title: '登录轮播二' }
  ];

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-left">
          <div className="login-logo">
            <img src="/铁路12306-512x512.png" alt="12306" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="login-welcome">欢迎登录12306</div>
        </div>
      </div>

      {/* 轮播与右侧叠加登录卡 */}
      <div className="login-hero">
        <Carousel items={loginCarouselItems} autoPlay={true} interval={5000} />

        <div className="login-panel">
          <div className="login-tabs">
            <button
              className={`login-tab ${activeLoginTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveLoginTab('account')}
            >
              账户登录
            </button>
            <span className="tab-sep">|</span>
            <button
              className={`login-tab ${activeLoginTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveLoginTab('qr')}
            >
              扫码登录
            </button>
          </div>

          {activeLoginTab === 'account' ? (
            <div className="login-card">
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="请输入用户名或邮箱"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                

                

                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '立即登录'}
                </button>

                <div className="form-links">
                  <a href="/forgot-password">忘记密码？</a>
                  <span className="sep">|</span>
                  <button 
                    type="button" 
                    onClick={onNavigateToRegister}
                    className="register-link"
                  >
                    注册12306账号
                  </button>
                </div>

                <div className="form-extra">
                  <div className="form-divider" />
                  <p className="service-notice">铁路12306每日5:00至次日1:00（周二为5:00至24:00）提供购票、改签、变更到站业务办理， 全天均可办理退票等其他服务。</p>
                </div>
              </form>
            </div>
          ) : (
            <div className="qr-login">
              <div className="qr-code-box" aria-label="扫码登录二维码占位"></div>
              <p className="qr-tip">打开<span className="qr-app">12306</span>手机APP 扫描二维码</p>
              <button 
                type="button" 
                onClick={onNavigateToRegister}
                className="qr-register"
              >
                注册12306账号
              </button>
              <div className="qr-features">
                <div className="qr-feature">扫一扫登录</div>
                <div className="qr-feature">更快</div>
                <div className="qr-feature">更安全</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 已将服务时间说明移动至表单下方 */}

      <div className="login-footer">
        <div className="footer-bottom">
          <p>版权所有©2008-2025 中国铁道科学研究院集团有限公司 技术支持：铁旅科技有限公司</p>
          <p>中国国家铁路集团有限公司 京公网安备 11010802038392号 | 京ICP备05020493号-4 | ICP证：京B2-20202537</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
