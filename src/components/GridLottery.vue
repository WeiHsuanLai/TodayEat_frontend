<template>
  <div class="lottery-wrapper q-pa-md">
    <h3 class="text-h5 q-mb-md">今天吃什麼</h3>

    <!-- 輸入獎項 -->
    <div class="q-gutter-sm row items-center">
      <q-input v-model="prizeInput" label="輸入菜品" dense filled @keyup.enter="addPrize" />
      <q-btn label="新增" color="primary" @click="addPrize" />
      <q-btn label="清除" flat color="negative" @click="clearPrizes" />
    </div>

    <!-- 九宮格 -->
    <div class="grid q-mt-none">
      <div
        v-for="(item, index) in gridDisplay"
        :key="index"
        class="grid-item"
        :class="{ active: index === currentIndex }"
      >
        {{ item }}
      </div>
    </div>
    <div class="row items-center q-gutter-md">
      <div>
        <q-btn
          label="開始"
          color="accent"
          @click="startDraw"
          :disable="isDrawing || prizes.length < 1"
        />
      </div>

      <div v-if="winner !== null">🎉 今日推薦：{{ winner }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// 資料型別定義
const prizeInput = ref<string>('');
const prizes = ref<string[]>([]);
const winner = ref<string | null>(null);
const isDrawing = ref(false);
const currentIndex = ref<number>(-1);

// 外圍格子順時針位置：共 8 格（第 4 格為 start 按鈕）
const positions: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// 計算顯示用的九宮格陣列
const gridDisplay = computed(() => {
  const layout: (string | null)[] = Array(9).fill(null);
  prizes.value.forEach((item, i) => {
    if (i < positions.length) {
      layout[positions[i]!] = item;
    }
  });
  return layout;
});

// 新增獎項
function addPrize(): void {
  const name = prizeInput.value.trim();
  if (name && prizes.value.length < 9 && !prizes.value.includes(name)) {
    prizes.value.push(name);
    prizeInput.value = '';
  }
}

// 清除獎項
function clearPrizes(): void {
  prizes.value = [];
  winner.value = null;
  currentIndex.value = -1;
}

// 抽獎邏輯
function startDraw(): void {
  if (isDrawing.value || prizes.value.length === 0) return;

  winner.value = null;
  isDrawing.value = true;
  let count = 0;
  const totalSteps = 30 + Math.floor(Math.random() * 10);

  const interval = setInterval(() => {
    currentIndex.value = positions[count % positions.length]!;
    count++;

    if (count > totalSteps) {
      clearInterval(interval);
      const winIdx = currentIndex.value;
      const result = gridDisplay.value[winIdx];
      winner.value = result || '未命名獎項';
      isDrawing.value = false;
    }
  }, 100);
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 8px;
  padding: 10px;
  justify-content: center;
  align-items: center;
}
.grid-item {
  width: 100%;
  height: 100%;
  border: 2px solid #ccc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  background: white;
  font-size: 1.1rem;
  transition: background-color 0.3s ease;
}
.grid-item.active {
  background-color: #fdd835;
  border-color: #fbc02d;
}
</style>
