<!-- src/pages/IndexPage.vue - 首頁 (美食輪盤) -->
<template>
  <q-page class="flex flex-center">
    <GridLottery />
  </q-page>
</template>

<script setup lang="ts">
import GridLottery from '../components/GridLottery.vue';
// import { useUIStore } from 'stores/ui';
// import { useI18n } from 'vue-i18n';
// const { t } = useI18n();

// const uiStore = useUIStore();
// 提供一個方法讓父層可以重設它（稍後會用）
</script>
