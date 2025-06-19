<template>
  <q-page class="q-pa-md flex items-center column">
    <q-list bordered class="rounded-borders q-mt-md" style="width: 100%; max-width: 500px">
      <template v-for="(item, index) in recordList" :key="item.id">
        <q-item clickable>
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
            <q-item-label caption>{{ item.subtitle }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="index < recordList.length - 1" />
      </template>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Notify } from 'quasar';
import { useApi } from 'src/composables/axios';

const { api } = useApi();

interface RecordItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

interface ApiResponse {
  records: {
    _id: string;
    date: string;
    meal: 'breakfast' | 'lunch' | 'dinner' | 'midnight';
    food: string;
    updatedAt: string;
  }[];
}

const recordList = ref<RecordItem[]>([]);

// icon 對照表
const mealIconMap: Record<string, string> = {
  breakfast: 'free_breakfast',
  lunch: 'lunch_dining',
  dinner: 'restaurant',
  midnight: 'nightlife',
};

// 餐次中文
const mealLabelMap: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  midnight: '宵夜',
};

const fetchRecords = async () => {
  try {
    const res = await api.get<ApiResponse>('/record/food-draw/all');

    recordList.value = res.data.records.map((r) => ({
      id: r._id,
      icon: mealIconMap[r.meal] ?? 'restaurant',
      title: `${r.date} ${mealLabelMap[r.meal] ?? r.meal}`,
      subtitle: r.food,
    }));
  } catch {
    Notify.create({
      type: 'negative',
      message: '讀取紀錄失敗',
      position: 'center',
    });
  }
};

onMounted(fetchRecords);
</script>
