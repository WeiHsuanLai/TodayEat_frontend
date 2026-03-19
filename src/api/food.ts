// src/api/food.ts
import { api } from './client';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';

export const PrizeItemSchema = z.object({
  label: z.string(),
  items: z.array(z.string()),
});

export type PrizeItem = z.infer<typeof PrizeItemSchema>;

export const TodayDrawsResponseSchema = z.object({
  meals: z.record(z.string(), z.string().optional()).optional(),
});

export type TodayDrawsResponse = z.infer<typeof TodayDrawsResponseSchema>;

export const DishSchema = z.object({
  _id: z.string(),
  name: z.string(),
  category: z.string(),
  image: z.string(),
});

export type Dish = z.infer<typeof DishSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
  });

export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export const FoodRecordSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  dishId: z.string().optional(),
  dishName: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FoodRecord = z.infer<typeof FoodRecordSchema>;

export const MyFoodRecordsResponseSchema = z.object({
  success: z.boolean(),
  result: z.record(z.string(), z.array(FoodRecordSchema)),
});

export type MyFoodRecordsResponse = z.infer<typeof MyFoodRecordsResponseSchema>;

export const foodApi = {
  /**
   * 獲取所有菜色類別
   */
  getCategories() {
    return api.get<ApiResponse<string[]>>('/dishes/categories');
  },

  /**
   * 依類別獲取菜色
   */
  getDishesByCategory(
    category: string | Record<string, unknown> | null | undefined,
  ): Promise<AxiosResponse<ApiResponse<Dish[]>>> {
    // 處理 category 可能被傳入物件的情況 (例如 q-select 的結果)
    let categoryStr = '';
    if (typeof category === 'string') {
      categoryStr = category;
    } else if (category && typeof category === 'object') {
      // 嘗試從常見的屬性中取出字串值
      const val = category['name'] || category['label'] || category['value'];
      categoryStr = typeof val === 'string' ? val : '';
    } else {
      categoryStr = category ? String(category) : '';
    }

    if (!categoryStr) {
      // 若最終仍無分類，回傳空 Promise 結構符合 AxiosResponse
      return Promise.resolve({
        data: { success: true, data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown as InternalAxiosRequestConfig,
      } as AxiosResponse<ApiResponse<Dish[]>>);
    }

    const encodedCategory = encodeURIComponent(categoryStr);
    return api.get<ApiResponse<Dish[]>>(`/dishes?category=${encodedCategory}`);
  },

  /**
   * 獲取今日抽取記錄
   */
  getTodayDraws() {
    return api.get<TodayDrawsResponse>('/record/food-draw/today');
  },

  /**
   * 記錄抽取
   */
  recordDraw(meal: string, food: string) {
    return api.post('/record/food-draw', { meal, food });
  },

  /**
   * 記錄食物 (更新後支援手動輸入與備註)
   */
  recordFood(data: { dishName: string; note?: string }) {
    return api.post('/food-records', data);
  },

  /**
   * 獲取使用者的歷史抽取紀錄
   */
  getMyFoodRecords() {
    return api.get<MyFoodRecordsResponse>('/food-records/my');
  },

  /**
   * 刪除指定的抽取紀錄
   */
  deleteFoodRecord(id: string) {
    return api.delete(`/food-records/${id}`);
  },

  /**
   * 獲取獎品清單
   * @param isLoggedIn 是否登入，決定呼叫 /user/custom-items 還是 /prizes
   */
  getPrizes(isLoggedIn: boolean) {
    const endpoint = isLoggedIn ? '/user/custom-items' : '/prizes';
    return api.get<PrizeItem[]>(endpoint);
  },

  /**
   * 修改指定的抽取紀錄
   */
  updateFoodRecord(id: string, data: { dishName?: string; note?: string }) {
    return api.patch(`/food-records/${id}`, data);
  },
};
