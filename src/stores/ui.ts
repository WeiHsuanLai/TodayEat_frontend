import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    gridLotteryKey: 0,
  }),
  getters: {
    isLineBrowser: () => {
      if (typeof window === 'undefined') return false;
      return /Line/i.test(window.navigator.userAgent);
    },
  },
  actions: {
    refreshGridLottery() {
      this.gridLotteryKey++;
    },
  },
});
