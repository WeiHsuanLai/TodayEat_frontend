<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { api } from 'src/composables/axios';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

onMounted(async () => {
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
