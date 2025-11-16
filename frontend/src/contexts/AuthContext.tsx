import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User } from '../types/user';
import { getCurrentUser, logoutUser, isAuthenticated } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 登录函数
  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
  };

  // 登出函数
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        // Token可能已过期，清除认证信息
        setUser(null);
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUser(null);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化时检查用户登录状态
  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook用于使用AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};