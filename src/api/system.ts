// src/api/system.ts
import { api } from './client';
import type { AxiosRequestConfig } from 'axios';

export const systemApi = {
  /**
   * 健康檢查 (用於偵測伺服器是否喚醒)
   */
  checkHealth() {
    return api.get('/health', {
      _skip401Handler: true,
    } as AxiosRequestConfig);
  }
};
