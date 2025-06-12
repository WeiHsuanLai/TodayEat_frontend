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
      <q-btn outline color="white" label="回首頁" @click="goHome" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/composables/axios';

const router = useRouter();
const $q = useQuasar();

let retryTimer: ReturnType<typeof setInterval> | null = null;

function goHome() {
  void router.replace('/');
}

async function checkHealth() {
  try {
    const res = await api.get('/health');
    if (res.data?.status === 'UP') {
      $q.notify({
        type: 'positive',
        message: '✅ 伺服器已恢復，自動跳轉首頁',
      });
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      void router.replace('/');
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: '❌ 無法連接伺服器，將繼續重試',
    });
  }
}

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  retryTimer = setInterval(checkHealth, 5000); // 每 5 秒重試一次
});
</script>
