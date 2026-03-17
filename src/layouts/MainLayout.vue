<!-- src\layouts\MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <!-- 導覽列 -->
      <q-toolbar class="custom-toolbar q-px-md">
        <!-- 左邊：首頁標題/Logo -->
        <div
          class="text-h6 text-weight-bold text-white cursor-pointer row items-center"
          @click="goHome()"
        >
          🍉{{ t('appTitle') }}🍖
        </div>

        <q-space />

        <!-- 右邊：導覽按鈕與使用者功能 -->
        <div class="row items-center q-gutter-sm">
          <!-- 桌面版：主要導覽按鈕 -->
          <q-btn flat :label="t('draw')" to="/draw" class="gt-xs" />
          <q-btn
            v-if="userStore.isLoggedIn"
            flat
            :label="t('mapSearch')"
            to="/mapsearch"
            class="gt-xs"
          />
          <q-btn
            v-if="userStore.role === 1"
            flat
            :label="t('adminPage')"
            to="/admin"
            class="gt-xs"
          />

          <q-separator dark vertical inset class="q-mx-sm gt-xs" />

          <!-- 桌面版：登入與註冊按鈕 -->
          <template v-if="!userStore.isLoggedIn">
            <q-btn
              flat
              color="white"
              @click="showRegister = true"
              :label="t('register')"
              class="gt-xs"
            />
            <q-btn
              flat
              color="white"
              @click="showLogin = true"
              :label="t('login')"
              class="gt-xs"
            />
          </template>

          <!-- 已登入使用者資訊與選單 (保留在 Header，因為頭像通常是共用的) -->
          <template v-else>
            <q-avatar size="32px" color="blue-2">
              <img :src="userStore.avatar" />
            </q-avatar>

            <q-btn flat dense size="sm" color="white" ref="userBtnRef" icon-right="expand_more">
              <q-menu auto-close anchor="bottom right" self="top right">
                <div class="flex wrap flex-center full-width" avatar>
                  <div class="menu-margin">
                    <div class="column items-center">
                      <q-avatar size="32px">
                        <img :src="userStore.avatar" />
                      </q-avatar>
                    </div>
                    <div class="text-center full-width q-mt-xs">
                      {{ userStore.username }}
                    </div>
                  </div>
                  <q-btn
                    flat
                    color="dark"
                    :label="t('userSettings')"
                    to="/setting"
                    class="full-width justify-start q-px-md"
                  />
                  <q-btn
                    flat
                    color="dark"
                    :label="t('foodDrawHistory')"
                    to="/FoodDrawHistory"
                    class="full-width justify-start q-px-md"
                  />
                  <q-btn
                    flat
                    color="dark"
                    :label="t('loginHistory')"
                    to="/LoginHistory"
                    class="full-width justify-start q-px-md"
                  />
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
          </template>

          <!-- 桌面版：切換語言按鈕 -->
          <q-btn flat label="中/EN" color="white" @click="toggleLang" class="gt-xs" />

          <!-- 手機版：三條線選單按鈕 -->
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="leftDrawerOpen = !leftDrawerOpen"
            class="lt-sm"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- 手機版側邊欄 -->
    <q-drawer v-model="leftDrawerOpen" side="right" bordered class="bg-grey-1 lt-sm">
      <q-list>
        <q-item-label header class="text-weight-bold">{{ t('home') }}</q-item-label>

        <!-- 基本導覽 -->
        <q-item clickable v-ripple to="/draw">
          <q-item-section avatar>
            <q-icon name="casino" />
          </q-item-section>
          <q-item-section>{{ t('draw') }}</q-item-section>
        </q-item>

        <q-item v-if="userStore.isLoggedIn" clickable v-ripple to="/mapsearch">
          <q-item-section avatar>
            <q-icon name="map" />
          </q-item-section>
          <q-item-section>{{ t('mapSearch') }}</q-item-section>
        </q-item>

        <q-item v-if="userStore.role === 1" clickable v-ripple to="/admin">
          <q-item-section avatar>
            <q-icon name="admin_panel_settings" />
          </q-item-section>
          <q-item-section>{{ t('adminPage') }}</q-item-section>
        </q-item>

        <q-separator q-my-md />

        <!-- 語系切換 (手機版) -->
        <q-item clickable v-ripple @click="toggleLang">
          <q-item-section avatar>
            <q-icon name="language" />
          </q-item-section>
          <q-item-section>
            <div class="row justify-between items-center">
              <span>{{ locale === 'zh-TW' ? 'English' : '繁體中文' }}</span>
              <q-badge color="primary">{{ locale === 'zh-TW' ? 'TW' : 'EN' }}</q-badge>
            </div>
          </q-item-section>
        </q-item>

        <!-- 登入與註冊 (手機版，僅在未登入時顯示) -->
        <template v-if="!userStore.isLoggedIn">
          <q-separator q-my-md />
          <q-item clickable v-ripple @click="showLogin = true; leftDrawerOpen = false">
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section class="text-primary text-weight-bold">{{ t('login') }}</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="showRegister = true; leftDrawerOpen = false">
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>{{ t('register') }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

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
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LoginDialog from '../components/LoginDialog.vue';
import { useUserStore } from '../stores/userStore';
import RegisterDialog from '../components/RegisterDialog.vue';

const userStore = useUserStore();
userStore.restore();

// 手機版側邊欄控制
const leftDrawerOpen = ref(false);

// 中上logo回首頁
const router = useRouter();
function goHome() {
  void router.push('/');
}

// 調整登出下拉選單寬度
const userBtnRef = ref<HTMLElement | null>(null);

// 登入
const showLogin = ref(false);

watch(
  () => userStore.showLoginModal,
  (val) => {
    showLogin.value = val;
  },
);

watch(showLogin, (val) => {
  if (!val) {
    userStore.showLoginModal = false;
  }
});

function handleLogin(data: { username: string; token: string; role: number; avatar: string }) {
  void userStore.setUser({
    username: data.username,
    token: data.token,
    role: data.role,
    avatar: data.avatar,
  });
  showLogin.value = false;

  // ✅ 登入成功後導回原本頁面
  if (userStore.loginRedirectPath) {
    void router.push(userStore.loginRedirectPath);
    userStore.loginRedirectPath = '';
  } else {
    void router.push('/');
  }
}

// 註冊
const showRegister = ref(false);
function handleRegister() {
  showRegister.value = false;
}

// 登出
async function logout() {
  await userStore.logout();
  await router.push('/');
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

.cursor-pointer {
  cursor: pointer;
}
</style>
