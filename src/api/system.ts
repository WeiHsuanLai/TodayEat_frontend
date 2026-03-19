// src/api/system.ts
import { api } from './client';
import { z } from 'zod';

export const VisitorCountResponseSchema = z.object({
  success: z.boolean(),
  visitorCount: z.number(),
});

export type VisitorCountResponse = z.infer<typeof VisitorCountResponseSchema>;

export const systemApi = {
  /**
   * 伺服器健康檢查
   */
  checkHealth() {
    return api.get('/health');
  },

  /**
   * 獲取今日訪客數
   */
  getVisitorCount() {
    return api.get<VisitorCountResponse>('/health/visitor-count').then((res) => {
      VisitorCountResponseSchema.parse(res.data);
      return res;
    });
  },
};
