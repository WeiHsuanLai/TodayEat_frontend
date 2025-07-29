// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { useApi } from 'src/composables/axios';
import { Notify, Dialog } from 'quasar';

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
    customItems: [] as { label: string; items: string[] }[],
    foodDrawToday: {} as Record<'breakfast' | 'lunch' | 'dinner' | 'midnight', string | undefined>,
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

      // 清除 Google One Tap 快速登入記憶
      if (window.google?.accounts?.id) {
        window.google?.accounts?.id?.disableAutoSelect?.();
        console.log('已清除 Google One Tap 快速登入記憶');

      }

      // 無論如何都要清掉本地狀態
      this.isLoggedIn = false;
      this.username = '';
      this.token = '';
      this.role = null;
      this.avatar = '';
      this.pendingDraw = null;
      this.foodDrawToday = {
        breakfast: undefined,
        lunch: undefined,
        dinner: undefined,
        midnight: undefined,
      };

      localStorage.removeItem('guestPrizes');
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
    async setUser(user: { username: string; role: number; token?: string; avatar: string }) {
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
        const { meal, food } = this.pendingDraw;

        try {
          const { data } = await api.get('/record/food-draw/today', {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          });

          const existing = data?.meals?.[meal];

          if (existing) {
            Dialog.create({
              title: '已有推薦紀錄',
              message: `您今天的 ${meal} 已推薦為「${existing}」，是否要覆蓋為「${food}」？`,
              cancel: {
                label: '保留原本',
                color: 'grey-8',
                flat: true,
              },
              ok: {
                label: '覆蓋',
                color: 'primary',
              },
              persistent: true,
            })
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              .onOk(async () => {
                try {
                  await api.post('/record/food-draw', { meal, food });
                  this.foodDrawToday = {
                    ...this.foodDrawToday,
                    [meal]: food,
                  };
                  window.dispatchEvent(new CustomEvent('foodDrawOverwritten'));
                  Notify.create({
                    type: 'positive',
                    message: `🎉 已覆蓋推薦為：${food}`,
                    position: 'center',
                    timeout: 2000,
                  });
                } catch (err) {
                  console.error('❌ 覆蓋推薦失敗', err);
                  Notify.create({
                    type: 'negative',
                    message: '⚠️ 覆蓋失敗，請稍後再試',
                    position: 'center',
                    timeout: 2000,
                  });
                } finally {
                  this.clearPendingDraw();
                }
              })
              .onCancel(() => {
                this.clearPendingDraw();
              });
          } else {
            await api.post('/record/food-draw', { meal, food });

            Notify.create({
              type: 'positive',
              message: `🎉 已為您記錄推薦餐點：${food}，可到會員選單的抽取歷史查詢`,
              position: 'center',
              timeout: 4000,
            });

            this.clearPendingDraw();
          }
        } catch (err) {
          console.error('❌ 自動補送抽獎失敗', err);
          Notify.create({
            type: 'negative',
            message: '⚠️ 自動記錄失敗，請稍後再試',
            position: 'center',
            timeout: 2000,
          });
          this.clearPendingDraw();
        }
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

    async loadPrizes() {
      const { api } = useApi();
      const endpoint = this.isLoggedIn ? '/user/custom-items' : '/prizes';
      const config = this.token ? { headers: { Authorization: `Bearer ${this.token}` } } : {};

      let retry = false;

      try {
        const res = await api.get(endpoint, config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.customItems = res.data.map((p: any) => ({
          label: p.label,
          items: p.items,
        }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        console.warn('[loadPrizes] 第一次失敗，3 秒後重試');
        retry = true;
      }

      if (retry) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const res = await api.get(endpoint, config);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.customItems = res.data.map((p: any) => ({
            label: p.label,
            items: p.items,
          }));
        } catch (err2) {
          console.error('[loadPrizes] 重試後仍失敗', err2);
          Notify.create({
            type: 'negative',
            message: '載入推薦料理失敗，請稍後再試',
            position: 'center',
          });
        }
      }
    },
  },
});
