import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

interface LoginFormData {
  username: string;
  password: string;
  captcha: string;
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
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    captcha: '',
    rememberUsername: false,
    autoLogin: false
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 验证用户名格式
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[A-Za-z]{1}([A-Za-z0-9]|[_]){0,29}$/;
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

  // 刷新验证码
  const refreshCaptcha = () => {
    // 模拟验证码刷新
    const timestamp = new Date().getTime();
    setCaptchaImage(`https://kyfw.12306.cn/passport/captcha/captcha-image?login_site=E&module=login&rand=sjrand&${timestamp}`);
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名或邮箱';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = '用户名格式不正确（6-30位字母、数字或"_"，字母开头）或邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少6位字符';
    }

    if (!formData.captcha.trim()) {
      newErrors.captcha = '请输入验证码';
    }

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
        navigate('/');
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
      alert(error.message || '登录失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化验证码
  React.useEffect(() => {
    refreshCaptcha();
  }, []);

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo">
          <img src="/logo.png" alt="12306" />
          <span>中国铁路12306</span>
        </div>
        <nav className="login-nav">
          <a href="/">首页</a>
          <a href="/help">帮助中心</a>
        </nav>
      </div>

      <div className="login-main">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>用户登录</h2>
            <p>登录12306账户，享受便捷购票服务</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">用户名/邮箱</label>
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
              <label htmlFor="password">密码</label>
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

            <div className="form-group captcha-group">
              <label htmlFor="captcha">验证码</label>
              <div className="captcha-container">
                <input
                  type="text"
                  id="captcha"
                  name="captcha"
                  value={formData.captcha}
                  onChange={handleInputChange}
                  placeholder="请输入验证码"
                  className={errors.captcha ? 'error' : ''}
                />
                <div className="captcha-image-container">
                  <img 
                    src={captchaImage} 
                    alt="验证码" 
                    onClick={refreshCaptcha}
                    className="captcha-image"
                  />
                  <button 
                    type="button" 
                    onClick={refreshCaptcha}
                    className="refresh-captcha"
                  >
                    刷新
                  </button>
                </div>
              </div>
              {errors.captcha && <span className="error-message">{errors.captcha}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberUsername"
                  checked={formData.rememberUsername}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                记住用户名
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="autoLogin"
                  checked={formData.autoLogin}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                自动登录
              </label>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>

            <div className="form-links">
              <a href="/forgot-username">忘记用户名？</a>
              <a href="/forgot-password">忘记密码？</a>
              <button 
                type="button" 
                onClick={onNavigateToRegister}
                className="register-link"
              >
                立即注册
              </button>
            </div>
          </form>
        </div>

        <div className="login-info">
          <div className="info-section">
            <h3>温馨提示</h3>
            <ul>
              <li>为了您的账户安全，请不要在网吧等公共场所登录</li>
              <li>如果您忘记了用户名或密码，可以通过邮箱或手机号找回</li>
              <li>建议您定期修改密码，提高账户安全性</li>
              <li>登录遇到问题？请联系客服：12306</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>安全登录</h3>
            <div className="security-features">
              <div className="security-item">
                <span className="security-icon">🔒</span>
                <span>SSL加密传输</span>
              </div>
              <div className="security-item">
                <span className="security-icon">🛡️</span>
                <span>多重安全验证</span>
              </div>
              <div className="security-item">
                <span className="security-icon">📱</span>
                <span>手机短信验证</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-footer">
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

export default Login;