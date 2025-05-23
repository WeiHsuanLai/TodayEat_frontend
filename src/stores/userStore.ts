// src/stores/userStore.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    username: '',
    avatarUrl: '',
  }),
  actions: {
    login(username: string) {
      this.isLoggedIn = true;
      this.username = username;
      this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    },
    logout() {
      this.isLoggedIn = false;
      this.username = '';
      this.avatarUrl = '';
    },
  },
});
