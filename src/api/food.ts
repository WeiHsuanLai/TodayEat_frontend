// src/api/food.ts
import { api } from './client';

export interface PrizeItem {
  label: string;
  items: string[];
}

export interface TodayDrawsResponse {
  meals?: Record<string, string | undefined>;
}

export interface Dish {
  _id: string;
  name: string;
  category: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

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
  getDishesByCategory(category: string) {
    return api.get<ApiResponse<Dish[]>>(`/dishes?category=${category}`);
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
   * 獲取獎品清單
   * @param isLoggedIn 是否登入，決定呼叫 /user/custom-items 還是 /prizes
   */
  getPrizes(isLoggedIn: boolean) {
    const endpoint = isLoggedIn ? '/user/custom-items' : '/prizes';
    return api.get<PrizeItem[]>(endpoint);
  }
};
