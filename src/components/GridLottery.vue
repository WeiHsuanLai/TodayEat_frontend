<!-- src/components/GridLottery.vue -->
<template>
  <div>
    <div class="header-row">
      <!-- 顯示目前時段（早餐／午餐／晚餐／消夜） -->
      <div class="time-label">目前時段:{{ currentMeal }}</div>

      <!-- 類別選擇器（料理國別／四個時段） -->
      <q-select
        v-model="model"
        :options="options"
        @update:model-value="handleSelectChange"
        label="抽取類別"
        dense
        style="min-width: 120px"
      />
      <!-- 新增料理類別 -->
      <q-btn
        icon="add"
        round
        dense
        color="primary"
        @click="openNewCategoryDialog(model)"
        :disable="isRunning"
        title="新增料理類別"
      />
    </div>
    <div class="text-center today-recommend">
      今日{{ currentMeal }}推薦：
      <span v-if="todayRecommendation" class="text-red">{{ todayRecommendation }}</span>
      <span v-else class="text-grey">尚未抽取</span>
    </div>

    <div class="flex flex-center">
      <div class="lottery-container col-6">
        <!-- 料理格子 -->
        <div class="grid">
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

            <!-- ✅ 新增圖片顯示 -->
            <q-img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              style="width: 90px; height: 90px; object-fit: cover"
            />

            <!-- 分類名稱與抽中料理 -->
            <div class="label-text">{{ item.label }}</div>
            <div v-if="item.selectedItem" class="sub-text">{{ item.selectedItem }}</div>

            <!-- 新增項目或刪除彈窗按鈕 -->
            <div v-if="model === '料理國別'" class="overlay-btn">
              <q-btn
                icon="add"
                flat
                round
                size="xs"
                @click="showItemDetail(item)"
                class="custom-overlay-button"
              />
            </div>
          </div>

          <!-- 新增分類按鈕 -->
          <div class="grid-item add-new" @click="handleAddNew">
            <q-icon name="add" size="md" color="primary" />
            <div class="label-text">{{ model === '料理國別' ? '新增分類' : '新增料理' }}</div>
          </div>
          <!-- 地圖搜尋格子 -->
          <div class="grid-item map-search" @click="handleMapSearch">
            <q-icon name="place" size="md" color="blue" />
            <div class="label-text">地圖搜尋</div>
          </div>
        </div>
      </div>
      <div class="col-6">
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
          <div class="scrollable-section">
            <q-item v-for="(dish, i) in dialog.items" :key="i" dense>
              <q-item-section>{{ dish }}</q-item-section>
              <!-- 刪除料理項目上的 X -->
              <q-item-section side>
                <q-btn dense flat icon="delete" color="red" @click="removeDish(i)" />
              </q-item-section>
            </q-item>
          </div>

          <!-- 新增料理 -->
          <q-input
            v-model="dialog.newItem"
            dense
            placeholder="Enter可輸入新料理"
            @keyup.enter="pushToTemp"
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
          <div class="text-h6">{{ newCategoryTitle }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <!-- 分類名稱 -->
          <q-input
            v-if="isAddingCategory"
            v-model="newCategoryLabel"
            placeholder="輸入分類名稱"
            dense
            outlined
          />
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
          <q-btn
            flat
            label="新增"
            color="primary"
            @click="
              createNewCategory().catch((err) => {
                console.error('[createNewCategory] 發生未處理錯誤', err);
              })
            "
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { api } from '../composables/axios';
import { Notify, Dialog } from 'quasar';
import { useUserStore } from 'src/stores/userStore';

// 清除陣列前後空白
function cleanArray(input: string[]): string[] {
  return input.map((i) => i.trim()).filter(Boolean);
}

// 清除單筆前後空白
function cleanString(s: string): string {
  return s.trim();
}

export default defineComponent({
  // name: 'GridLottery',
  data() {
    return {
      prizes: [] as {
        label: string;
        items: string[];
        selectedItem: string | null;
        fromLabel?: string;
        imageUrl?: string;
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
      model: '料理國別',
      options: ['料理國別'],
      mealLabels: [] as string[],
      newCategoryType: 'meal' as 'meal' | 'cuisine',
      newCategoryFromLabel: '' as string,
      isAddingCategory: false,
      newCategoryTitle: '新增料理',
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
        // ⬇️ 清空使用者自訂分類與選單
        this.mealLabels = [];
        this.options = ['料理國別'];

        // ✅ 重新載入預設資料
        void this.loadPrizes();
        console.log('[登出清除]  已載入預設料理清單');
      }
    },
  },

  mounted() {
    void this.loadPrizes().then(() => {
      void this.loadTodayDraw(); // 等載入完料理後再載入已抽紀錄
    });
  },
  computed: {
    isLoggedIn(): boolean {
      return useUserStore().token !== '';
    },
    currentMeal(): string {
      const hour = new Date().getHours();
      if (hour >= 3 && hour < 11) return '早餐';
      if (hour >= 11 && hour < 15) return '午餐';
      if (hour >= 15 && hour < 21) return '晚餐';
      return '宵夜';
    },
    todayRecommendation(): string | null {
      const userStore = useUserStore();
      const hour = new Date().getHours();
      let mealKey: 'breakfast' | 'lunch' | 'dinner' | 'midnight';

      if (hour >= 3 && hour < 11) mealKey = 'breakfast';
      else if (hour >= 11 && hour < 15) mealKey = 'lunch';
      else if (hour >= 15 && hour < 21) mealKey = 'dinner';
      else mealKey = 'midnight';

      return userStore.foodDrawToday?.[mealKey] ?? null;
    },
  },
  methods: {
    // 取得料理項目
    async loadMealLabels() {
      try {
        if (this.isLoggedIn) {
          const res = await api.get('/user/custom-items', {
            headers: { Authorization: `Bearer ${useUserStore().token}` },
            params: {
              type: 'meal',
              mode: 'labels',
            },
          });
          const labels = res.data?.labels ?? [];
          this.mealLabels = labels;
          this.options = ['料理國別', ...labels];
          console.log('🍱 已載入使用者自訂 labels:', labels);
        } else {
          const res = await api.get('/mealPresets');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const labels = res.data?.map((p: any) => p.label) ?? [];
          this.mealLabels = labels;
          this.options = ['料理國別', ...labels];
        }
      } catch (err) {
        console.error('[loadMealLabels] 無法載入分類標籤', err);
      }
    },
    // 載入料理格子
    async loadPrizes() {
      try {
        const label = this.model;
        const isRandomAll = label === '料理國別';
        // 根據選擇決定查詢類型（type)
        if (this.mealLabels.length === 0) {
          await this.loadMealLabels();
        }
        const type = isRandomAll ? undefined : this.mealLabels.includes(label) ? 'meal' : 'cuisine';

        // ✅ 未登入 → 從 localStorage guestPrizes 篩出指定分類
        if (!this.isLoggedIn) {
          console.log('⚠️ [未登入] 目前 model:', this.model);

          const key = `guestPrizes:${this.model}`;
          const timestampKey = `${key}:timestamp`;
          const saved = localStorage.getItem(key);
          const savedAt = localStorage.getItem(timestampKey);

          // ⏰ 設定過期時間（例如一天 = 86400000 毫秒）
          const isExpired = !savedAt || Date.now() - parseInt(savedAt) > 1000 * 60 * 60 * 24;

          if (saved && !isExpired) {
            try {
              const parsed = JSON.parse(saved); // parsed: Prize[]
              this.prizes = parsed;
              console.log('[guestPrizes] 已使用快取資料：', this.prizes);
              return;
            } catch (e) {
              console.warn(`❌ 讀取 ${key} 時 JSON 解析錯誤`, e);
            }
          }

          // 👉 若無快取或已過期，重新抓 API 並儲存
          if (this.model === '料理國別') {
            const res = await api.get('/cuisineTypes');
            const prizeList = res.data ?? [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.prizes = prizeList.map((p: any) => ({
              label: p.label,
              items: p.items,
              selectedItem: null,
              imageUrl: p.imageUrl || '',
            }));

            localStorage.setItem(key, JSON.stringify(this.prizes));
            localStorage.setItem(timestampKey, Date.now().toString());

            console.log('[guestPrizes] 🔄 快取已更新：', this.prizes);
            return;
          }

          const label = this.model;
          let apiEndpoint = '';
          console.log('⚠️ [進入前] 目前 model:', this.model);
          // localStorage 沒有 → 根據類型呼叫正確的 API
          try {
            if (this.model === '料理國別') {
              console.log('[路徑] 料理國別 (未登入)');
              apiEndpoint = '/cuisineTypes';
              const res = await api.get('/cuisineTypes');
              const prizeList = res.data ?? [];
              console.log(
                '[DEBUG] 回傳清單:',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                prizeList.map((p: any) => ({
                  label: p.label,
                  imageUrl: p.imageUrl,
                })),
              );

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.prizes = prizeList.map((p: any) => ({
                label: p.label,
                items: p.items,
                selectedItem: null,
                imageUrl: p.imageUrl || '',
              }));
              this.updateGuestPrizes();
            } else if (this.mealLabels.includes(this.model)) {
              console.log('[路徑] meal 類別 (未登入)');
              apiEndpoint = '/mealPresets';
              console.log('[未登入] model:', this.model, '| 使用 API:', apiEndpoint);
              // 是 meal 類別 → 呼叫 /mealPresets
              const res = await api.get('/mealPresets');
              const allMeals = res.data ?? [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const matched = allMeals.find((p: any) => p.label === label);
              if (matched) {
                this.prizes = matched.items.map((item: string) => ({
                  label: item,
                  items: [item],
                  selectedItem: null,
                  fromLabel: label,
                }));
              } else {
                this.prizes = [];
              }
            } else {
              console.log('[路徑] 單一 cuisine 類別 (未登入)');
              apiEndpoint = '/cuisineTypes';
              console.log('[未登入] model:', this.model, '| 使用 API:', apiEndpoint);
              // 單一 cuisine 類別
              const res = await api.get('/cuisineTypes');
              const prizeList = res.data ?? [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const found = prizeList.find((p: any) => p.label === label);
              this.prizes = found
                ? [
                    {
                      label: found.label,
                      items: found.items,
                      selectedItem: null,
                      imageUrl: found.imageUrl || '',
                    },
                  ]
                : [];
              console.log('[DEBUG] 搜尋目標 label:', label);
              console.log(
                '[DEBUG] 回傳清單:',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                prizeList.map((p: { label: any }) => p.label),
              );
            }
          } catch (err) {
            Notify.create({
              type: 'negative',
              message: '❌ 載入預設料理失敗',
              position: 'center',
            });
            console.error('[未登入] 無法從 API 載入預設料理', err);
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
        console.log('res', res);

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
          this.prizes = Object.entries(raw).map(([label, data]) => {
            const entry = data as { items: string[]; imageUrl?: string };
            return {
              label,
              items: Array.isArray(entry.items) ? entry.items : [],
              selectedItem: null,
              imageUrl: entry.imageUrl || '',
            };
          });
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

    // 建立本地資料維護
    updateGuestPrizes() {
      const key = `guestPrizes:${this.model}`;
      const data = this.prizes.map((p) => ({
        label: p.label,
        items: p.items,
        selectedItem: null,
        imageUrl: p.imageUrl || '',
      }));
      localStorage.setItem(key, JSON.stringify(data));

      // const msg = newItem ? `✅ 已儲存新料理：${newItem}` : `✅ 已更新 ${this.model} 分類資料`;
      // Notify.create({
      //   type: 'warning',
      //   message: msg,
      //   position: 'center',
      // });
      console.log(`[未登入] ✅ 更新 ${key}:`, data);
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
        title: `🍱 今日${this.currentMeal}推薦：${fromLabel} - ${selectedItem}`,
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
              // 同步更新抽過紀錄
              userStore.foodDrawToday = {
                ...userStore.foodDrawToday,
                [meal]: fullFood,
              };
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
        const index = this.prizes.findIndex((p) => cleanString(p.label) === cleanString(label));

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

    pushToTemp() {
      const name = cleanString(this.dialog.newItem);
      if (!name || this.dialog.items.includes(name)) return;

      this.dialog.items.push(name);
      this.dialog.newItem = '';
    },

    // 封裝 type 格式
    getItemType() {
      return this.model === '料理國別'
        ? 'cuisine'
        : this.mealLabels.includes(this.model)
          ? 'meal'
          : 'cuisine';
    },

    // 刪除料理 (垃圾桶圖示)
    removeDish(index: number) {
      this.dialog.items.splice(index, 1);
    },

    // 儲存刪除或新增料理
    async saveDishEdit() {
      const label = cleanString(this.dialog.label);

      // ⬇️ 若輸入框還有新料理名稱也先加入
      const newDish = this.dialog.newItem.trim();
      if (newDish && !this.dialog.items.includes(newDish)) {
        this.dialog.items.push(newDish);
        this.dialog.newItem = '';
      }

      const finalItems = cleanArray(this.dialog.items);
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
              data: {
                type: this.getItemType(),
                label,
                items: deletedItems,
              },
              headers,
            });
          } catch (err) {
            console.warn(`❌ 刪除 ${item} 失敗`, err);
          }
        }

        // 再處理新增
        for (const item of addedItems) {
          try {
            await api.post(
              '/user/custom-items',
              {
                type: this.getItemType(),
                label: this.dialog.label,
                item: [item],
              },
              {
                headers: {
                  Authorization: `Bearer ${useUserStore().token}`,
                },
              },
            );

            console.log(`✅ 已新增 ${item}`);
          } catch (err) {
            console.warn(`❌ 新增 ${item} 失敗`, err);
          }
        }
      } else {
        // 如果未登入則存在本地
        if (!this.isLoggedIn) {
          try {
            await nextTick();
            this.updateGuestPrizes();
          } catch (err) {
            console.error('[未登入] ❌ localStorage 寫入失敗', err);
          }
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
        const isRandomAll = this.model === '料理國別';
        const payload = isRandomAll ? { type: 'cuisine' } : { type: 'meal', label: this.model };

        if (this.isLoggedIn) {
          try {
            const res = await api.post('/user/custom-items/reset', payload, {
              headers: {
                Authorization: `Bearer ${useUserStore().token}`,
              },
            });

            const customItems = res.data?.customItems ?? {};
            this.prizes = Object.entries(customItems).map(([label, items]) => ({
              label,
              items: items as string[],
              selectedItem: null,
              imageUrl: '',
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
          // ✅ 未登入 → 根據 type 呼叫對應預設 API
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let prizeArray: any[] = [];

            if (isRandomAll) {
              const res = await api.get('/cuisineTypes');
              prizeArray = res.data ?? [];

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.prizes = prizeArray.map((item: any) => ({
                label: item.label,
                items: item.items,
                selectedItem: null,
                imageUrl: item.imageUrl,
              }));
              this.updateGuestPrizes();
            } else {
              const res = await api.get('/mealPresets');
              const allMeals = res.data ?? [];

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const matched = allMeals.find((p: any) => p.label === this.model);
              if (!matched) {
                Notify.create({
                  type: 'warning',
                  message: `⚠️ 找不到 ${this.model} 的預設項目`,
                  position: 'center',
                });
                return;
              }

              this.prizes = matched.items.map((item: string) => ({
                label: item,
                items: [item],
                selectedItem: null,
                imageUrl: '',
              }));

              this.updateGuestPrizes();
            }

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

      // 若不是料理國別（例如早餐類），則應該每個 label 是「一個料理」
      const isMealType = this.model !== '料理國別';
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

      Dialog.create({
        title: '刪除確認',
        message: `是否刪除「${label}」？`,
        ok: { label: '刪除', color: 'red' },
        cancel: { label: '取消', color: 'grey' },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
      }).onOk(async () => {
        this.prizes.splice(index, 1);

        if (this.isLoggedIn) {
          try {
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
          if (!this.isLoggedIn) {
            this.updateGuestPrizes();
            try {
              Notify.create({
                type: 'positive',
                message: `✅ 已刪除 ${label}`,
              });
            } catch (err) {
              console.error('❌ localStorage 更新失敗：', err);
            }
          }
        }
      });
    },

    // 開啟新增分類彈窗
    openNewCategoryDialog(fromModel: string) {
      console.log('開啟新增類別');
      this.isAddingCategory = true;
      this.newCategoryLabel = '';
      this.newCategoryDialog = true;
      this.newCategoryType = 'meal';
      this.newCategoryFromLabel = fromModel;
      this.newCategoryTitle = '新增料理類別';
    },

    // 新增料理項目
    async createNewCategory() {
      const type = this.newCategoryType;
      const label =
        this.isAddingCategory && this.newCategoryLabel
          ? cleanString(this.newCategoryLabel)
          : cleanString(this.newCategoryFromLabel);

      // 若輸入框還有一筆新料理，先 push 進去
      if (this.newCategoryNewItem.trim()) {
        const trimmed = this.newCategoryNewItem.trim();
        if (trimmed && !this.newCategoryItems.includes(trimmed)) {
          this.newCategoryItems.push(trimmed);
        }
        this.newCategoryNewItem = '';
      }

      const items = cleanArray(this.newCategoryItems);
      if (items.length === 0) {
        Notify.create({
          type: 'warning',
          message: '請至少新增一筆料理項目再建立分類',
        });
        return;
      }

      if (this.model === '料理國別') {
        const newPrize = {
          label,
          items,
          selectedItem: null,
        };
        this.prizes.push(newPrize);
      } else {
        // 其他模式下，每筆料理為一個 prize（同分類）
        for (const item of items) {
          this.prizes.push({
            label: item,
            items: [item],
            selectedItem: null,
            fromLabel: label, // ➜ = model, ex: 早餐類
          });
        }
      }

      // this.prizes.push(newPrize);

      // 清空 UI 狀態
      this.newCategoryDialog = false;
      this.newCategoryItems = [];
      this.newCategoryLabel = '';
      this.newCategoryNewItem = '';

      if (this.isLoggedIn) {
        try {
          const payload = { label, items, type };
          console.log('[createNewCategory] 傳送 payload:', payload);

          await api.post('/user/custom-items/label', payload, {
            headers: { Authorization: `Bearer ${useUserStore().token}` },
          });
          Notify.create({ type: 'positive', message: `✅ 已新增分類 ${label}` });
          await this.loadPrizes();
          await this.loadMealLabels();
        } catch (error: unknown) {
          const err = error as { response?: { status?: number } };
          if (err.response?.status === 409) {
            const added: string[] = [];
            const skipped: string[] = [];

            for (const item of items) {
              try {
                await api.post(
                  '/user/custom-items',
                  { label, item, type },
                  {
                    headers: { Authorization: `Bearer ${useUserStore().token}` },
                  },
                );
                added.push(item);
                console.log(`✅ 成功新增 ${item}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (itemErr: any) {
                if (itemErr?.response?.status === 409) {
                  console.warn(`⚠️ ${item} 已存在，跳過`);
                  skipped.push(item); // ✅ 補上這行
                } else {
                  console.error(`❌ 新增 ${item} 失敗`, itemErr);
                  Notify.create({
                    type: 'negative',
                    message: `❌ 無法新增 ${item}，請稍後再試`,
                  });
                }
              }
            }

            if (added.length || skipped.length) {
              const message = [
                added.length ? `✅ 已新增：${added.join('、')}` : '',
                skipped.length ? `⚠️ 已跳過重複料理：${skipped.join('、')}` : '',
              ]
                .filter(Boolean)
                .join('\n');

              Notify.create({
                type: 'info',
                message,
                position: 'center',
                timeout: 5000,
                multiLine: true,
              });
            }

            // 重新載入資料
            this.newCategoryDialog = false;
            await this.loadMealLabels();
            // await this.loadPrizes();
            this.model = label;
            console.log('載入的資料', this.model);

            this.handleSelectChange(this.model);
          } else {
            Notify.create({ type: 'negative', message: `❌ 新增分類失敗，已暫存於前端` });
            console.error('新增分類錯誤：', error);
          }
        }
      } else {
        try {
          this.updateGuestPrizes();
          Notify.create({
            type: 'info',
            message: `🔒 未登入，資料已儲存在裝置中`,
          });
        } catch (err) {
          console.error('[未登入] ❌ localStorage 寫入失敗:', err);
        }
      }
    },

    // 在新增分類中新增料理
    addNewCategoryDish() {
      const name = cleanString(this.newCategoryNewItem);
      if (!name || this.newCategoryItems.includes(name)) return;

      this.newCategoryItems.push(name);
      this.newCategoryNewItem = '';
      console.log('[新增料理項目]', this.newCategoryItems);
    },

    handleAddNew() {
      this.isAddingCategory = this.model === '料理國別'; // ✅ 決定是否可編輯分類
      this.newCategoryFromLabel = this.model;
      this.newCategoryLabel = this.isAddingCategory ? '' : this.model;
      this.newCategoryItems = [];
      this.newCategoryNewItem = '';
      this.newCategoryDialog = true;
      this.newCategoryTitle = this.isAddingCategory ? '新增分類' : '新增料理';
    },
    handleSelectChange(value: string) {
      this.model = value;
      this.activeIndex = -1;
      void this.loadPrizes().then(() => {
        // 等資料載入後再檢查有沒有今日推薦
        this.applyTodayDrawHighlight();
      });
    },
    applyTodayDrawHighlight() {
      const userStore = useUserStore();
      const meals = userStore.foodDrawToday;
      if (!meals) return;

      const hour = new Date().getHours();
      let meal: 'breakfast' | 'lunch' | 'dinner' | 'midnight';
      if (hour >= 3 && hour < 11) meal = 'breakfast';
      else if (hour >= 11 && hour < 15) meal = 'lunch';
      else if (hour >= 15 && hour < 21) meal = 'dinner';
      else meal = 'midnight';

      const record = meals[meal];
      if (!record || !record.includes(' - ')) return;

      const [label, selectedItem] = record.split(' - ');
      if (!label) return;
      const index = this.prizes.findIndex((p) => cleanString(p.label) === cleanString(label));
      if (index !== -1) {
        this.prizes[index]!.selectedItem = selectedItem ?? null;
        this.activeIndex = index;
      }
    },
    handleMapSearch() {
      const userStore = useUserStore();
      // 判斷目前是哪一餐
      const hour = new Date().getHours();
      let mealKey: 'breakfast' | 'lunch' | 'dinner' | 'midnight';

      if (hour >= 3 && hour < 11) mealKey = 'breakfast';
      else if (hour >= 11 && hour < 15) mealKey = 'lunch';
      else if (hour >= 15 && hour < 21) mealKey = 'dinner';
      else mealKey = 'midnight';

      const drawn = userStore.foodDrawToday?.[mealKey];

      if (!drawn) {
        Dialog.create({
          title: '地圖搜尋今日推薦料理',
          message: `您尚未抽取今日${this.currentMeal}推薦，要現在抽取嗎？`,
          ok: { label: '是，馬上抽', color: 'primary' },
          cancel: { label: '取消', color: 'grey' },
        }).onOk(() => {
          this.startLottery();
        });
        return;
      }

      Dialog.create({
        message: `已經抽過今日推薦，是否搜尋附近店家?`,
        ok: { label: '是', color: 'primary' },
        cancel: { label: '取消', color: 'grey' },
      }).onOk(() => {
        const keyword = drawn.split(' - ').pop() ?? drawn;
        void this.$router.push({ name: 'MapSearch', query: { keyword } });
      });
    },
    // 已經到 methods 底部了
  },

  // 清除計時器 this.timer
  beforeUnmount() {
    if (this.timer) clearTimeout(this.timer);
  },
});
</script>

<style scoped>
.lottery-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.grid {
  width: 90vw;
  max-width: 650px;
  min-height: 400px; /* ✅ 明確高度 */
  max-height: 600px;
  overflow-x: hidden;
  overflow-y: auto; /* ✅ 垂直捲動 */
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  padding: 5px;
  box-sizing: border-box;
}

.grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 110px;
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

.scrollable-section {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;
}

.today-recommend {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 16px;
}

.overlay-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.6); /* 半透明白底 */
  border-radius: 50%;
  padding: 4px;
  z-index: 5;
}

.custom-overlay-button {
  background-color: rgba(255, 255, 255, 0.1); /* 半透明白底 */
  border: 1px solid #ccc; /* 淡灰邊框 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
</style>
