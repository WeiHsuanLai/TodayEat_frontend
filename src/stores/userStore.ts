// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { useApi } from 'src/composables/axios';

// 這是建立一個名為 'user' 的 Pinia store，用來管理使用者登入狀態與基本資料。
export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false, // 是否已登入
    username: '', // 使用者帳號名稱
    avatarUrl: '', // 頭像網址
    token: '', // JWT 或其他登入憑證
    role: null as number | null, // 使用者權限
  }),
  actions: {
    // 登入
    login(username: string, token: string, role: number) {
      this.isLoggedIn = true;
      this.username = username;
      this.token = token;
      this.role = role;
      this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

      // 將登入資料存入 localStorage（持久化）
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatarUrl: this.avatarUrl,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
        }),
      );
    },

    // 登出
    async logout() {
      const { api } = useApi();
      try {
        if (this.token) {
          await api.post('/user/logout', null, {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });
          console.log('成功登出');
        }
      } catch (err) {
        console.warn('登出失敗:', err);
      }

      // 清除本地狀態
      this.isLoggedIn = false;
      this.username = '';
      this.token = '';
      this.role = null;
      this.avatarUrl = '';
      localStorage.removeItem('user');
    },

    // 在頁面重新整理後還原使用者狀態
    restore() {
      const data = localStorage.getItem('user');
      if (data) {
        const user = JSON.parse(data);
        this.username = user.username;
        this.avatarUrl =
          user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        this.token = user.token;
        this.role = user.role;
        this.isLoggedIn = user.isLoggedIn;
      }
    },

    // 驗證成功後（例如透過 /user/me 拿回資料）更新使用者資訊
    setUser(user: { username: string; role: number; token?: string }) {
      this.username = user.username;
      this.role = user.role;
      this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
      this.isLoggedIn = true;

      // 如果有新的 token 就更新，沒有就用原本的
      if (user.token !== undefined) {
        this.token = user.token;
      }

      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatarUrl: this.avatarUrl,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
        }),
      );
    },
  },
});
