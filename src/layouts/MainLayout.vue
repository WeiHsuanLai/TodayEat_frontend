<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <!-- 導覽列 -->
      <q-toolbar class="custom-toolbar relative-position q-px-md">
        <!-- 左邊 -->
        <!-- 左側導覽列 -->
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <!-- 中間 -->
        <!-- 首頁標題 -->
        <div
          class="absolute full-height flex items-center justify-center text-h6 text-weight-bold text-white"
          style="left: 50%; transform: translateX(-50%); cursor: pointer"
          @click="goHome"
        >
          🍉{{ t('home.appTitle') }}🍖
        </div>

        <!-- 右邊 -->
        <div class="flex row items-center full-height q-gutter-sm q-ml-auto xs-hide">
          <!-- 登入彈窗按鈕 -->
          <!-- 若尚未登入 -->
          <q-item
            v-if="!userStore.isLoggedIn"
            clickable
            @click="showLogin = true"
            class="bg-primary text-white"
            style="width: 130px"
          >
            <q-item-section>
              <div class="self-center">{{ t('home.login') }}</div>
            </q-item-section>
            <q-item-section avatar>
              <q-avatar>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=guest" />
              </q-avatar>
            </q-item-section>
          </q-item>

          <!-- 若已登入 -->
          <q-item
            v-else
            clickable
            class="bg-primary text-white"
            style="width: 130px"
            @click="logout"
          >
            <q-item-section>
              <div class="self-center">{{ userStore.username }}</div>
            </q-item-section>
            <q-item-section avatar>
              <q-avatar>
                <img :src="userStore.avatarUrl" />
              </q-avatar>
            </q-item-section>
          </q-item>

          <!-- 切換語言按鈕 -->
          <q-btn
            flat
            :label="langButtonText"
            color="white"
            @click="toggleLang"
            class="self-center"
          />

          <!-- 下拉菜單 -->
          <q-btn
            color="primary"
            label="菜單"
            @mouseover="menuVisible = true"
            style="width: 100px"
            unelevated
          >
            <q-menu v-model="menuVisible" @mouseleave="menuVisible = false" fit class="no-shadow">
              <q-list>
                <q-item clickable>
                  <q-item-section>我是菜單一</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>我是菜單二</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- 分隔線 -->
        </div>
      </q-toolbar>
    </q-header>

    <!-- 登入彈跳視窗 -->
    <LoginDialog
      v-model="showLogin"
      @login="handleLogin"
      @register="handleRegister"
      @forgotPassword="goToForgotPage"
    />

    <!-- 左側導覽列彈窗 -->
    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item clickable v-ripple to="/">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section> {{ t('home.home') }} </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/about">
          <q-item-section> {{ t('home.about') }} </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 頁面內容 -->
    <q-page-container>
      <transition name="fade">
        <router-view />
      </transition>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LoginDialog from '../components/LoginDialog.vue';
import { useUserStore } from '../stores/userStore';

const userStore = useUserStore();

// 左側導航
const leftDrawerOpen = ref(false);

// 菜單
const menuVisible = ref(false);

// 左側導覽列
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// 中上logo回首頁
const router = useRouter();
function goHome() {
  void router.push('/');
}

// 登入
const showLogin = ref(false);
function handleLogin(data: { username: string; password: string }) {
  console.log('收到登入資料：', data);
  // 加入你的登入驗證邏輯，例如 API 呼叫
  userStore.login(data.username);
  showLogin.value = false;
}

// 註冊
function handleRegister(data: { username: string; password: string }) {
  console.log('收到註冊資料：', data);

  // 這裡可以加入註冊 API 邏輯（模擬或實際呼叫）
  // 成功後登入使用者
  userStore.login(data.username);

  // 關閉登入/註冊彈窗
  showLogin.value = false;
}

// 登出
function logout() {
  userStore.logout();
}

function goToForgotPage(data: { email: string }) {
  console.log('忘記密碼請求（email）:', data.email);
  // 這裡可以呼叫 API，例如：
  // await api.forgotPassword(data.email)
  showLogin.value = false;
}

// 語系切換邏輯
const { locale, t } = useI18n();
function toggleLang() {
  locale.value = locale.value === 'zh-TW' ? 'en-US' : 'zh-TW';
}

const langButtonText = computed(() => (locale.value === 'zh-TW' ? '中文' : 'EN'));
</script>

<style scoped>
.custom-toolbar {
  height: 80px;
  min-height: 80px;
}

.q-item:hover {
  background-color: #f0f0f0;
}

.no-shadow {
  box-shadow: none !important;
}
</style>
