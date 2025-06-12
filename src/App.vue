<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import { api, setupApiContext } from 'src/composables/axios';
import { Notify, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();

// 設定 axios 攔截上下文
setupApiContext(
  () => userStore,
  () => router,
);

onMounted(async () => {
  userStore.restore(); // 還原本地 token
  await nextTick();

  if (userStore.token) {
    try {
      const res = await api.get('/user/me', {
        _skip401Handler: true,
      } as AxiosRequestConfig);
      userStore.setUser(res.data);
      return;
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        console.warn('🔒 Token 過期，清除本地登入狀態');
        await userStore.logout(true);
        void router.replace('/');
        Notify.create({
          type: 'negative',
          message: '登入憑證已過期，已自動登出',
        });
        return;
      }
      console.warn('驗證失敗', e);
    }
  }

  // 如果沒 token 或驗證失敗，再來做健康檢查
  try {
    await api.get('/health');
  } catch {
    $q.notify({
      type: 'negative',
      message: '⚠️ 無法連接伺服器，部分功能可能無法使用',
    });
    setTimeout(() => {
      void router.replace('/not-found');
    }, 300);
  }
});
</script>
