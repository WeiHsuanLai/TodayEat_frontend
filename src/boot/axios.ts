// src/boot/axios.ts
import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { api } from 'src/api/client';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

export default defineBoot(({ app }) => {
  // 用於 Options API: this.$axios 和 this.$api
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
