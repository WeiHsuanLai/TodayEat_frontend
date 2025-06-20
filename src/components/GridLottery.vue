<template>
  <div>
    <div class="text-h4 text-center q-ma-sm">目前時段:{{ currentMeal }}</div>
    <div class="lottery-container">
      <div class="grid" :style="gridStyle">
        <div
          v-for="(item, index) in prizes"
          :key="index"
          :class="['grid-item', { active: index === activeIndex }]"
          size="sm"
          :title="item.items.join(', ')"
        >
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
          <div class="label-text">{{ item.label }}</div>
          <div v-if="item.selectedItem" class="sub-text">{{ item.selectedItem }}</div>
          <q-btn
            icon="add"
            color="primary"
            class="q-my-xs"
            round
            size="xs"
            @click="showItemDetail(item)"
          />
        </div>
        <div class="grid-item add-new" @click="openNewCategoryDialog">
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
    <q-dialog v-model="dialog.model">
      <q-card style="min-width: 300px; max-width: 90vw">
        <q-card-section>
          <div class="text-h6">{{ dialog.label }} 的料理管理</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-y-sm">
          <q-item v-for="(dish, i) in dialog.items" :key="i" dense>
            <q-item-section>{{ dish }}</q-item-section>
            <q-item-section side>
              <q-btn dense flat icon="delete" color="red" @click="removeDish(i)" />
            </q-item-section>
          </q-item>

          <q-input
            v-model="dialog.newItem"
            dense
            placeholder="輸入新料理"
            @keyup.enter="addDish"
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" @click="dialog.model = false" />
          <q-btn flat label="儲存" color="primary" @click="saveDishEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
            placeholder="輸入新料理（按 Enter 加入）"
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
import { defineComponent } from 'vue';
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
      }[],
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
      },
      newCategoryDialog: false,
      newCategoryLabel: '',
      newCategoryItems: [] as string[],
      newCategoryNewItem: '',
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
    async loadPrizes() {
      try {
        const endpoint = this.isLoggedIn ? '/user/custom-items' : '/prizes';
        const config = this.isLoggedIn
          ? { headers: { Authorization: `Bearer ${useUserStore().token}` } }
          : {};

        const res = await api.get(endpoint, config);

        if (this.isLoggedIn) {
          console.log('登入後回傳資料:', res.data);
          const customItems = res.data?.customItems ?? {};
          this.prizes = Object.entries(customItems).map(([label, items]) => ({
            label,
            items: items as string[],
            selectedItem: null,
          }));
        } else {
          console.log('登入前回傳資料:', res.data);
          // ⚠️ 這裡是未登入時的格式：直接是一個陣列
          const stored = localStorage.getItem('guestPrizes');
          if (stored) {
            this.prizes = JSON.parse(stored);
            console.log('載入 localStorage 中的未登入料理列表');
            return;
          }

          const prizeArray = res.data ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.prizes = prizeArray.map((item: any) => ({
            label: item.label,
            items: item.items,
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

    runLottery() {
      this.prizes.forEach((p) => (p.selectedItem = null));
      if (this.isRunning) return;

      const validPrizes = this.prizes.filter((p) => p.items.length > 0);
      if (validPrizes.length === 0) {
        Notify.create({
          type: 'warning',
          message: '目前沒有可抽的料理，請先新增！',
          position: 'center',
        });
        return;
      }

      this.isRunning = true;
      const totalItems = this.prizes.length;
      const finalIndex = Math.floor(Math.random() * validPrizes.length);
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

    handleFinish(prize: { selectedItem: string | null; label: string; items: string[] }) {
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
      const fullFood = `${prize.label} - ${selectedItem}`;

      // ✅ 顯示在抽中的格子上

      prize.selectedItem = selectedItem;

      Dialog.create({
        title: `🍱 今日推薦：${prize.label}-${selectedItem}`,
        message: oldDraw
          ? `您已記錄過 ${oldDraw}。\n是否要覆蓋為 ${fullFood}？`
          : `要記錄此${mealMap[meal]}嗎？`,
        persistent: true,
        ok: { label: oldDraw ? '覆蓋記錄' : '記錄', color: 'primary' },
        cancel: { label: '取消', color: 'grey' },
      }).onOk(() => {
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
      });
    },

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
      console.log('[addDish] isLoggedIn:', this.isLoggedIn);

      console.log('[addDish] label:', this.dialog.label, 'name:', name);
    },
    removeDish(index: number) {
      this.dialog.items.splice(index, 1);
    },

    saveDishEdit() {
      void this.addDish();
      const label = this.dialog.label.trim();

      // ⬇️ 如果輸入框還有新內容，先補進 dialog.items
      const newDish = this.dialog.newItem.trim();
      if (newDish && !this.dialog.items.includes(newDish)) {
        this.dialog.items.push(newDish);
        this.dialog.newItem = '';
      }

      const newItems = [...this.dialog.items];

      const prize = this.prizes.find((p) => p.label.trim() === label);
      if (!prize) {
        Notify.create({ type: 'negative', message: '找不到對應的料理分類！' });
        return;
      }

      prize.items = newItems;

      if (this.dialog.targetPrize) {
        this.dialog.targetPrize.items = newItems;
      }

      if (!this.isLoggedIn) {
        try {
          localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
          console.log('🔄 寫入 localStorage 成功:', JSON.stringify(this.prizes));
        } catch (err) {
          console.error('❌ 寫入 localStorage 失敗', err);
        }
      }

      console.log('🧾 localStorage 目前內容：', localStorage.getItem('guestPrizes'));

      Notify.create({
        type: 'positive',
        message: `✅ 已更新 ${label}`,
      });

      this.dialog.model = false;
    },

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
            const res = await api.get('/prizes');
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
    deletePrize(index: number) {
      const prize = this.prizes[index];
      if (!prize) return;

      const label = prize.label;

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
            await api.delete('/user/custom-item/label', {
              data: { label }, // DELETE 方法的 payload 需放 data 屬性
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
              message: `⚠️ 後端刪除 ${label} 失敗（已從前端移除）`,
            });
            console.warn(`[刪除失敗] label=${label}`, err);
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

    openNewCategoryDialog() {
      this.newCategoryLabel = '';
      this.newCategoryDialog = true;
    },

    async createNewCategory() {
      const label = this.newCategoryLabel.trim();
      if (!label) return;

      const items = [...this.newCategoryItems];

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
        localStorage.setItem('guestPrizes', JSON.stringify(this.prizes));
        Notify.create({ type: 'positive', message: `✅ 已新增分類 ${label}` });
      }
    },

    addNewCategoryDish() {
      const name = this.newCategoryNewItem.trim();
      if (!name || this.newCategoryItems.includes(name)) return;

      this.newCategoryItems.push(name);
      this.newCategoryNewItem = '';
    },
  },
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
</style>
