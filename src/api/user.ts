// src/api/user.ts
import type { AxiosRequestConfig } from 'axios';
import { api } from './client';
import { z } from 'zod';

export const UserSchema = z.object({
  account: z.string().optional().default(''),
  username: z.string().optional().default(''),
  email: z.string().email().optional(),
  role: z.number().nullable().default(0),
  avatar: z.string().optional().default(''),
  token: z.string().optional().default(''),
});

export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string(),
  iat: z.string(),
  exp: z.string(),
  loginType: z.enum(['normal', 'google']),
  user: UserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const LoginLogSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  action: z.string(),
  ip: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
  account: z.string(),
  email: z.string().email().optional(),
  role: z.number().optional(),
});

export type LoginLog = z.infer<typeof LoginLogSchema>;

export const LoginParamsSchema = z.object({
  account: z.string(),
  password: z.string().optional(),
  captcha: z.string().optional(),
});

export type LoginParams = z.infer<typeof LoginParamsSchema>;

export const RegisterParamsSchema = z.object({
  account: z.string(),
  password: z.string().optional(),
  email: z.string().email().optional(),
});

export type RegisterParams = z.infer<typeof RegisterParamsSchema>;

export const ChangePasswordParamsSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export type ChangePasswordParams = z.infer<typeof ChangePasswordParamsSchema>;

export const UploadAvatarResponseSchema = z.object({
  url: z.string().url(),
  public_id: z.string(),
});

export type UploadAvatarResponse = z.infer<typeof UploadAvatarResponseSchema>;

export const userApi = {
  /**
   * 登入
   */
  login(data: LoginParams) {
    return api.post<LoginResponse>('/user/login', data).then((res) => {
      // 執行時期驗證：確保登入回傳的資料結構符合預期
      LoginResponseSchema.parse(res.data);
      return res;
    });
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
    return api.get<{ user: User }>('/user/getCurrentUser', config).then((res) => {
      // 執行時期驗證：確保獲取到的使用者資料結構不漏欄位
      z.object({ user: UserSchema }).parse(res.data);
      return res;
    });
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
  },

  /**
   * 上傳大頭貼
   */
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<UploadAvatarResponse>('/upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => {
        UploadAvatarResponseSchema.parse(res.data);
        return res;
      });
  },
};
