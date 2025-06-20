import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    gridLotteryKey: 0,
  }),
  actions: {
    refreshGridLottery() {
      this.gridLotteryKey++;
    },
  },
});
