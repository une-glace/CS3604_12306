const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

// API请求配置
const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 通用请求函数
const request = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...apiConfig.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// GET请求
export const get = (url: string) => request(url, { method: 'GET' });

// POST请求
export const post = (url: string, data?: any) =>
  request(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

// PUT请求
export const put = (url: string, data?: any) =>
  request(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

// DELETE请求
export const del = (url: string) => request(url, { method: 'DELETE' });

// 设置认证token
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// 清除认证token
export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

// 获取认证token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};
