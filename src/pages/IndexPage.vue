<template>
  <q-page class="row items-center justify-evenly">
    <!-- <GridLottery :key="uiStore.gridLotteryKey" /> -->
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
