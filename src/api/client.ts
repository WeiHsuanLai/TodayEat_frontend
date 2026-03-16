// src/api/client.ts
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { Notify } from 'quasar';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: Date;
    };
    _skip401Handler?: boolean;
  }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let getUserStore: () => ReturnType<typeof import('src/stores/userStore').useUserStore>;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let getRouter: () => ReturnType<typeof import('vue-router').useRouter>;

let isHandling401 = false; // 防止多次觸發 logout
const retryCount = new WeakMap<InternalAxiosRequestConfig, number>();

export const api = axios.create({
  baseURL: import.meta.env.VITE_API || 'https://api.example.com',
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
});

// 攔截請求：注入 Token 與記錄時間
api.interceptors.request.use((config) => {
  // 記錄開始時間用於判斷冷啟動
  config.metadata = { startTime: new Date() };

  try {
    const userStore = getUserStore?.();
    const token = userStore?.token;

    if (typeof token === 'string' && token.trim()) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[Axios interceptor] localStorage token 解析失敗', e);
  }
  return config;
});

// 攔截回應：處理 401、重試
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config as InternalAxiosRequestConfig | undefined;

    // 1. 處理 401 權限過期
    if (
      status === 401 &&
      getUserStore &&
      getRouter &&
      !isHandling401 &&
      config?._skip401Handler !== true
    ) {
      isHandling401 = true;
      const userStore = getUserStore();
      const router = getRouter();

      if (userStore.isLoggedIn) {
        Notify.create({
          type: 'negative',
          message: '登入憑證已過期，已自動登出',
          position: 'bottom',
        });
        await userStore.logout(true);
        void router.push('/login');
      }

      setTimeout(() => {
        isHandling401 = false;
      }, 1000);
    }

    // 重試邏輯 (retry 1 次)
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isNetworkError = !status && error.message === 'Network Error'; // 通常是 ERR_CONNECTION_REFUSED

    if (config && !isTimeout && !isNetworkError) {
      const currentRetry = retryCount.get(config) || 0;
      if (currentRetry < 1 && (status === 503 || !status)) {
        // 503 或網路錯誤可能是正在喚醒
        retryCount.set(config, currentRetry + 1);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return api(config);
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);

/**
 * 在 App.vue 中初始化，避免與 store/router 產生循環引用
 */
export function setupApiContext(userStoreFn: typeof getUserStore, routerFn: typeof getRouter) {
  getUserStore = userStoreFn;
  getRouter = routerFn;
}

/**
 * 給組件使用的 Hook 風格
 */
export const useApi = () => {
  return { api };
};

/**
 * 手動設定 Authorization Header (例如登入成功後)
 */
export function setAuthorization(token: string) {
  if (token && token.trim()) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
