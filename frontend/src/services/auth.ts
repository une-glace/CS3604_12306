import { post, get, put, setAuthToken, clearAuthToken } from './api';
import { type User } from '../types/user';

// 登录数据接口
interface LoginData {
  username: string;
  password: string;
}

// 注册数据接口
interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  idType: string;
  realName: string;
  idNumber: string;
  email?: string;
  phoneNumber: string;
  countryCode?: string;
  passengerType: string;
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

// 认证响应接口
interface AuthResponse {
  user: User;
  token: string;
}

// 用户注册
export const registerUser = async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await post('/auth/register', userData);
    
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  } catch (error: any) {
    throw new Error(error.message || '注册失败');
  }
};

// 用户登录
export const loginUser = async (loginData: LoginData): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await post('/auth/login', loginData);
    
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  } catch (error: any) {
    throw new Error(error.message || '登录失败');
  }
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  try {
    const response = await get('/auth/me');
    return response;
  } catch (error: any) {
    throw new Error(error.message || '获取用户信息失败');
  }
};

// 更新个人信息（目前仅支持邮箱）
export const updateProfile = async (payload: { email?: string; phoneNumber?: string; countryCode?: string }): Promise<ApiResponse<{ email?: string; phoneNumber?: string; countryCode?: string }>> => {
  try {
    const response = await put('/auth/profile', payload);
    return response;
  } catch (error: any) {
    throw new Error(error.message || '更新个人信息失败');
  }
};

// 用户登出
export const logoutUser = async (): Promise<void> => {
  try {
    await post('/auth/logout');
  } catch (error) {
    console.error('登出请求失败:', error);
  } finally {
    clearAuthToken();
  }
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};
