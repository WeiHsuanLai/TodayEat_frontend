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
  // 開啟時先做健康檢查，若 1 秒內沒回應則顯示提示
  let dismissWakeUp = () => { /* 預設空函式 */ };
  let isNotified = false;
  let isTimedOut = false;

  const wakeUpTimer = setTimeout(() => {
    dismissWakeUp = $q.notify({
      group: 'wake-up',
      type: 'info',
      message: '⚠️ 後端可能正在從休眠中喚醒，請稍候...',
      timeout: 0,
      position: 'bottom',
    });
    isNotified = true;
  }, 1000);

  // 30 秒逾時處理
  const failTimer = setTimeout(() => {
    isTimedOut = true;
    if (isNotified) {
      dismissWakeUp();
      isNotified = false;
    }
    $q.notify({
      type: 'negative',
      message: '❌ 伺服器連結失敗，請稍後再試或連繫客服',
      position: 'bottom',
      timeout: 5000,
    });
  }, 30000);

  try {
    await systemApi.checkHealth();
  } catch {
    if (isTimedOut) return;
    $q.notify({
      type: 'negative',
      message: '⚠️ 無法連接伺服器',
      position: 'bottom',
    });
  } finally {
    clearTimeout(wakeUpTimer);
    clearTimeout(failTimer);
    // 只有在未逾時且有顯示提示時才去關閉它
    if (isNotified && !isTimedOut) {
      dismissWakeUp();
      isNotified = false;
    }
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
