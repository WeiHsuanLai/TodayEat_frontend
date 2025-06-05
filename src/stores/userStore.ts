// src/stores/userStore.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    username: '',
    avatarUrl: '',
    token: '',
    role: 0,
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
    logout() {
      this.isLoggedIn = false;
      this.username = '';
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
