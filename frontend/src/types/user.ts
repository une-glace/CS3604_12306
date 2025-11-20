// 用户接口定义
export interface User {
  id: number;
  username: string;
  realName: string;
  idType: string;
  idNumber: string;
  email?: string;
  phoneNumber: string;
  countryCode?: string;
  passengerType: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

// 注册数据接口
export interface RegisterData {
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

// 登录数据接口
export interface LoginData {
  username: string;
  password: string;
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

// 认证响应接口
export interface AuthResponse {
  user: User;
  token: string;
}