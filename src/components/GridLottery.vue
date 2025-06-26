<!-- src/components/GridLottery.vue -->
<template>
  <div>
    <div class="header-row">
      <!-- 顯示目前時段（早餐／午餐／晚餐／消夜） -->
      <div class="time-label">目前時段:{{ currentMeal }}</div>

      <!-- 類別選擇器（全部隨機／四個時段） -->
      <q-select
        v-model="model"
        :options="options"
        @update:model-value="loadPrizes"
        label="抽取類別"
        dense
        style="min-width: 120px"
      />
    </div>

    <div class="lottery-container">
      <!-- 料理格子 -->
      <div class="grid" :style="gridStyle">
        <div
          v-for="(item, index) in prizes"
          :key="index"
          :class="['grid-item', { active: index === activeIndex }]"
          size="sm"
          :title="item.items.join(', ')"
        >
          <!-- 刪除按鈕 -->
          <q-btn
            size="xs"
            icon="close"
            flat
            round
            dense
            class="delete-btn"
            color="red"
            @click.stop="deletePrize(index)"
          />

          <!-- 分類名稱與抽中料理 -->
          <div class="label-text">{{ item.label }}</div>
          <div v-if="item.selectedItem" class="sub-text">{{ item.selectedItem }}</div>

          <!-- 新增項目或刪除彈窗按鈕 -->
          <q-btn
            v-if="model === '全部隨機'"
            icon="add"
            color="primary"
            class="q-my-xs"
            round
            size="xs"
            @click="showItemDetail(item)"
          />
        </div>

        <!-- 新增分類按鈕 -->
        <div v-if="model === '全部隨機'" class="grid-item add-new" @click="openNewCategoryDialog">
          <q-icon name="add" size="md" color="primary" />
          <div class="label-text">新增分類</div>
        </div>
      </div>
      <div>
        <button class="start-btn q-ma-sm" @click="startLottery" :disabled="isRunning">
          {{ isRunning ? '推薦中...' : '今日推薦' }}
        </button>
        <button class="start-btn q-ma-sm" @click="resetToDefault" :disabled="isRunning">
          重置餐點項目
        </button>
      </div>
    </div>

    <!-- 在原有項目(X式料理)新增或刪除彈窗 -->
    <q-dialog v-model="dialog.model">
      <q-card style="min-width: 300px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">{{ dialog.label }}項目</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <!-- 迴圈取得每個料理 -->
          <q-item v-for="(dish, i) in dialog.items" :key="i" dense>
            <q-item-section>{{ dish }}</q-item-section>
            <!-- 刪除料理項目上的 X -->
            <q-item-section side>
              <q-btn dense flat icon="delete" color="red" @click="removeDish(i)" />
            </q-item-section>
          </q-item>

          <!-- 新增料理 -->
          <q-input
            v-model="dialog.newItem"
            dense
            placeholder="Enter可輸入新料理"
            @keyup.enter="addDish"
            outlined
          />
        </q-card-section>

        <!-- 取消和儲存按鈕 -->
        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" @click="dialog.model = false" />
          <q-btn flat label="儲存" color="primary" @click="saveDishEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增料理項目彈窗 -->
    <q-dialog v-model="newCategoryDialog">
      <q-card style="min-width: 300px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">新增料理</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <q-input v-model="newCategoryLabel" placeholder="輸入分類名稱" dense outlined />

          <div class="text-subtitle2 q-mt-sm">料理項目</div>

          <q-item v-for="(dish, i) in newCategoryItems" :key="i" dense class="q-px-none">
            <q-item-section>{{ dish }}</q-item-section>
            <q-item-section side>
              <q-btn dense flat icon="delete" color="red" @click="newCategoryItems.splice(i, 1)" />
            </q-item-section>
          </q-item>

          <q-input
            v-model="newCategoryNewItem"
            dense
            outlined
            placeholder="Enter可輸入新料理"
            @keyup.enter="addNewCategoryDish"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" @click="newCategoryDialog = false" />
          <q-btn flat label="新增" color="primary" @click="createNewCategory" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from 'vue';
import { api } from '../composables/axios';
import { Notify, Dialog } from 'quasar';
import { useUserStore } from 'src/stores/userStore';

