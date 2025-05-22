<template>
  <q-page class="row items-center justify-evenly">
    <!-- <example-component title="Example component" active></example-component> -->
    <!-- <h1>{{ t('home.homethishome') }}</h1>
    <h1>{{ t('home.homethishome') }}</h1>
    <h1>{{ t('home.homethishome') }}</h1>
    <h1>{{ t('home.homethishome') }}</h1> -->
    <h1>123</h1>
    <GridLottery :items="prizes" @finish="handleFinish">
      <template v-slot="{ item }"> 🎁{{ item.label }} </template>
    </GridLottery>
    <h1>123</h1>
  </q-page>
</template>

<script setup lang="ts">
import GridLottery from '../components/GridLottery.vue';
// import { useI18n } from 'vue-i18n';
// const { t } = useI18n();

const prizes = [
  { label: '再接再厲' },
  { label: '折價券50元' },
  { label: '抽中iPhone!' },
  { label: '飲料一瓶' },
  { label: '充電金100元' },
  { label: '無獎' },
  { label: '神秘小禮' },
  { label: '謝謝參與' },
  { label: '再玩一次' },
];

function handleFinish(prize: { label: string }) {
  console.log('恭喜你抽到：', prize.label);
}
</script>
