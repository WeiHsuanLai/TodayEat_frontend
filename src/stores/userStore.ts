// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { useApi } from 'src/composables/axios';
import { Notify } from 'quasar';

// 這是建立一個名為 'user' 的 Pinia store，用來管理使用者登入狀態與基本資料。
export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false, // 是否已登入
    username: '', // 使用者帳號名稱
    avatar: '', // 頭像網址
    token: '', // JWT 或其他登入憑證
    role: null as number | null, // 使用者權限
    showLoginModal: false,
    loginRedirectPath: '',
    pendingDraw: null as { meal: string; food: string } | null,
  }),
  actions: {
    // 登入
    login(username: string, token: string, role: number, avatar: string) {
      this.isLoggedIn = true;
      this.username = username;
      this.token = token;
      this.role = role;
      this.avatar = avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      console.log('this.avatar', this.avatar);

      // 將登入資料存入 localStorage（持久化）
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatar: this.avatar,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
        }),
      );
    },

    // 登出
    async logout(skipApi = false) {
      const { api } = useApi();
      try {
        if (this.token && !skipApi) {
          await api.post('/user/logout', null, {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
        }
      } catch (err) {
        console.warn('登出失敗:', err);
      }

      // 無論如何都要清掉本地狀態
      this.isLoggedIn = false;
      this.username = '';
      this.token = '';
      this.role = null;
      this.avatar = '';
      localStorage.removeItem('user');

      // 登出提醒
      Notify.create({
        type: 'positive',
        message: '您已成功登出',
        position: 'center',
        timeout: 2000,
      });
    },

    // 在頁面重新整理後還原使用者狀態
    restore() {
      const data = localStorage.getItem('user');
      if (data) {
        const user = JSON.parse(data);
        // 若欄位不完整，強制清除並跳通知
        if (!user.username || typeof user.username !== 'string') {
          console.warn('[restore] user 欄位不完整，自動清除 localStorage');
          localStorage.removeItem('user');
          return;
        }

        this.username = user.username;
        this.avatar =
          user.avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        this.token = user.token;
        this.role = user.role;
        this.isLoggedIn = Boolean(user.token && user.username && typeof user.role === 'number');
      }
    },

    // 驗證成功後（例如透過 /user/getCurrentUser 拿回資料）更新使用者資訊
    setUser(user: { username: string; role: number; token?: string; avatar: string }) {
      this.username = user.username;
      this.role = user.role;
      this.avatar = user.avatar;
      this.isLoggedIn = true;

      // 如果有新的 token 就更新，沒有就用原本的
      if (user.token !== undefined) {
        this.token = user.token;
      }

      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatar: this.avatar,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
        }),
      );

      // ✅ 補送抽獎紀錄（如果有）
      if (this.pendingDraw) {
        const { api } = useApi();
        api
          .post('/record/food-draw', {
            meal: this.pendingDraw.meal,
            food: this.pendingDraw.food,
          })
          .then(() => {
            console.log('✅ 自動補送抽獎成功');
            Notify.create({
              type: 'positive',
              message: `🎉 已為你記錄推薦餐點：${this.pendingDraw!.food}`,
              position: 'center',
              timeout: 2000,
            });
          })
          .catch((err) => {
            console.error('❌ 自動補送抽獎失敗', err);
            Notify.create({
              type: 'negative',
              message: '⚠️ 自動記錄失敗，請稍後再試',
              position: 'center',
              timeout: 2000,
            });
          })
          .finally(() => {
            this.clearPendingDraw();
          });
      }
    },

    // 紀錄抽獎資訊
    setPendingDraw(meal: string, food: string) {
      this.pendingDraw = { meal, food };
    },

    // 清除抽獎資訊
    clearPendingDraw() {
      this.pendingDraw = null;
    },
  },
});
