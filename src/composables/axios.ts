// src/composables/axios.ts
import axios from 'axios';
import { Notify } from 'quasar';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let getUserStore: () => ReturnType<typeof import('src/stores/userStore').useUserStore>;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let getRouter: () => ReturnType<typeof import('vue-router').useRouter>;

let isHandling401 = false; // 防止多次觸發 logout

export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
});

// 🔐 自動附上 Authorization Header（如果存在 token）
api.interceptors.request.use((config) => {
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

// 攔截器：處理 token 過期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extendedConfig = config as Record<string, any>;
    if (
      status === 401 &&
      getUserStore &&
      getRouter &&
      !isHandling401 &&
      extendedConfig._skip401Handler !== true
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
        isHandling401 = false; // 避免一直鎖住
      }, 1000);
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  },
);

// 必須在 App.vue 或 MainLayout 中 setup() 初始化
export function setupApiContext(userStoreFn: typeof getUserStore, routerFn: typeof getRouter) {
  getUserStore = userStoreFn;
  getRouter = routerFn;
}

// 提供給組件使用
export const useApi = () => {
  return { api };
};

// 可為 axios 加上即時 header
export function setAuthorization(token: string) {
  if (token && token.trim()) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
