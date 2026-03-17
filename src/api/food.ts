// src/api/food.ts
import { unref } from 'vue';
import { i18n } from 'src/boot/i18n';
import { api } from './client';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * 獲取當前 API 要求的語系代碼 (zh 或 en)
 */
function getApiLng() {
  // 使用 unref 安全地獲取 i18n.global.locale 的值 (不論是 ref 或字串)
  const lang = unref(i18n.global.locale) as string;
  return lang.startsWith('zh') ? 'zh' : 'en';
}

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
    return api.get<ApiResponse<string[]>>(`/dishes/categories?lng=${getApiLng()}`);
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
      const val = category.name || category.label || category.value;
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
    return api.get<ApiResponse<Dish[]>>(`/dishes?category=${encodedCategory}&lng=${getApiLng()}`);
  },

  /**
   * 獲取今日抽取記錄
   */
  getTodayDraws() {
    return api.get<TodayDrawsResponse>(`/record/food-draw/today?lng=${getApiLng()}`);
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
    return api.get<MyFoodRecordsResponse>(`/food-records/my?lng=${getApiLng()}`);
  },

  /**
   * 刪除指定的抽取紀錄
   */
  deleteFoodRecord(id: string) {
    return api.delete(`/food-records/${id}`);
  },

  /**
   * 修改指定的抽取紀錄
   */
  updateFoodRecord(id: string, data: { dishName?: string; note?: string }) {
    return api.patch(`/food-records/${id}`, data);
  },

  /**
   * 獲取獎品清單
   * @param isLoggedIn 是否登入，決定呼叫 /user/custom-items 還是 /prizes
   */
  getPrizes(isLoggedIn: boolean) {
    const endpoint = isLoggedIn ? '/user/custom-items' : '/prizes';
    return api.get<PrizeItem[]>(`${endpoint}?lng=${getApiLng()}`);
  }
};
