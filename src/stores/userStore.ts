// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { useApi } from 'src/composables/axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    username: '',
    avatarUrl: '',
    token: '',
    role: null as number | null,
  }),
  actions: {
    login(username: string, token: string, role: number) {
      this.isLoggedIn = true;
      this.username = username;
      this.token = token;
      this.role = role;
      this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

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
    restore() {
      const data = localStorage.getItem('user');
      if (data) {
        const user = JSON.parse(data);
        this.username = user.username;
        this.avatarUrl =
          user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        this.isLoggedIn = user.isLoggedIn;
      }
    },
  },
});
