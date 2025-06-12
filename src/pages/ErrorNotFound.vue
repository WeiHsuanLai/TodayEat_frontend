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
import { api } from 'src/composables/axios';

const router = useRouter();
const $q = useQuasar();

let retryTimer: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;
const MAX_RETRIES = 10;

async function checkHealth() {
  try {
    const res = await api.get('/health');
    if (res.data?.status === 'UP') {
      $q.notify({
        type: 'positive',
        message: '✅ 伺服器已恢復，自動跳轉首頁',
      });
      clearRetry();
      void router.replace('/');
    }
  } catch {
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      clearRetry();
      $q.notify({
        type: 'warning',
        message: '⚠️ 已重試 10 次仍無法連接，請稍後再試',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: `❌ 無法連接伺服器，將繼續重試 (${retryCount}/${MAX_RETRIES})`,
      });
    }
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
