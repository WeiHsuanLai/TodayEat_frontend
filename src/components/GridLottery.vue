<template>
  <div class="lottery-container">
    <div class="grid" :style="gridStyle">
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="['grid-item', { active: index === activeIndex }]"
      >
        <slot :item="item" :index="index">
          {{ item.label }}
        </slot>
      </div>
    </div>
    <button class="start-btn" @click="startLottery" :disabled="isRunning">
      {{ isRunning ? '抽獎中...' : '開始抽獎' }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';

export default defineComponent({
  name: 'GridLottery',
  props: {
    items: {
      type: Array as PropType<Array<{ label: string }>>,
      required: true,
    },
    winningIndex: Number,
  },
  data() {
    return {
      activeIndex: -1,
      isRunning: false,
      timer: null as ReturnType<typeof setTimeout> | null,
    };
  },
  computed: {
    gridStyle(): Record<string, string> {
      const count = Math.ceil(Math.sqrt(this.items.length));
      return {
        gridTemplateColumns: `repeat(${count}, 1fr)`,
      };
    },
  },
  methods: {
    startLottery() {
      if (this.isRunning) return;
      this.isRunning = true;

      const totalItems = this.items.length;
      const finalIndex = this.winningIndex ?? Math.floor(Math.random() * totalItems);
      const cycles = 3;
      const totalSteps = cycles * totalItems + finalIndex;
      let steps = 0;
      let speed = 80;

      const runStep = () => {
        this.activeIndex = (this.activeIndex + 1) % totalItems;
        steps++;

        if (steps >= totalSteps) {
          if (this.timer) clearTimeout(this.timer);
          this.isRunning = false;
          this.$emit('finish', this.items[finalIndex]);
        } else {
          if (steps > totalSteps * 0.7) speed += 10;
          if (steps > totalSteps * 0.85) speed += 15;
          this.timer = setTimeout(runStep, speed);
        }
      };

      this.timer = setTimeout(runStep, speed);
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
  width: 300px;
  height: 300px;
  margin-bottom: 20px;
}

.grid-item {
  display: flex;
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
</style>
