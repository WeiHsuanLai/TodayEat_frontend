import { z } from 'zod';

const envSchema = z.object({
  VITE_API: z.string().url('VITE_API 必須是有效的 URL 格式，包含 http(s)').or(z.string().min(1, 'VITE_API 不得為空')),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_GOOGLE_MAP_ID: z.string().optional(),
  // 若有其他 Vite 內建變數 (如 MODE, PROD, DEV) 也可以在這裡加，但通常可忽略
});

// 解析環境變數。如果有錯誤，Zod 會直接 throw error 並且有詳細的錯誤訊息，讓開發者馬上知道少了哪個變數。
export const env = envSchema.parse(import.meta.env);
