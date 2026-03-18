// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { userApi, foodApi, type PrizeItem } from 'src/api';
import { Notify, Dialog } from 'quasar';

// 這是建立一個名為 'user' 的 Pinia store，用來管理使用者登入狀態與基本資料。
export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false, // 是否已登入
    username: '', // 使用者帳號名稱
    avatar: '', // 頭像網址
    token: '', // JWT 或其他登入憑證
    role: null as number | null, // 使用者權限
    loginType: null as 'normal' | 'google' | null, // 登入類型
    showLoginModal: false,
    loginRedirectPath: '',
    pendingDraw: null as { meal: string; food: string } | null,
    customItems: [] as { label: string; items: string[] }[],
    foodDrawToday: {} as Record<'breakfast' | 'lunch' | 'dinner' | 'midnight', string | undefined>,
  }),
  actions: {
    // 登入
    login(username: string, token: string, role: number, avatar: string, loginType: 'normal' | 'google' = 'normal') {
      this.isLoggedIn = true;
      this.username = username;
      this.token = token;
      this.role = role;
      this.loginType = loginType;

      // 處理頭像：若包含樣板字串 ${username} 則替換，否則使用預設值
      let finalAvatar = avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      if (finalAvatar.includes('${username}')) {
        finalAvatar = finalAvatar.replace('${username}', username);
      }
      this.avatar = finalAvatar;

      // 將登入資料存入 localStorage（持久化）
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatar: this.avatar,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
          loginType: this.loginType,
        }),
      );
    },

    // 登出
    async logout(skipApi = false) {
      try {
        if (this.token && !skipApi) {
          await userApi.logout();
        }
      } catch (err) {
        console.warn('登出失敗:', err);
      }

      // 清除 Google One Tap 快速登入記憶
      if (window.google?.accounts?.id) {
        window.google?.accounts?.id?.disableAutoSelect?.();
        // console.log('已清除 Google One Tap 快速登入記憶');
      }

      // 無論如何都要清掉本地狀態
      this.isLoggedIn = false;
      this.username = '';
      this.token = '';
      this.role = null;
      this.avatar = '';
      this.loginType = null;
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
      if (!data) return;

      try {
        const user = JSON.parse(data);

        // 基本安全性檢查：如果完全沒有 token，這筆資料就沒有還原意義
        if (!user || !user.token) {
          console.warn('[restore] 遺失 token，清除無效登入資訊');
          localStorage.removeItem('user');
          return;
        }

        // 還原資料，若欄位缺失則給予預設值，避免 UI 噴錯
        this.username = user.username || 'User';
        this.token = user.token;
        this.role = typeof user.role === 'number' ? user.role : null;
        this.loginType = user.loginType || 'normal';
        this.avatar =
          user.avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;

        // 判定登入狀態：只要有 token 就視為登入（後續 API 請求失敗會再由攔截器處理）
        this.isLoggedIn = Boolean(this.token);

        // console.log('[restore] 使用者狀態已還原:', this.username);
      } catch (err) {
        console.error('[restore] 解析 localStorage 失敗:', err);
        localStorage.removeItem('user');
      }
    },

    // 驗證成功後（例如透過 /user/getCurrentUser 拿回資料）更新使用者資訊
    async setUser(user: {
      username?: string;
      role?: number | null;
      token?: string;
      avatar?: string;
      loginType?: 'normal' | 'google';
    }) {
      // 🔍 診斷日誌：檢查資料完整性
      if (!user.username && this.isLoggedIn) {
        console.warn('[setUser] 偵測到不完整的資料更新！', {
          received: user,
          currentStore: { username: this.username, role: this.role }
        });
      }

      if (user.username) this.username = user.username;
      if (user.role !== undefined) this.role = user.role;
      if (user.loginType) this.loginType = user.loginType;

      // 處理頭像：優先使用傳入的，若無則保留現有的或使用預設
      if (user.avatar) {
        let finalAvatar = user.avatar.trim();
        if (finalAvatar.includes('${username}')) {
          finalAvatar = finalAvatar.replace('${username}', this.username || 'User');
        }
        this.avatar = finalAvatar;
      } else if (!this.avatar) {
        this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username || 'User'}`;
      }

      this.isLoggedIn = true;

      // 如果有新的 token 就更新
      if (user.token) {
        this.token = user.token;
      }

      // 同步到 localStorage
      localStorage.setItem(
        'user',
        JSON.stringify({
          username: this.username,
          avatar: this.avatar,
          token: this.token,
          role: this.role,
          isLoggedIn: this.isLoggedIn,
          loginType: this.loginType,
        }),
      );

      // ✅ 補送抽獎紀錄（如果有）
      if (this.pendingDraw) {
        const { meal, food } = this.pendingDraw;

        try {
          const { data } = await foodApi.getTodayDraws();

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
                  await foodApi.recordDraw(meal, food);
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
            await foodApi.recordDraw(meal, food);

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
      let retry = false;

      try {
        const res = await foodApi.getPrizes(this.isLoggedIn);
        this.customItems = res.data.map((p: PrizeItem) => ({
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
          const res = await foodApi.getPrizes(this.isLoggedIn);
          this.customItems = res.data.map((p: PrizeItem) => ({
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
