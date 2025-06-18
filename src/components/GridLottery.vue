<template>
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
      prizes: [
        {
          label: '台式料理',
          items: ['滷肉飯', '蚵仔麵線', '鹹酥雞'],
          selectedItem: null as string | null,
        },
        {
          label: '中式料理',
          items: ['宮保雞丁', '糖醋里肌', '魚香茄子'],
          selectedItem: null as string | null,
        },
        {
          label: '日式料理',
          items: ['壽司', '拉麵', '親子丼'],
          selectedItem: null as string | null,
        },
        {
          label: '韓式料理',
          items: ['泡菜鍋', '石鍋拌飯', '辣炒年糕'],
          selectedItem: null as string | null,
        },
        { label: '美式料理', items: ['漢堡', '炸雞', '熱狗'], selectedItem: null as string | null },
        {
          label: '義式料理',
          items: ['義大利麵', '披薩', '燉飯'],
          selectedItem: null as string | null,
        },
        {
          label: '泰式料理',
          items: ['打拋豬', '綠咖哩', '酸辣湯'],
          selectedItem: null as string | null,
        },
        {
          label: '越南料理',
          items: ['河粉', '炸春捲', '牛肉飯'],
          selectedItem: null as string | null,
        },
        {
          label: '印度料理',
          items: ['咖哩雞', '烤餅', '坦都燒烤'],
          selectedItem: null as string | null,
        },
        {
          label: '港式料理',
          items: ['叉燒飯', '燒賣', '蘿蔔糕'],
          selectedItem: null as string | null,
        },
      ],
      activeIndex: -1,
      isRunning: false,
      timer: null as ReturnType<typeof setTimeout> | null,
    };
  },
  mounted() {
    void this.loadTodayDraw();
  },
  computed: {
    gridStyle(): Record<string, string> {
      const count = Math.ceil(Math.sqrt(this.prizes.length));
      return {
        gridTemplateColumns: `repeat(${count}, 1fr)`,
      };
    },
  },
  methods: {
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
  display: grid;
  gap: 10px;
  width: 480px;
  height: 400px;
  margin-bottom: 20px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #eee;
  border: 2px solid #ccc;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
}

.grid-item.active {
  background: gold;
  border-color: orange;
}

.start-btn {
  padding: 10px 20px;
  font-size: 18px;
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
