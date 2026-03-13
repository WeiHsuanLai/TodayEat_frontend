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
let isColdStartNotified = false; // 防止重複提示後端冷啟動
const retryCount = new WeakMap<InternalAxiosRequestConfig, number>();

export const api = axios.create({
  baseURL: import.meta.env.VITE_API || 'https://api.example.com',
  withCredentials: true,
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

// 攔截回應：處理 401、冷啟動、重試
api.interceptors.response.use(
  (response) => {
    // 冷啟動偵測 (回應時間過長但成功)
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = new Date().getTime() - startTime.getTime();
      if (duration > 2000 && !isColdStartNotified) {
        Notify.create({
          type: 'info',
          message: '後端可能剛從休眠中喚醒，請稍候...',
          timeout: 3000,
        });
        isColdStartNotified = true;
        setTimeout(() => (isColdStartNotified = false), 10000);
      }
    }
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
        });
        await userStore.logout(true);
        void router.push('/login');
      }

      setTimeout(() => {
        isHandling401 = false;
      }, 1000);
    }

    // 2. 處理逾時/冷啟動 retry
    const startTime = config?.metadata?.startTime;
    if (startTime) {
      const duration = new Date().getTime() - startTime.getTime();
      if (duration > 4000 && !isColdStartNotified) {
        Notify.create({
          type: 'info',
          message: '後端回應逾時，可能正在喚醒中...',
          timeout: 3000,
        });
        isColdStartNotified = true;
        setTimeout(() => (isColdStartNotified = false), 10000);
      }
    }

    // 重試邏輯 (retry 1 次)
    if (config) {
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
