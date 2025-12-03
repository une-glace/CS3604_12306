import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loginUser } from '../services/auth';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, refreshUser } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser({
        username: formData.username,
        password: formData.password
      });
      
      if (response.success && response.data) {
        // 调用AuthContext的login函数来更新全局状态
        login(response.data.user, response.data.token);
        // 刷新用户状态以确保同步
        await refreshUser();
        // 登录成功
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError(response.message || '登录失败，请重试');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败，请重试';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <div className="login-modal-header">
          <h3>请先登录</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="login-modal-content">
          <p className="login-prompt">您尚未登录，请先登录后再进行预订</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="modal-username">用户名</label>
              <input
                id="modal-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="modal-password">密码</label>
              <input
                id="modal-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                disabled={isLoading}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onClose}
                disabled={isLoading}
              >
                取消
              </button>
              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
          
          <div className="register-link">
            <span>还没有账号？</span>
            <a href="/register" target="_blank">立即注册</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