export default defineComponent({
  name: 'GridLottery',
  data() {
    return {
      prizes: [] as {
        label: string;
        items: string[];
        selectedItem: string | null;
      }[], // 抽獎格子陣列，每個格子含 label, items, selectedItem。
      activeIndex: -1,
      isRunning: false,
      timer: null as ReturnType<typeof setTimeout> | null,
      dialog: {
        model: false,
        label: '',
        items: [] as string[],
        newItem: '',
        targetPrize: null as null | {
          label: string;
          items: string[];
          selectedItem: string | null;
        },
      }, // 制項目編輯與新增分類的 UI 狀態
      newCategoryDialog: false,
      newCategoryLabel: '',
      newCategoryItems: [] as string[],
      newCategoryNewItem: '',
      model: ref('全部隨機'),
      options: ['全部隨機', '早餐類', '午餐類', '晚餐類', '宵夜類'],
      mealLabels: [] as string[], //取得料理項目
    };
  },

  watch: {
    isLoggedIn(newVal: boolean, oldVal: boolean) {
      if (newVal && !oldVal) {
        // ✅ 登入成功後載入新資料
        void this.loadPrizes().then(() => {
          void this.loadTodayDraw();
        });
      }
      if (!newVal) {
        // ✅ 登出後清除所有資料與狀態
        this.prizes = [];
        this.activeIndex = -1;
        void this.loadPrizes();
        console.log('[登出清除]  已載入預設料理清單');
      }
    },
  },

  mounted() {
    void this.loadPrizes().then(() => {
      void this.loadPrizes(); //取得料理項目
      void this.loadTodayDraw(); // 等載入完料理後再載入已抽紀錄
    });
  },
  computed: {
    isLoggedIn(): boolean {
      return useUserStore().token !== '';
    },
    gridStyle(): Record<string, string> {
      const count = Math.ceil(Math.sqrt(this.prizes.length));
      return {
        gridTemplateColumns: `repeat(${count}, 1fr)`,
      };
    },
    currentMeal(): string {
      const hour = new Date().getHours();
      if (hour >= 3 && hour < 11) return '早餐';
      if (hour >= 11 && hour < 15) return '午餐';
      if (hour >= 15 && hour < 21) return '晚餐';
      return '宵夜';
    },
  },
  methods: {
    // 取得料理項目
    async loadMealLabels() {
      try {
        const res = await api.get('/mealPresets');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labels = res.data?.map((p: any) => p.label) ?? [];
        this.mealLabels = labels;
        // 更新 options，保留「全部隨機」在最前面
        this.options = ['全部隨機', ...labels];
        console.log('🍱 mealLabels:', this.mealLabels);
      } catch (err) {
        console.error('[loadMealLabels] 無法載入餐別標籤', err);
      }
    },

    // 載入料理格子
    async loadPrizes() {
      try {
        const label = this.model;

        const isRandomAll = label === '全部隨機';
        // 根據選擇決定查詢類型（type)
        if (this.mealLabels.length === 0) {
          await this.loadMealLabels();
        }
        const type = isRandomAll ? undefined : this.mealLabels.includes(label) ? 'meal' : 'cuisine';

        // ✅ 未登入 → 從 localStorage guestPrizes 篩出指定分類
        if (!this.isLoggedIn) {
          // 🔍 優先從 localStorage 讀取未登入者的暫存資料
          const saved = localStorage.getItem('guestPrizes');
          if (saved) {
            try {
              const parsed = JSON.parse(saved); // parsed: Prize[]
              if (this.model === '全部隨機') {
                this.prizes = parsed;
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const found = parsed.find((p: any) => p.label === label);
                this.prizes = found ? [found] : [];
              }
              return;
            } catch (e) {
              console.warn('❌ 讀取 guestPrizes 時 JSON 解析錯誤', e);
            }
          }

          // 🧾 localStorage 沒有，從後端 API 取得預設料理（僅限 cuisine 類型）
          try {
            const res = await api.get('/cuisineTypes');
            const prizeList = res.data ?? [];

            if (this.model === '全部隨機') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.prizes = prizeList.map((p: any) => ({
                label: p.label,
                items: p.items,
                selectedItem: null,
              }));
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const found = prizeList.find((p: any) => p.label === label);
              this.prizes = found ? [{ ...found, selectedItem: null }] : [];
            }
          } catch (err) {
            Notify.create({
              type: 'negative',
              message: '❌ 載入預設料理失敗',
              position: 'center',
            });
            console.error('[未登入] 無法從 API 載入 cuisineTypes', err);
          }

          return;
        }

        // ✅ 已登入 → 使用 type + label 查詢自訂資料
        const params: Record<string, string> = {};
        if (!isRandomAll) {
          params.type = type!;
          params.label = label;
        }

        console.log('[loadPrizes] 傳送參數', params);

        const res = await api.get('/user/custom-items', {
          headers: { Authorization: `Bearer ${useUserStore().token}` },
          params,
        });

        const filterType = res.data?.filterType;

        if (filterType === 'meal') {
          const label = res.data?.label ?? '未知時段';
          const items = res.data?.items ?? [];

          this.prizes = items.map((item: string) => ({
            label: item, // 顯示卡片時用
            items: [item], // 保持結構一致
            selectedItem: null,
            fromLabel: label, // ✅ 用來記錄原始分類
          }));
        } else {
          const raw = res.data?.customItems ?? {};
          this.prizes = Object.entries(raw).map(([label, items]) => ({
            label,
            items: items as string[],
            selectedItem: null,
          }));
        }
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: '無法載入料理清單',
          position: 'center',
        });
        console.error('loadPrizes failed:', err);
      }
    },

    // 開始抽取
    startLottery() {
      const userStore = useUserStore();
      const now = new Date();
      const hour = now.getHours();

      let mealKey: 'breakfast' | 'lunch' | 'dinner' | 'midnight';
      if (hour >= 3 && hour < 11) mealKey = 'breakfast';
      else if (hour >= 11 && hour < 15) mealKey = 'lunch';
      else if (hour >= 15 && hour < 21) mealKey = 'dinner';
      else mealKey = 'midnight';

      const oldDraw = userStore.foodDrawToday?.[mealKey]; // ⬅ 確保 mealKey 先定義好再取值

      if (oldDraw) {
        // 如果有抽取過，跳出提示
        Dialog.create({
          title: '已有推薦紀錄',
          message: `目前時段您已抽過餐點：${oldDraw}\n是否要重新抽取？`,
          ok: { label: '是，重新抽取', color: 'primary' },
          cancel: { label: '取消', color: 'grey' },
        }).onOk(() => {
          this.runLottery();
        });
        return;
      }

      this.runLottery();
    },

    // 抽取 function
    runLottery() {
      this.prizes.forEach((p) => (p.selectedItem = null));
      if (this.isRunning) return;

      const validPrizes = this.prizes.filter((p) => p.items.length > 0);

      console.log(
        '[可抽項目]',
        validPrizes.map((p) => `${p.label}: ${p.items.join(', ')}`),
      );

      if (validPrizes.length === 0) {
        Notify.create({
          type: 'warning',
          message: '目前沒有可抽的料理，請先新增！',
          position: 'center',
        });
        return;
      }

      this.isRunning = true;
      const finalPrize = validPrizes[Math.floor(Math.random() * validPrizes.length)]!;
      const finalIndex = this.prizes.findIndex((p) => p.label === finalPrize.label);
      const totalItems = this.prizes.length;
      const cycles = 3;
      const totalSteps = cycles * totalItems + finalIndex;
      let steps = 0;
      let speed = 80;
      let prevIndex = -1;

      const runStep = () => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * totalItems);
        } while (nextIndex === prevIndex);

        this.activeIndex = nextIndex;
        prevIndex = nextIndex;
        steps++;

        if (steps >= totalSteps) {
          if (this.timer) clearTimeout(this.timer);
          this.isRunning = false;
          this.activeIndex = finalIndex;
          setTimeout(() => {
            this.handleFinish(this.prizes[finalIndex]!);
          }, 800);
        } else {
          if (steps > totalSteps * 0.7) speed += 10;
          if (steps > totalSteps * 0.85) speed += 15;
          this.timer = setTimeout(runStep, speed);
        }
      };

      this.timer = setTimeout(runStep, speed);
      this.activeIndex = finalIndex;
    },

    // 儲存抽取結果與分配時段
    handleFinish(prize: {
      selectedItem: string | null;
      label: string;
      items: string[];
      fromLabel?: string;
    }) {
      const userStore = useUserStore();
      const now = new Date();
      const hour = now.getHours();

      const mealMap: Record<'breakfast' | 'lunch' | 'dinner' | 'midnight', string> = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        midnight: '宵夜',
      };

      let meal: keyof typeof mealMap;

      if (hour >= 3 && hour < 11) {
        meal = 'breakfast';
      } else if (hour >= 11 && hour < 15) {
        meal = 'lunch';
      } else if (hour >= 15 && hour < 21) {
        meal = 'dinner';
      } else {
        meal = 'midnight';
      }
      const oldDraw = userStore.foodDrawToday?.[meal];

      const itemIndex = Math.floor(Math.random() * prize.items.length);
      const selectedItem = prize.items[itemIndex] ?? null;
      prize.selectedItem = selectedItem;
      const fromLabel = prize.fromLabel ?? prize.label;
      const fullFood = `${fromLabel} - ${selectedItem}`;

      // ✅ 顯示在抽中的格子上

      prize.selectedItem = selectedItem;

      Dialog.create({
        title: `🍱 今日推薦：${fromLabel} - ${selectedItem}`,
        message: oldDraw
          ? `您已記錄過 ${oldDraw}。\n是否要覆蓋為 ${fullFood}？`
          : `要記錄此${mealMap[meal]}嗎？`,
        persistent: true,
        ok: { label: oldDraw ? '覆蓋記錄' : '記錄', color: 'primary' },
        cancel: { label: '取消', color: 'grey' },
      })
        .onOk(() => {
          if (!userStore.token) {
            userStore.setPendingDraw(meal, fullFood);
            userStore.showLoginModal = true;

            Notify.create({
              type: 'info',
              message: '請先登入以記錄推薦',
              position: 'center',
              timeout: 1500,
            });
            return;
          }

          // 呼叫 api /record/food-draw 將結果存至後端
          api
            .post('/record/food-draw', { meal, food: fullFood })
            .then(() => {
              Notify.create({
                type: 'positive',
                message: `🍽️ 已記錄${selectedItem}`,
                position: 'center',
                timeout: 1500,
              });
            })
            .catch(() => {
              Notify.create({
                type: 'negative',
                message: '儲存失敗，請稍後再試',
                position: 'center',
                timeout: 1500,
              });
            });
        })
        .onCancel(() => {
          console.log('🔴 使用者不記錄餐點');
          prize.selectedItem = null;
          this.activeIndex = -1;
        });
    },

    // 登入後會載入抽取紀錄
    async loadTodayDraw() {
      const userStore = useUserStore();
      if (!userStore.token) return;

      try {
        const res = await api.get('/record/food-draw/today', {
          headers: { Authorization: `Bearer ${userStore.token}` },
        });

        const meals = res.data?.meals;
        userStore.foodDrawToday = meals;
        if (!meals) return;

        const now = new Date();
        const hour = now.getHours();

        let meal: 'breakfast' | 'lunch' | 'dinner' | 'midnight';
        if (hour >= 3 && hour < 11) {
          meal = 'breakfast';
        } else if (hour >= 11 && hour < 15) {
          meal = 'lunch';
        } else if (hour >= 15 && hour < 21) {
          meal = 'dinner';
        } else {
          meal = 'midnight';
        }

        const record = meals[meal];
        if (!record || !record.includes(' - ')) return;

        const [label, selectedItem] = record.split(' - ');
        const index = this.prizes.findIndex((p) => p.label.trim() === label.trim());

        if (index !== -1) {
          const prize = this.prizes[index]!;
          prize.selectedItem = selectedItem;
          this.activeIndex = index;
        }
      } catch (err) {
        console.warn('[loadTodayDraw] 無法載入今日推薦', err);
      }
    },

    // 顯示料理彈窗，可新增／刪除料理
    showItemDetail(item: (typeof this.prizes)[number]) {
      const latest = this.prizes.find((p) => p.label === item.label);
      console.log('🧐 開啟 Dialog，當前料理為：', latest);
      if (!latest) return;

      this.dialog.label = latest.label;
      this.dialog.items = [...latest.items];
      this.dialog.newItem = '';
      this.dialog.targetPrize = latest;
      this.dialog.model = true;
    },
    async addDish() {
      const name = this.dialog.newItem.trim();
      if (!name || this.dialog.items.includes(name)) return;

      this.dialog.items.push(name);
      this.dialog.newItem = '';

      const prize = this.prizes.find((p) => p.label === this.dialog.label);
      if (prize) {
        prize.items = [...this.dialog.items];
      }

      if (this.dialog.targetPrize) {
        this.dialog.targetPrize.items = [...this.dialog.items];
      }

      // ✅ 若已登入，將新增項目同步寫入後端
      if (this.isLoggedIn) {
        try {
          await api.post(
            '/user/custom-items',
            {
              label: this.dialog.label,
              item: name,
            },
            {
              headers: {
                Authorization: `Bearer ${useUserStore().token}`,
              },
            },
          );
          console.log(`✅ 已同步新增「${name}」至後端`);
        } catch (err) {
          Notify.create({
            type: 'warning',
            message: `⚠️ 無法儲存 ${name}，已暫存於前端`,
          });
          console.warn('🔧 新增料理儲存失敗：', err);
        }
      }
    },

    // 刪除料理 (垃圾桶圖示)
    removeDish(index: number) {
      this.dialog.items.splice(index, 1);
    },

    // 儲存刪除或新增料理
    async saveDishEdit() {
      const label = this.dialog.label.trim();

      // ⬇️ 若輸入框還有新料理名稱也先加入
      const newDish = this.dialog.newItem.trim();
      if (newDish && !this.dialog.items.includes(newDish)) {
        this.dialog.items.push(newDish);
        this.dialog.newItem = '';
      }

      const finalItems = [...this.dialog.items]; // 最新的項目清單
      if (finalItems.length === 0) {
        this.prizes = this.prizes.filter((p) => p.label !== label);
      }
      const originalItems = this.dialog.targetPrize?.items ?? []; // 原本的項目清單

      // 差集比較
      const deletedItems = originalItems.filter((item) => !finalItems.includes(item));
      const addedItems = finalItems.filter((item) => !originalItems.includes(item));

      const prize = this.prizes.find((p) => p.label.trim() === label);
      if (!prize) {
        Notify.create({ type: 'negative', message: '找不到對應的料理分類！' });
        return;
      }

      prize.items = finalItems;
      if (this.dialog.targetPrize) {
        this.dialog.targetPrize.items = finalItems;
      }

      if (Array.isArray(this.prizes)) {
        const prize = this.prizes.find((p) => p.label === label);
        if (!prize) return;
        prize.items = finalItems;
      }

      if (this.isLoggedIn) {
        const headers = {
          Authorization: `Bearer ${useUserStore().token}`,
        };

        // 先處理刪除
        for (const item of deletedItems) {
          try {
            await api.delete('/user/custom-items', {
              data: { label, items: deletedItems },
              headers,
            });
          } catch (err) {
            console.warn(`❌ 刪除 ${item} 失敗`, err);
          }
        }

        // 再處理新增
        for (const item of addedItems) {
          try {
            await api.post('/user/custom-items', { label, item }, { headers });
            console.log(`✅ 已新增 ${item}`);
          } catch (err) {
            console.warn(`❌ 新增 ${item} 失敗`, err);
          }
        }
      } else {
        // 如果未登入則存在本地
        try {
          await nextTick();
          localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
          console.log(
            '[未登入] ✅ localStorage 更新完成',
            JSON.parse(localStorage.getItem('guestPrizes') || '[]'),
          );
        } catch (err) {
          console.error('[未登入] ❌ localStorage 寫入失敗', err);
        }
      }

      Notify.create({
        type: 'positive',
        message: `✅ 已更新 ${label}`,
      });

      this.dialog.model = false;
    },

    // 還原料理項目為預設
    resetToDefault() {
      Dialog.create({
        title: '重置確認',
        message: '是否清除自訂的料理項目並還原為預設？',
        ok: { label: '確定', color: 'primary' },
        cancel: { label: '取消', color: 'grey' },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
      }).onOk(async () => {
        if (this.isLoggedIn) {
          try {
            const res = await api.post(
              '/user/custom-items/reset',
              {},
              {
                headers: {
                  Authorization: `Bearer ${useUserStore().token}`,
                },
              },
            );

            const customItems = res.data?.customItems ?? {};
            this.prizes = Object.entries(customItems).map(([label, items]) => ({
              label,
              items: items as string[],
              selectedItem: null,
            }));

            Notify.create({
              type: 'positive',
              message: '✅ 已重置為預設料理清單',
              position: 'center',
            });
          } catch (err) {
            Notify.create({
              type: 'negative',
              message: '❌ 重置失敗，請稍後再試',
              position: 'center',
            });
            console.error('[resetToDefault][登入模式] 發生錯誤：', err);
          }
        } else {
          // 未登入（guest 模式）
          try {
            const res = await api.get('/cuisineTypes');
            const prizeArray = res.data ?? [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.prizes = prizeArray.map((item: any) => ({
              label: item.label,
              items: item.items,
              selectedItem: null,
            }));

            localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
            Notify.create({
              type: 'positive',
              message: '✅ 已重置為預設料理清單',
              position: 'center',
            });
          } catch (err) {
            Notify.create({
              type: 'negative',
              message: '❌ 重置失敗，請稍後再試',
              position: 'center',
            });
            console.error('[resetToDefault][未登入] 發生錯誤：', err);
          }
        }
      });
    },

    // 刪除料理類別 (XX料理右上角的 X)
    deletePrize(index: number) {
      const prize = this.prizes[index];
      if (!prize) return;

      const label = prize.label;

      // 若不是全部隨機（例如早餐類），則應該每個 label 是「一個料理」
      const isMealType = this.model !== '全部隨機';

      Dialog.create({
        title: '刪除確認',
        message: `是否刪除「${label}」這個料理類別？`,
        ok: { label: '刪除', color: 'red' },
        cancel: { label: '取消', color: 'grey' },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
      }).onOk(async () => {
        this.prizes.splice(index, 1);

        if (this.isLoggedIn) {
          try {
            const type = isMealType ? 'meal' : 'cuisine';

            const payload = isMealType
              ? {
                  type,
                  label: this.model,
                  items: [label], // ❗此時 label 是 item 名
                }
              : {
                  type,
                  label,
                  items: prize.items,
                };

            await api.delete('/user/custom-items', {
              data: payload,
              headers: {
                Authorization: `Bearer ${useUserStore().token}`,
              },
            });

            Notify.create({
              type: 'positive',
              message: `✅ 已刪除 ${label}`,
            });
          } catch (err) {
            Notify.create({
              type: 'warning',
              message: `⚠️ 刪除失敗，請稍後再試`,
            });
            console.warn(`[刪除失敗]`, err);
          }
        } else {
          try {
            localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
            Notify.create({
              type: 'positive',
              message: `✅ 已刪除 ${label}`,
            });
          } catch (err) {
            console.error('❌ localStorage 更新失敗：', err);
          }
        }
      });
    },

    // 開啟新增分類彈窗
    openNewCategoryDialog() {
      this.newCategoryLabel = '';
      this.newCategoryDialog = true;
    },

    // 新增料理項目
    async createNewCategory() {
      const label = this.newCategoryLabel.trim();
      if (!label) return;

      if (this.newCategoryNewItem.trim()) {
        this.newCategoryItems.push(this.newCategoryNewItem.trim());
      }

      const items = [...this.newCategoryItems];
      if (items.length === 0) {
        Notify.create({
          type: 'warning',
          message: '請至少新增一筆料理項目再建立分類',
        });
        return;
      }
      console.log('[新增分類內容]', { label, items });

      const newPrize = {
        label,
        items,
        selectedItem: null,
      };

      this.prizes.push(newPrize);

      this.newCategoryDialog = false;
      this.newCategoryItems = [];
      this.newCategoryLabel = '';
      this.newCategoryNewItem = '';

      if (this.isLoggedIn) {
        try {
          await api.post(
            '/user/custom-item/label',
            { label, items },
            { headers: { Authorization: `Bearer ${useUserStore().token}` } },
          );
          Notify.create({ type: 'positive', message: `✅ 已新增分類 ${label}` });
        } catch (err) {
          Notify.create({ type: 'negative', message: `❌ 新增分類失敗，已暫存於前端` });
          console.error('新增分類錯誤：', err);
        }
      } else {
        try {
          localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
          console.log('[未登入] ✅ 寫入 localStorage 完成:', this.prizes);
        } catch (err) {
          console.error('[未登入] ❌ 寫入 localStorage 失敗:', err);
        }
      }
    },

    // 在新增分類中新增料理
    addNewCategoryDish() {
      const name = this.newCategoryNewItem.trim();
      if (!name || this.newCategoryItems.includes(name)) return;

      this.newCategoryItems.push(name);
      this.newCategoryNewItem = '';
      console.log('[新增料理項目]', this.newCategoryItems);
    },
  },

  // 清除計時器 this.timer
  beforeUnmount() {
    if (this.timer) clearTimeout(this.timer);
  },
});
</script>

<style scoped>
.lottery-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid {
  width: 90vw;
  max-width: 350px;
  aspect-ratio: 1;
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #eee;
  border: 2px solid #ccc;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s;
}

.delete-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 10;
}

.grid-item.active {
  background: gold;
  border-color: orange;
}

.start-btn {
  padding: 10px 20px;
  font-size: 1.2rem;
  background: #2cb0ac;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.sub-text {
  font-size: 14px;
  color: #555;
  margin-top: 4px;
  .label-text {
    display: block;
    font-size: 16px;
    font-weight: bold;
  }

  .sub-text {
    display: block;
    font-size: 14px;
    color: #555;
    margin-top: 4px;
    animation: fadeIn 0.5s ease-in-out;
  }
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.time-label {
  font-size: 1.25rem;
  font-weight: bold;
}
</style>
