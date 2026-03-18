// src/api/user.ts
import type { AxiosRequestConfig } from 'axios';
import { api } from './client';

export interface User {
  account: string;
  username?: string;
  email?: string;
  role: number | null;
  avatar: string;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  iat: string;
  exp: string;
  loginType: 'normal' | 'google';
  user: User;
}

export interface LoginLog {
  _id: string;
  userId: string;
  action: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  account: string;
  email?: string;
  role?: number;
}

export interface LoginParams {
  account: string;
  password?: string;
  captcha?: string;
}

export interface RegisterParams {
  account: string;
  password?: string;
  email?: string;
}

export interface ChangePasswordParams {
  currentPassword?: string;
  newPassword?: string;
}

export const userApi = {
  /**
   * 登入
   */
  login(data: LoginParams) {
    return api.post<LoginResponse>('/user/login', data);
  },

  /**
   * Google 登入
   */
  googleLogin(data: { token: string }) {
    return api.post<LoginResponse>('/user/googleLogin', data);
  },

  /**
   * 註冊
   */
  register(data: RegisterParams) {
    return api.post<LoginResponse>('/user/register', data);
  },

  /**
   * 登出
   */
  logout() {
    return api.post('/user/logout');
  },

  /**
   * 獲取當前使用者資訊
   */
  getCurrentUser(config: AxiosRequestConfig = {}) {
    return api.get<{ user: User }>('/user/getCurrentUser', config);
  },

  /**
   * 修改密碼
   */
  changePassword(data: ChangePasswordParams) {
    return api.post('/user/change-password', data);
  },

  /**
   * 獲取登入日誌 (一般用戶)
   */
  getLoginLogs() {
    return api.get<{ success: boolean; logs: LoginLog[] }>('/user/login-logs');
  },

  /**
   * 獲取所有登入日誌 (管理員)
   */
  getAdminLoginLogs() {
    return api.get<{ success: boolean; logs: LoginLog[] }>('/admin/login-logs');
  }
};
