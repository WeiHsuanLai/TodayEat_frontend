<template>
  <div>
    <div class="text-h4 text-center q-ma-sm">目前時段:{{ currentMeal }}</div>
    <div class="lottery-container">
      <div class="grid" :style="gridStyle">
        <div
          v-for="(item, index) in prizes"
          :key="index"
          :class="['grid-item', { active: index === activeIndex }]"
        >
          <div class="label-text">{{ item.label }}</div>
          <div v-if="item.selectedItem" class="sub-text">{{ item.selectedItem }}</div>
        </div>
      </div>
      <button class="start-btn" @click="startLottery" :disabled="isRunning">
        {{ isRunning ? '推薦中...' : '今日推薦' }}
      </button>
    </div>
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
    };
  },
  watch: {
    isLoggedIn(newVal: boolean, oldVal: boolean) {
      if (newVal && !oldVal) {
        // 登入後觸發重新載入
        void this.loadPrizes().then(() => {
          void this.loadTodayDraw();
        });
      }
      if (!newVal) {
        this.prizes.forEach((p) => (p.selectedItem = null));
        console.log('[登出清除] selectedItem 已全部清空', this.prizes);
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
      this.prizes.forEach((p) => (p.selectedItem = null));
      if (this.isRunning) return;
      this.isRunning = true;

      const totalItems = this.prizes.length;
      const finalIndex = Math.floor(Math.random() * totalItems);
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

      const itemIndex = Math.floor(Math.random() * prize.items.length);
      const selectedItem = prize.items[itemIndex] ?? null;
      const fullFood = `${prize.label} - ${selectedItem}`;

      // ✅ 顯示在抽中的格子上

      prize.selectedItem = selectedItem;

      Dialog.create({
        title: `🍱 今日推薦：${prize.label}-${selectedItem}`,
        message: `\n要記錄此${mealMap[meal]}嗎？`,
        persistent: true,
        ok: { label: '記錄', color: 'primary' },
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
