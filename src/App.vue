<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import { setupApiContext, systemApi, userApi } from 'src/api';
import { Notify, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();
userStore.restore();
// 設定 axios 攔截上下文
setupApiContext(
  () => userStore,
  () => router,
);

onMounted(async () => {
  // 開啟時先做健康檢查康檢查
  const start = Date.now();
  try {
    await systemApi.checkHealth();
    const duration = Date.now() - start;
    if (duration > 4000) {
      Notify.create({
        type: 'info',
        message: '⚠️ 後端可能正在從休眠中喚醒，請稍候...',
        timeout: 3000,
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: '⚠️ 無法連接伺服器，部分功能可能無法使用',
    });
    setTimeout(() => {
      void router.replace('/not-found');
    }, 300);
  }

  // 還原本地 token
  await nextTick();

  if (userStore.token) {
    try {
      const res = await userApi.getCurrentUser({
        _skip401Handler: true,
      } as AxiosRequestConfig);
      const user = res.data.user;

      // 如果 user.avatar 存在才用，否則維持原 avatar，不覆寫
      void userStore.setUser({
        username: user.account,
        role: user.role as number,
        avatar: user.avatar?.trim() || userStore.avatar,
        token: userStore.token,
      });
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
});
</script>
