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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config as any).metadata = { startTime: new Date() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duration = new Date().getTime() - (response.config as any).metadata.startTime.getTime();
    if (duration > 4000 && !isColdStartNotified) {
      Notify.create({
        type: 'info',
        message: '後端可能剛從休眠中喚醒，請稍候...',
        timeout: 3000,
      });
      isColdStartNotified = true;
      setTimeout(() => {
        isColdStartNotified = false;
      }, 10000); // 避免短時間內重複跳提示
    }
    return response;
  },
  (error) => {
    // 同樣處理錯誤也記得判斷時間
    const duration = new Date().getTime() - error.config.metadata.startTime.getTime();
    if (duration > 4000 && !isColdStartNotified) {
      Notify.create({
        type: 'info',
        message: '後端回應逾時，可能正在喚醒中...',
        timeout: 3000,
      });
      isColdStartNotified = true;
      setTimeout(() => {
        isColdStartNotified = false;
      }, 10000);
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
