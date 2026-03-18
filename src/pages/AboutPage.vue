<!-- src/pages/AboutPage.vue - 首頁 (原關於我們) -->
<template>
  <q-page :class="['flex flex-center bg-grey-1', $q.screen.lt.sm ? 'q-pa-md' : 'q-pa-lg']">
    <div
      class="column items-center justify-center full-width"
      :style="{ maxWidth: $q.screen.lt.sm ? '100%' : '1000px' }"
    >
      <!-- 標題與簡介 -->
      <div :class="['text-center full-width', $q.screen.lt.sm ? 'q-mb-lg' : 'q-mb-xl']">
        <div
          :class="[
            $q.screen.lt.sm ? 'text-h4' : 'text-h3',
            'text-primary text-weight-bolder q-mb-md',
          ]"
        >
          {{ t('aboutus') }}
        </div>
        <div
          :class="[
            $q.screen.lt.sm ? 'text-subtitle1' : 'text-h6',
            'text-grey-8 line-height-relaxed',
          ]"
          style="white-space: pre-line"
        >
          {{ t('aboutDescription') }}
        </div>
      </div>

      <!-- 核心特色區塊 - 移除 overflow: hidden 並加入 padding 確保動畫空間 -->
      <div class="full-width q-py-md">
        <div
          :class="[
            'row justify-center items-stretch',
            $q.screen.lt.sm ? 'q-col-gutter-md' : 'q-col-gutter-lg',
          ]"
        >
          <!-- 擲骰子 -->
          <div class="col-12 col-sm-4">
            <q-card
              flat
              bordered
              class="about-card mobile-card-height cursor-pointer full-height"
              @click="handleCardClick('/draw')"
            >
              <q-card-section :class="['full-height flex flex-center column text-center', $q.screen.lt.sm ? 'q-pa-md' : 'q-pa-lg']">
                <!-- 手機版：水平並排 -->
                <div
                  v-if="$q.screen.lt.sm"
                  class="row items-center justify-center q-gutter-x-sm q-mb-sm full-width"
                >
                  <q-icon name="casino" size="32px" color="primary" />
                  <div class="text-h6 text-weight-bold">{{ t('draw') }}</div>
                </div>
                <!-- 電腦版：垂直排列 -->
                <template v-else>
                  <q-icon name="casino" size="56px" color="primary" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold q-mb-sm">{{ t('draw') }}</div>
                </template>

                <div class="text-body2 text-grey-7 q-mt-xs">
                  {{ t('drawDesc') }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- 美食地圖 -->
          <div class="col-12 col-sm-4">
            <q-card
              flat
              bordered
              class="about-card mobile-card-height cursor-pointer full-height"
              @click="handleCardClick('/mapsearch', true)"
            >
              <q-card-section :class="['full-height flex flex-center column text-center', $q.screen.lt.sm ? 'q-pa-md' : 'q-pa-lg']">
                <!-- 手機版：水平並排 -->
                <div
                  v-if="$q.screen.lt.sm"
                  class="row items-center justify-center q-gutter-x-sm q-mb-sm full-width"
                >
                  <q-icon name="map" size="32px" color="secondary" />
                  <div class="text-h6 text-weight-bold">{{ t('mapTitle') }}</div>
                </div>
                <!-- 電腦版：垂直排列 -->
                <template v-else>
                  <q-icon name="map" size="56px" color="secondary" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold q-mb-sm">{{ t('mapTitle') }}</div>
                </template>

                <div class="text-body2 text-grey-7 q-mt-xs">
                  {{ t('mapDesc') }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- 我的足跡 -->
          <div class="col-12 col-sm-4">
            <q-card
              flat
              bordered
              class="about-card mobile-card-height cursor-pointer full-height"
              @click="handleCardClick('/FoodDrawHistory', true)"
            >
              <q-card-section :class="['full-height flex flex-center column text-center', $q.screen.lt.sm ? 'q-pa-md' : 'q-pa-lg']">
                <!-- 手機版：水平並排 -->
                <div
                  v-if="$q.screen.lt.sm"
                  class="row items-center justify-center q-gutter-x-sm q-mb-sm full-width"
                >
                  <q-icon name="history" size="32px" color="accent" />
                  <div class="text-h6 text-weight-bold">{{ t('historyTitle') }}</div>
                </div>
                <!-- 電腦版：垂直排列 -->
                <template v-else>
                  <q-icon name="history" size="56px" color="accent" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold q-mb-sm">{{ t('historyTitle') }}</div>
                </template>

                <div class="text-body2 text-grey-7 q-mt-xs">
                  {{ t('historyDesc') }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const $q = useQuasar();

const handleCardClick = (path: string, requiresAuth = false) => {
  if (requiresAuth && !userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: t('pleaseLogin'),
      position: 'center',
      timeout: 2000,
    });
    userStore.showLoginModal = true;
    userStore.loginRedirectPath = path;
    return;
  }
  void router.push(path);
};
</script>

<style scoped>
.about-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border-radius: 16px;
}

@media (max-width: 599px) {
  .mobile-card-height {
    width: 72vw;
    min-height: 160px; /* 增加高度，使其比例更均勻 */
    margin: 0 auto;
  }
}

.about-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.line-height-relaxed {
  line-height: 1.8;
}
</style>
