import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { Notify } from 'quasar';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({ baseURL: 'https://api.example.com' });

// 判斷用來避免連續出現多次提示
let isColdStartNotified = false;

api.interceptors.request.use((config) => {
  // 標記開始時間
  console.log('[API Request 發出]', config.method?.toUpperCase(), config.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config as any).metadata = { startTime: new Date() };
  return config;
});

const retryCount = new WeakMap();

api.interceptors.response.use(
  (response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duration = new Date().getTime() - (response.config as any).metadata.startTime.getTime();
    if (duration > 2000 && !isColdStartNotified) {
      Notify.create({
        type: 'info',
        message: '後端可能剛從休眠中喚醒，請稍候...',
        timeout: 3000,
      });
      isColdStartNotified = true;
      setTimeout(() => (isColdStartNotified = false), 10000);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const duration = new Date().getTime() - config.metadata.startTime.getTime();

    if (duration > 4000 && !isColdStartNotified) {
      Notify.create({
        type: 'info',
        message: '後端回應逾時，可能正在喚醒中...',
        timeout: 3000,
      });
      isColdStartNotified = true;
      setTimeout(() => (isColdStartNotified = false), 10000);
    }

    // --- 加入 retry 一次的邏輯 ---
    const currentRetry = retryCount.get(config) || 0;
    if (currentRetry < 1) {
      retryCount.set(config, currentRetry + 1);
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待 3 秒再重試
      return api(config); // retry 原始請求
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  },
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
