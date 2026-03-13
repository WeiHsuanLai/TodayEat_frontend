// src/api/system.ts
import { api } from './client';

export const systemApi = {
  /**
   * 健康檢查 (用於偵測伺服器是否喚醒)
   */
  checkHealth() {
    return api.get('/health');
  }
};
