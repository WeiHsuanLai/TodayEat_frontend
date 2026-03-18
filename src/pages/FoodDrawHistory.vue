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
              :placeholder="t('searchHistoryPlaceholder')"
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
              <span v-else class="text-caption text-grey-4">{{ t('noNote') }}</span>
            </q-td>
          </template>

          <!-- 操作欄位 (編輯、地圖搜尋與刪除按鈕) -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="edit"
                size="sm"
                @click="openEditDialog(props.row)"
                class="q-mr-xs"
              >
                <q-tooltip>{{ t('editRecordTooltip') }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="secondary"
                icon="map"
                size="sm"
                @click="goToMapSearch(props.row.dishName)"
                class="q-mr-xs"
              >
                <q-tooltip>{{ t('searchOnMap') }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>{{ t('deleteRecordTooltip') }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- 空狀態 -->
          <template v-slot:no-data>
            <div class="full-width q-pa-xl flex flex-center">
              <div class="row items-center justify-center q-gutter-md text-grey-7">
                <q-icon name="history" size="48px" />
                <div class="text-h6 text-weight-medium">{{ t('noData') }}</div>
                <q-btn
                  unelevated
                  rounded
                  color="primary"
                  :label="t('startDraw')"
                  to="/draw"
                  icon="play_arrow"
                />
              </div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- 編輯彈窗 -->
    <q-dialog v-model="editDialog.show" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-primary">{{ t('editRecord') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-input
            v-model="editDialog.dishName"
            :label="t('dishName')"
            outlined
            dense
            class="q-mb-md"
            autofocus
          />
          <q-input
            v-model="editDialog.note"
            :label="t('note')"
            type="textarea"
            outlined
            dense
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary q-pa-md">
          <q-btn flat :label="t('cancel')" v-close-popup color="grey-7" />
          <q-btn
            unelevated
            :label="t('saveChanges')"
            color="primary"
            @click="handleSaveEdit"
            :loading="editDialog.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { foodApi, type FoodRecord } from 'src/api/food';
import { useQuasar } from 'quasar';
import { date } from 'quasar';

import { useUserStore } from 'src/stores/userStore';

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const loading = ref(false);
const filter = ref('');
const rawRecords = ref<Record<string, FoodRecord[]>>({});

// 編輯彈窗狀態
const editDialog = reactive({
  show: false,
  loading: false,
  id: '',
  dishName: '',
  note: '',
});

const pagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

const columns = computed(() => [
  {
    name: 'createdAt',
    label: t('dateTime'),
    field: 'createdAt',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'dishName',
    label: t('recommendedDish'),
    field: 'dishName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'note',
    label: t('note'),
    field: 'note',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: t('actions'),
    field: 'actions',
    align: 'center' as const,
  },
]);

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

function openEditDialog(record: FoodRecord) {
  editDialog.id = record._id;
  editDialog.dishName = record.dishName;
  editDialog.note = record.note || '';
  editDialog.show = true;
}

function goToMapSearch(dishName: string) {
  const targetPath = '/mapsearch';
  const targetQuery = { keyword: dishName };

  if (!userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: t('pleaseLogin'),
      position: 'center',
      timeout: 2000,
    });
    userStore.showLoginModal = true;
    userStore.loginRedirectPath = `${targetPath}?keyword=${encodeURIComponent(dishName)}`;
    return;
  }

  void router.push({
    path: targetPath,
    query: targetQuery,
  });
}

async function handleSaveEdit() {
  if (!editDialog.dishName.trim()) {
    $q.notify({ type: 'warning', message: '名稱不能為空', position: 'center' });
    return;
  }

  editDialog.loading = true;
  try {
    await foodApi.updateFoodRecord(editDialog.id, {
      dishName: editDialog.dishName,
      note: editDialog.note,
    });
    $q.notify({ type: 'positive', message: t('saveSuccess'), position: 'center' });
    editDialog.show = false;
    await fetchHistory(); // 重新整理列表
  } catch (error) {
    console.error('修改失敗:', error);
    $q.notify({ type: 'negative', message: t('saveFailed'), position: 'center' });
  } finally {
    editDialog.loading = false;
  }
}

function confirmDelete(record: FoodRecord) {
  $q.dialog({
    title: t('confirmDelete'),
    message: t('deleteConfirmationMsg', { dishName: record.dishName }),
    cancel: {
      flat: true,
      color: 'grey-8',
      label: t('cancel'),
    },
    ok: {
      unelevated: true,
      color: 'negative',
      label: t('delete'),
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await foodApi.deleteFoodRecord(record._id);
        $q.notify({
          type: 'positive',
          message: t('recordDeleted'),
          position: 'center',
        });
        await fetchHistory(); // 重新整理列表
      } catch (error) {
        console.error('刪除失敗:', error);
        $q.notify({
          type: 'negative',
          message: t('recordDeleteFailed'),
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

:deep(.q-table th),
:deep(.q-table td) {
  vertical-align: middle !important;
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
