<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <!-- 網頁版導覽列 -->
      <q-toolbar class="custom-toolbar relative-position q-px-md">
        <!-- 左邊 -->
        <!-- 左側導覽列 -->
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <!-- 中間 -->
        <!-- 首頁標題 -->
        <div
          class="absolute full-height flex items-center justify-center text-h6 text-weight-bold text-white xs-hide"
          style="left: 50%; transform: translateX(-50%); cursor: pointer"
          @click="goHome"
        >
          🍉{{ t('appTitle') }}🍖
        </div>

        <!-- 右邊 -->
        <div class="flex row items-center full-height q-gutter-sm q-ml-auto">
          <!-- 登入彈窗按鈕 -->
          <!-- 未登入顯示登入與註冊按鈕 -->
          <q-btn
            v-if="!userStore.isLoggedIn"
            flat
            color="white"
            class="q-mr-sm"
            @click="showRegister = true"
            :label="t('register')"
          />
          <q-btn
            v-if="!userStore.isLoggedIn"
            flat
            color="white"
            class="q-mr-sm"
            @click="showLogin = true"
            :label="t('login')"
          />

          <!-- 已登入顯示使用者名稱與頭像下拉 -->
          <q-btn
            v-else
            flat
            color="white"
            class="q-mr-sm"
            ref="userBtnRef"
            icon-right="expand_more"
          >
            <q-menu auto-close anchor="bottom right" self="top right">
              <div class="flex wrap flex-center full-width" avatar>
                <div class="menu-margin">
                  <div class="column items-center">
                    <q-avatar v-if="userStore.isLoggedIn" size="32px">
                      <img :src="userStore.avatarUrl" />
                    </q-avatar>
                    <q-avatar v-else>
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=guest" />
                    </q-avatar>
                  </div>

                  <div class="text-center full-width q-mt-xs">
                    {{ userStore.username }}
                  </div>
                </div>

                <q-btn
                  flat
                  color="primary"
                  :label="t('signout')"
                  @click="logout"
                  class="full-width justify-start q-px-md"
                />
              </div>
            </q-menu>
          </q-btn>
          <q-avatar v-if="userStore.isLoggedIn" size="32px" class="q-mr-sm">
            <img :src="userStore.avatarUrl" />
          </q-avatar>
          <q-avatar v-else>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=guest" />
          </q-avatar>

          <!-- 切換語言按鈕 -->
          <q-btn
            flat
            :label="langButtonText"
            color="white"
            @click="toggleLang"
            class="self-center xs-hide"
          />
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

    <RegisterDialog
      v-model="showRegister"
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
          <q-item-section> {{ t('home') }} </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/about">
          <q-item-section> {{ t('aboutus') }} </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 頁面內容 -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LoginDialog from '../components/LoginDialog.vue';
import { useUserStore } from '../stores/userStore';
import RegisterDialog from '../components/RegisterDialog.vue';

const userStore = useUserStore();
userStore.restore();

// 左側導航
const leftDrawerOpen = ref(false);

// 左側導覽列
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// 中上logo回首頁
const router = useRouter();
function goHome() {
  void router.push('/');
}

// 調整登出下拉選單寬度
const userBtnRef = ref<HTMLElement | null>(null);

// 登入
const showLogin = ref(false);

function handleLogin(data: { username: string; token: string; role: number }) {
  if (typeof data.username !== 'string') return;
  userStore.login(data.username, data.token, data.role);
  showLogin.value = false;
}

// 註冊
const showRegister = ref(false);
function handleRegister() {
  showRegister.value = false;
}

// 登出
function logout() {
  void userStore.logout();
}

function goToForgotPage(data: { email: string }) {
  console.log('忘記密碼請求（email）:', data.email);
  // 這裡可以呼叫 API，例如：
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

.menu-margin {
  margin: 20px 0 10px 0;
  width: 200px;
}
</style>
