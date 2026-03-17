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

export interface FoodRecord {
  _id: string;
  userId: string;
  dishId?: string;
  dishName: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyFoodRecordsResponse {
  success: boolean;
  result: Record<string, FoodRecord[]>;
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
  }
};
