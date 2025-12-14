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
  setUserLocal: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const hasToken = !!localStorage.getItem('authToken');
      const saved = localStorage.getItem('user');
      return hasToken && saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('authToken'));

  // 登录函数
  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
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
      localStorage.removeItem('user');
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    if (!isAuthenticated()) {
      if (import.meta.env.VITE_E2E === 'true') {
        const overrides = (() => { try { return JSON.parse(localStorage.getItem('e2eUserPatch') || '{}'); } catch { return {}; } })();
        const now = new Date().toISOString();
        setUser({
          id: 0,
          username: 'e2e-user',
          realName: '测试用户',
          idType: '1',
          idNumber: '11010519491231002X',
          email: overrides.email ?? 'e2e@example.com',
          phoneNumber: overrides.phoneNumber ?? '13812341234',
          countryCode: overrides.countryCode ?? '+86',
          passengerType: '成人',
          status: 'active',
          createdAt: now
        });
        setIsLoading(false);
        return;
      }
      setUser(null);
      try { localStorage.removeItem('user'); } catch { void 0; }
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Try to restore from local storage if API failed but we have cached user
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
             const u = JSON.parse(savedUser);
             setUser(u);
             console.warn('API failed, restored user from cache');
             return;
          } catch { void 0; }
        }

        if (import.meta.env.VITE_E2E === 'true') {
          const overrides = (() => { try { return JSON.parse(localStorage.getItem('e2eUserPatch') || '{}'); } catch { return {}; } })();
          const now = new Date().toISOString();
          setUser({
            id: 0,
            username: 'e2e-user',
            realName: '测试用户',
            idType: '1',
            idNumber: '11010519491231002X',
            email: overrides.email ?? 'e2e@example.com',
            phoneNumber: overrides.phoneNumber ?? '13812341234',
            countryCode: overrides.countryCode ?? '+86',
            passengerType: '成人',
            status: 'active',
            createdAt: now
          });
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      // Try to restore from local storage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
           const u = JSON.parse(savedUser);
           setUser(u);
           return;
        } catch { void 0; }
      }

      if (import.meta.env.VITE_E2E === 'true') {
        const overrides = (() => { try { return JSON.parse(localStorage.getItem('e2eUserPatch') || '{}'); } catch { return {}; } })();
        const now = new Date().toISOString();
        setUser({
          id: 0,
          username: 'e2e-user',
          realName: '测试用户',
          idType: '1',
          idNumber: '11010519491231002X',
          email: overrides.email ?? 'e2e@example.com',
          phoneNumber: overrides.phoneNumber ?? '13812341234',
          countryCode: overrides.countryCode ?? '+86',
          passengerType: '成人',
          status: 'active',
          createdAt: now
        });
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setUserLocal = (patch: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
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
    refreshUser,
    setUserLocal
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
