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
          <q-btn flat :label="t('home')" to="/" class="gt-xs" />
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

          <!-- 桌面版：登入與註冊按鈕 -->
          <template v-if="!userStore.isLoggedIn">
            <q-btn
              flat
              color="white"
              @click="showRegister = true"
              :label="t('register')"
              class="gt-xs"
            />
            <q-btn flat color="white" @click="showLogin = true" :label="t('login')" class="gt-xs" />
          </template>

          <!-- 已登入使用者資訊與選單 (保留在 Header，因為頭像通常是共用的) -->
          <template v-else>
            <q-avatar size="32px" color="blue-2" class="shadow-1 q-ml-sm">
              <img :src="userStore.avatar" style="object-fit: cover; width: 100%; height: 100%" />
            </q-avatar>

            <q-btn
              flat
              dense
              size="sm"
              color="white"
              icon-right="expand_more"
              class="q-ml-xs"
            >
              <q-menu
                auto-close
                anchor="bottom right"
                self="top right"
                :offset="[0, 8]"
                style="width: 240px"
              >
                <div class="column no-wrap">
                  <div class="q-pa-lg bg-grey-1 column items-center">
                    <div class="cursor-pointer" @click.stop="onAvatarClick">
                      <q-avatar size="64px" class="q-mb-md shadow-2">
                        <img
                          :src="userStore.avatar"
                          style="object-fit: cover; width: 100%; height: 100%"
                        />
                        <q-badge
                          color="primary"
                          rounded
                          class="avatar-edit-badge absolute flex flex-center shadow-1"
                        >
                          <q-icon name="edit" size="12px" color="white" />
                        </q-badge>
                      </q-avatar>
                    </div>
                    <div class="text-weight-bold text-h6 text-center full-width ellipsis">
                      {{ userStore.username }}
                    </div>
                  </div>

                  <q-separator />

                  <q-list dense padding>
                    <q-item clickable v-ripple to="/setting">
                      <q-item-section avatar>
                        <q-icon name="settings" size="xs" />
                      </q-item-section>
                      <q-item-section>{{ t('userSettings') }}</q-item-section>
                    </q-item>

                    <q-item clickable v-ripple to="/FoodDrawHistory">
                      <q-item-section avatar>
                        <q-icon name="history" size="xs" />
                      </q-item-section>
                      <q-item-section>{{ t('foodDrawHistory') }}</q-item-section>
                    </q-item>

                    <q-item clickable v-ripple to="/LoginHistory">
                      <q-item-section avatar>
                        <q-icon name="login" size="xs" />
                      </q-item-section>
                      <q-item-section>{{ t('loginHistory') }}</q-item-section>
                    </q-item>
                  </q-list>

                  <q-separator />

                  <div class="q-pa-sm">
                    <q-btn
                      flat
                      color="primary"
                      :label="t('signout')"
                      @click="logout"
                      class="full-width text-weight-bold"
                      icon="logout"
                      size="sm"
                    />
                  </div>
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
        <!-- 手機版：已登入使用者區塊 -->
        <template v-if="userStore.isLoggedIn">
          <q-item class="bg-primary text-white q-py-lg">
            <q-item-section avatar>
              <q-avatar size="56px" class="bg-white q-pa-xs">
                <img :src="userStore.avatar" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6 text-weight-bold">{{ userStore.username }}</q-item-label>
              <q-item-label caption class="text-white opacity-80"
                >UID: {{ userStore.username }}</q-item-label
              >
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/setting" @click="leftDrawerOpen = false">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>{{ t('userSettings') }}</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/FoodDrawHistory" @click="leftDrawerOpen = false">
            <q-item-section avatar>
              <q-icon name="history" />
            </q-item-section>
            <q-item-section>{{ t('foodDrawHistory') }}</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/LoginHistory" @click="leftDrawerOpen = false">
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>
            <q-item-section>{{ t('loginHistory') }}</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            @click="
              logout();
              leftDrawerOpen = false;
            "
            class="text-negative"
          >
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>{{ t('signout') }}</q-item-section>
          </q-item>

          <q-separator q-my-md />
        </template>

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
          <q-item
            clickable
            v-ripple
            @click="
              showLogin = true;
              leftDrawerOpen = false;
            "
          >
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section class="text-primary text-weight-bold">{{ t('login') }}</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            @click="
              showRegister = true;
              leftDrawerOpen = false;
            "
          >
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

    <!-- 編輯大頭貼對話框 -->
    <q-dialog v-model="showAvatarEditDialog" persistent @hide="onEditDialogHide">
      <q-card style="min-width: 320px; border-radius: 12px">
        <q-card-section class="row items-center q-px-md q-py-sm">
          <div class="text-h6 text-weight-bold">{{ t('editAvatar') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup size="md" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <!-- 這裡完全複刻下拉選單中的顯示方式，但比例放大至 120px 以利預覽 -->
          <div class="q-pa-lg bg-grey-1 column items-center">
            <q-avatar size="120px" class="q-mb-md shadow-2">
              <img
                :src="tempAvatarPreview || userStore.avatar"
                style="object-fit: cover; width: 100%; height: 100%"
              />
            </q-avatar>

            <!-- 檔案選取按鈕 (隱藏) -->
            <input
              type="file"
              ref="avatarInputRef"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />

            <div class="q-mt-md">
              <q-btn
                outline
                color="primary"
                icon="photo_camera"
                :label="t('selectFile')"
                @click="onSelectFileBtnClick"
                class="q-px-md"
              />
            </div>
            <div v-if="selectedFile" class="text-caption text-grey-7 q-mt-sm">
              {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat :label="t('cancel')" v-close-popup color="grey-7" />
          <q-btn
            unelevated
            :label="t('confirmUpload')"
            color="primary"
            :loading="isUploading"
            :disable="!selectedFile"
            @click="onConfirmUpload"
            class="q-px-lg"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { Notify } from 'quasar';
import LoginDialog from '../components/LoginDialog.vue';
import { useUserStore } from '../stores/userStore';
import RegisterDialog from '../components/RegisterDialog.vue';
import { userApi } from 'src/api/user';

const userStore = useUserStore();
userStore.restore();

// --- 編輯大頭貼相關 ---
const showAvatarEditDialog = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const tempAvatarPreview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);

function onAvatarClick() {
  showAvatarEditDialog.value = true;
}

function onSelectFileBtnClick() {
  avatarInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 1MB 限制
  if (file.size > 1024 * 1024) {
    Notify.create({
      type: 'negative',
      message: '檔案大小不可超過 1MB',
    });
    return;
  }

  // 產生預覽
  if (tempAvatarPreview.value) {
    URL.revokeObjectURL(tempAvatarPreview.value);
  }
  selectedFile.value = file;
  tempAvatarPreview.value = URL.createObjectURL(file);
}

async function onConfirmUpload() {
  if (!selectedFile.value) return;

  isUploading.value = true;
  try {
    const res = await userApi.uploadAvatar(selectedFile.value);
    if (res.data.url) {
      await userStore.setUser({
        avatar: res.data.url,
      });
      Notify.create({
        type: 'positive',
        message: t('success'),
      });
      showAvatarEditDialog.value = false;
    }
  } catch (err) {
    console.error('上傳大頭貼失敗:', err);
    Notify.create({
      type: 'negative',
      message: t('failed'),
    });
  } finally {
    isUploading.value = false;
  }
}

function onEditDialogHide() {
  // 清理資源
  if (tempAvatarPreview.value) {
    URL.revokeObjectURL(tempAvatarPreview.value);
  }
  tempAvatarPreview.value = null;
  selectedFile.value = null;
  if (avatarInputRef.value) {
    avatarInputRef.value.value = '';
  }
}
// --- 編輯大頭貼結束 ---

// 手機版側邊欄控制
const leftDrawerOpen = ref(false);

// 中上logo回首頁
const router = useRouter();
function goHome() {
  void router.push('/');
}

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

function handleLogin(data: {
  username: string;
  token: string;
  role: number;
  avatar: string;
  loginType: 'normal' | 'google';
}) {
  void userStore.setUser({
    username: data.username,
    token: data.token,
    role: data.role,
    avatar: data.avatar,
    loginType: data.loginType,
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

.avatar-edit-badge {
  bottom: 2px;
  right: -5px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid white;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
