<!-- src/pages/FoodDrawHistory.vue - 美食抽取紀錄 -->
<template>
  <q-page class="q-pa-md">
    <div class="max-width-container mx-auto">
      <div class="row items-center q-mb-lg">
        <q-btn
          flat
          round
          icon="arrow_back"
          color="primary"
          @click="router.back()"
          class="q-mr-sm"
        />
        <h1 class="text-h5 text-weight-bold q-my-none text-primary">{{ t('foodDrawHistory') }}</h1>
      </div>

      <q-card flat bordered class="shadow-1">
        <q-table
          :rows="tableRows"
          :columns="columns"
          row-key="_id"
          :loading="loading"
          :filter="filter"
          :pagination="pagination"
          flat
          class="history-table"
        >
          <template v-slot:top-right>
            <q-input
              v-model="filter"
              dense
              outlined
              placeholder="搜尋餐點或備註..."
              class="q-ml-md"
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <!-- 格式化日期與時間 -->
          <template v-slot:body-cell-createdAt="props">
            <q-td :props="props">
              <div>{{ formatDate(props.value) }}</div>
              <div class="text-caption text-grey-6">{{ formatTime(props.value) }}</div>
            </q-td>
          </template>

          <!-- 備註欄位處理 -->
          <template v-slot:body-cell-note="props">
            <q-td :props="props">
              <span v-if="props.value" class="text-body2">{{ props.value }}</span>
              <span v-else class="text-caption text-grey-4">無備註</span>
            </q-td>
          </template>

          <!-- 操作欄位 (刪除按鈕) -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>刪除紀錄</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- 空狀態 -->
          <template v-slot:no-data>
            <div class="full-width row flex-center q-pa-xl text-grey-7">
              <q-icon name="history" size="48px" class="q-mb-md" />
              <div class="text-h6">尚無任何抽取紀錄</div>
              <q-btn flat color="primary" label="前往抽獎" to="/draw" class="q-mt-md" />
            </div>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { foodApi, type FoodRecord } from 'src/api/food';
import { useQuasar } from 'quasar';
import { date } from 'quasar';

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const filter = ref('');
const rawRecords = ref<Record<string, FoodRecord[]>>({});

const pagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

const columns = [
  {
    name: 'createdAt',
    label: '日期/時間',
    field: 'createdAt',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'dishName',
    label: '推薦餐點',
    field: 'dishName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'note',
    label: '備註',
    field: 'note',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: '操作',
    field: 'actions',
    align: 'center' as const,
  },
];

// 將 API 回傳的分組資料攤平成一維陣列供 q-table 使用
const tableRows = computed(() => {
  const rows: FoodRecord[] = [];
  Object.values(rawRecords.value).forEach((records) => {
    rows.push(...records);
  });
  return rows;
});

onMounted(async () => {
  await fetchHistory();
});

async function fetchHistory() {
  loading.value = true;
  try {
    const res = await foodApi.getMyFoodRecords();
    if (res.data.success) {
      rawRecords.value = res.data.result;
    }
  } catch (error) {
    console.error('獲取紀錄失敗:', error);
    $q.notify({
      type: 'negative',
      message: '載入歷史紀錄失敗，請稍後再試',
      position: 'center',
    });
  } finally {
    loading.value = false;
  }
}

function confirmDelete(record: FoodRecord) {
  $q.dialog({
    title: '確認刪除',
    message: `您確定要刪除「${record.dishName}」這筆推薦紀錄嗎？`,
    cancel: {
      flat: true,
      color: 'grey-8',
      label: '取消',
    },
    ok: {
      unelevated: true,
      color: 'negative',
      label: '刪除',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await foodApi.deleteFoodRecord(record._id);
        $q.notify({
          type: 'positive',
          message: '紀錄已成功刪除',
          position: 'center',
        });
        await fetchHistory(); // 重新整理列表
      } catch (error) {
        console.error('刪除失敗:', error);
        $q.notify({
          type: 'negative',
          message: '刪除失敗，請稍後再試',
          position: 'center',
        });
      }
    })();
  });
}

function formatDate(dateStr: string) {
  return date.formatDate(dateStr, 'YYYY-MM-DD');
}

function formatTime(dateStr: string) {
  return date.formatDate(dateStr, 'HH:mm:ss');
}
</script>

<style scoped>
.max-width-container {
  max-width: 900px;
}

.history-table {
  background: white;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

:deep(.q-table th) {
  font-weight: 700;
  color: #555;
  background-color: #f8f9fa;
}

.history-table :deep(.q-table__card) {
  box-shadow: none;
}
</style>
