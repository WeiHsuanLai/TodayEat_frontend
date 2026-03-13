<!-- src/pages/LoginHistory.vue - 登入歷史紀錄 -->
<template>
  <q-page class="q-pa-md row items-center justify-center">
    <div class="col-12 col-md-10 col-lg-8">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        flat
        bordered
        :no-data-label="t('noData')"
        :pagination="{ rowsPerPage: 10 }"
        style="height: 80vh; min-height: 400px;"
        class="bg-transparent my-sticky-header-table"
      >
        <template v-slot:top>
          <div class="row full-width items-center q-py-sm">
            <q-space />
            <q-btn flat round dense icon="refresh" @click="fetchData" />
          </div>
          <q-separator style="margin-left: -16px; margin-right: -16px; width: calc(100% + 32px);" />
        </template>

        <template v-slot:body-cell-userAgent="props">
          <q-td :props="props">
            <div class="cursor-pointer text-grey-8" style="font-size: 0.85rem">
              {{ props.value }}
              <q-tooltip anchor="top middle" self="bottom middle" max-width="300px" style="word-break: break-all;">
                {{ props.value }}
              </q-tooltip>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-action="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'login' ? 'positive' : 'grey-7'">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-timestamp="props">
          <q-td :props="props">
            {{ formatDate(props.value) }}
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/userStore';
import { userApi, type LoginLog } from 'src/api';
import type { QTableColumn } from 'quasar';
import { date } from 'quasar';

const { t } = useI18n();
const userStore = useUserStore();

const loading = ref(false);
const rows = ref<LoginLog[]>([]);

const columns = computed<QTableColumn<LoginLog>[]>(() => {
  const baseColumns: QTableColumn<LoginLog>[] = [
    { name: 'timestamp', align: 'center', label: '登入時間', field: 'timestamp', sortable: true },
    { name: 'ip', align: 'center', label: 'IP 地址', field: 'ip' },
    { name: 'userAgent', align: 'center', label: '裝置資訊', field: 'userAgent', style: 'max-width: 250px; white-space: normal; word-break: break-all;' },
    { name: 'action', align: 'center', label: '動作', field: 'action' },
  ];

  if (userStore.role === 1) {
    baseColumns.splice(1, 0, { name: 'account', align: 'center', label: '帳號', field: 'account' });
    baseColumns.splice(2, 0, { name: 'email', align: 'center', label: 'Email', field: 'email' });
  }

  return baseColumns;
});

function formatDate(val: string) {
  return date.formatDate(val, 'YYYY-MM-DD HH:mm:ss');
}

async function fetchData() {
  loading.value = true;
  try {
    const response = userStore.role === 1 
      ? await userApi.getAdminLoginLogs()
      : await userApi.getLoginLogs();

    if (response.data.success) {
      rows.value = response.data.logs;
    }
  } catch (error) {
    console.error('Failed to fetch login history:', error);
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void fetchData();
});
</script>

<style lang="scss">
.my-sticky-header-table {
  /* height or max-height is important */
  height: 80vh;
  min-height: 400px;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #fff;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
  }

  /* prevent scrolling the whole page instead of just the table */
  overflow: hidden;
}
</style>
