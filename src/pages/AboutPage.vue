<!-- src/pages/AboutPage.vue - 關於我們 -->
<template>
  <q-page class="flex flex-center q-pa-lg bg-grey-1">
    <div class="column items-center full-width" style="max-width: 800px">
      <!-- 標題與簡介 -->
      <div class="text-center q-mb-xl">
        <div class="text-h3 text-primary text-weight-bolder q-mb-md">
          🍉{{ t('aboutus') }}🍖
        </div>
        <div class="text-h6 text-grey-8 line-height-relaxed">
          解決「今天要吃什麼？」的終極難題。<br />
          我們為所有選擇障礙者打造一個輕鬆、有趣的覓食體驗。
        </div>
      </div>

      <!-- 核心特色區塊 -->
      <div class="row q-col-gutter-lg full-width">
        <div class="col-12 col-sm-4">
          <q-card flat bordered class="about-card text-center q-pa-md full-height">
            <q-card-section>
              <q-icon name="casino" size="56px" color="primary" class="q-mb-md" />
              <div class="text-h6 text-weight-bold q-mb-sm">隨機抽取</div>
              <div class="text-body2 text-grey-7">
                讓命運決定你的下一餐！轉動美食輪盤，瞬間解決午晚餐的煩惱。
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-4">
          <q-card flat bordered class="about-card text-center q-pa-md full-height">
            <q-card-section>
              <q-icon name="map" size="56px" color="secondary" class="q-mb-md" />
              <div class="text-h6 text-weight-bold q-mb-sm">美食地圖</div>
              <div class="text-body2 text-grey-7">
                整合 Google 地圖，除了推薦餐廳，更能直接查看評價與導航，美食近在咫尺。
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-4">
          <q-card flat bordered class="about-card text-center q-pa-md full-height">
            <q-card-section>
              <q-icon name="history" size="56px" color="accent" class="q-mb-md" />
              <div class="text-h6 text-weight-bold q-mb-sm">我的足跡</div>
              <div class="text-body2 text-grey-7">
                登入後可紀錄每一筆抽取紀錄，讓你追蹤曾經嘗試過的美食點滴。
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 底部標語 -->
      <div class="q-mt-xl text-center">
        <q-btn
          to="/"
          color="primary"
          rounded
          unelevated
          padding="12px 32px"
          icon="restaurant"
          :label="t('home')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.about-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border-radius: 16px;
}

.about-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.line-height-relaxed {
  line-height: 1.8;
}
</style>
