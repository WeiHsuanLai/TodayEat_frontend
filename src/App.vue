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
  // 開啟時持續做健康檢查直到成功為止
  let dismissWakeUp: (() => void) | null = null;
  let isConnected = false;

  // 1 秒後如果還沒連上，才顯示提示
  const wakeUpTimer = setTimeout(() => {
    if (!isConnected) {
      dismissWakeUp = $q.notify({
        group: 'wake-up',
        type: 'info',
        message: '⚠️ 正在嘗試連線伺服器，請稍候...',
        timeout: 0,
        position: 'center',
      });
    }
  }, 1000);

  // 持續輪詢直到伺服器啟動
  while (!isConnected) {
    try {
      const res = await systemApi.checkHealth();
      if (res.status === 200) {
        isConnected = true;
      } else {
        // 如果不是 200，也要等待再重試
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch {
      // 伺服器尚未啟動或網路錯誤，等待 3 秒後重試
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // 清除計時器與提示
  clearTimeout(wakeUpTimer);
  if (typeof dismissWakeUp === 'function') {
    (dismissWakeUp as () => void)();
    $q.notify({
      type: 'positive',
      message: '✅ 伺服器已連線',
      timeout: 2000,
      position: 'center',
    });
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
