<!-- src/pages/ErrorNotFound.vue - 找不到頁面 (404) -->
<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">404</div>
      <div class="text-h4 q-mb-md">Oops. Nothing here...</div>

      <div class="text-subtitle1 q-mb-md">我們正在嘗試重新連線伺服器中...</div>

      <q-btn
        color="white"
        text-color="blue"
        label="手動重試"
        @click="checkHealth"
        class="q-mr-sm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { systemApi } from 'src/api';

const router = useRouter();
const $q = useQuasar();

let retryTimer: ReturnType<typeof setInterval> | null = null;

async function checkHealth() {
  try {
    const res = await systemApi.checkHealth();
    if (res.status === 200) {
      $q.notify({
        type: 'positive',
        message: '✅ 伺服器已恢復，自動跳轉首頁',
      });
      clearRetry();
      void router.replace('/');
    }
  } catch {
    // 繼續等下一次定時觸發
  }
}

function clearRetry() {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  retryTimer = setInterval(checkHealth, 5000);
});

onBeforeUnmount(() => {
  clearRetry();
});
</script>
