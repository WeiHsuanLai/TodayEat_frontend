<!-- src/components/GridLottery.vue - 九宮格抽獎元件 -->
<template>
  <div class="lottery-container q-pa-lg">
    <div class="row q-col-gutter-xl items-center justify-center" style="min-height: 80vh">
      <!-- 左側：九宮格抽獎區 -->
      <div class="col-12 col-md-6 column items-center">
        <h3 class="text-h5 q-mb-lg text-weight-bold text-center">{{ t('whatToEatToday') }}</h3>

        <!-- 九宮格 (動態 N x N) -->
        <div class="grid-box relative-position" :style="gridContainerStyle">
          <div class="grid" :style="gridStyle">
            <div
              v-for="(item, index) in displayPrizes"
              :key="index"
              class="grid-item shadow-1"
              :class="{ active: index === currentIndex && item !== '', empty: item === '' }"
              :style="itemStyle"
            >
              {{ item }}
              <q-btn
                v-if="item !== ''"
                icon="close"
                size="xs"
                flat
                round
                color="grey-4"
                class="remove-btn"
                @click.stop="removePrize(index)"
              />
            </div>
          </div>
        </div>

        <!-- 底部按鈕與結果 -->
        <div class="column items-center q-mt-xl full-width">
          <div class="row q-gutter-md">
            <q-btn
              :label="t('start')"
              color="accent"
              size="lg"
              unelevated
              rounded
              padding="12px 60px"
              @click="startDraw"
              :disable="isDrawing || prizes.length < 2"
              class="start-btn"
            />
            <!-- 手機版專用：喚起選單按鈕 -->
            <q-btn
              icon="tune"
              color="primary"
              flat
              round
              size="lg"
              class="lt-md"
              @click="showMobilePanel = true"
            >
              <q-tooltip>{{ t('selectCategory') }}</q-tooltip>
            </q-btn>
          </div>

          <transition name="scale">
            <div v-if="winner !== null" class="column items-center q-mt-lg">
              <div class="result-banner text-h6 text-weight-bold">
                🎉 {{ t('todayRecommended') }}：<span class="text-primary text-h5">{{
                  winner
                }}</span>
              </div>
              <q-btn
                v-if="!isDrawing"
                label="儲存到今日紀錄"
                color="primary"
                unelevated
                rounded
                class="q-mt-md"
                icon="save"
                :loading="isSaving"
                @click="promptForNoteAndSave"
              />
            </div>
          </transition>
        </div>
      </div>

      <!-- 右側：控制與選菜面板 (僅在桌面端顯示) -->
      <div class="col-12 col-md-6 column items-center gt-sm">
        <q-card flat bordered class="control-panel q-pa-lg shadow-1">
          <slot name="control-content">
            <div class="text-subtitle1 text-weight-bold q-mb-md text-primary">
              {{ t('selectCategory') }}
            </div>

            <!-- 分類選擇 -->
            <q-select
              v-model="selectedCategory"
              :options="categories"
              dense
              outlined
              bg-color="white"
              @update:model-value="fetchDishesByCategory"
              :loading="loadingCategories"
              class="q-mb-lg custom-input"
            />

            <!-- 菜品按鈕區 -->
            <div class="dish-selector q-mb-xl">
              <div v-if="fetchedDishes.length > 0" class="row q-gutter-sm">
                <q-btn
                  v-for="dish in fetchedDishes"
                  :key="dish._id"
                  :label="dish.name"
                  unelevated
                  class="dish-btn text-weight-bold"
                  @click="addFromList(dish.name)"
                  :disable="prizes.includes(dish.name)"
                />
                <!-- 批次新增按鈕 -->
                <q-btn
                  v-if="fetchedDishes.length > 0"
                  :label="t('addAll')"
                  color="secondary"
                  unelevated
                  class="dish-btn text-weight-bold add-all-btn"
                  @click="addAllFetchedDishes"
                />
              </div>
              <div v-else-if="!loadingDishes" class="text-caption text-grey-6 text-center q-pa-md">
                {{ selectedCategory ? '此分類暫無菜色' : '請先選擇一個類別' }}
              </div>
            </div>

            <q-separator class="q-mb-lg" />

            <!-- 手動輸入 -->
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-sm text-grey-7">{{ t('inputDish') }}</div>
              <div class="row q-gutter-sm no-wrap">
                <q-input
                  v-model="prizeInput"
                  dense
                  outlined
                  bg-color="white"
                  class="col custom-input"
                  @keyup.enter="addPrize"
                />
                <q-btn icon="add" color="primary" unelevated @click="addPrize" class="add-btn" />
              </div>
            </div>

            <q-btn
              :label="t('clear')"
              flat
              color="negative"
              class="full-width q-mt-xl rounded-btn"
              @click="clearPrizes"
              icon="delete_outline"
            />
          </slot>
        </q-card>
      </div>
    </div>

    <!-- 手機版專用：底部選單彈窗 -->
    <q-dialog v-model="showMobilePanel" position="bottom" class="lt-md">
      <q-card class="control-panel q-pa-lg no-border-radius-top" style="max-height: 80vh">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-primary">{{ t('selectCategory') }}</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </div>

        <div class="q-mb-md">
          <q-select
            v-model="selectedCategory"
            :options="categories"
            dense
            outlined
            bg-color="white"
            @update:model-value="fetchDishesByCategory"
            :loading="loadingCategories"
            class="custom-input"
          />
        </div>

        <div class="dish-selector q-mb-lg">
          <div v-if="fetchedDishes.length > 0" class="row q-gutter-sm">
            <q-btn
              v-for="dish in fetchedDishes"
              :key="dish._id"
              :label="dish.name"
              unelevated
              class="dish-btn text-weight-bold"
              @click="addFromList(dish.name)"
              :disable="prizes.includes(dish.name)"
            />
            <q-btn
              v-if="fetchedDishes.length > 0"
              :label="t('addAll')"
              color="secondary"
              unelevated
              class="dish-btn text-weight-bold add-all-btn"
              @click="addAllFetchedDishes"
            />
          </div>
        </div>

        <q-separator class="q-mb-md" />

        <div class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm text-grey-7">{{ t('inputDish') }}</div>
          <div class="row q-gutter-sm no-wrap">
            <q-input
              v-model="prizeInput"
              dense
              outlined
              bg-color="white"
              class="col custom-input"
              @keyup.enter="addPrize"
            />
            <q-btn icon="add" color="primary" unelevated @click="addPrize" class="add-btn" />
          </div>
        </div>

        <q-btn
          :label="t('clear')"
          flat
          color="negative"
          class="full-width q-mt-md rounded-btn"
          @click="clearPrizes"
          icon="delete_outline"
        />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { foodApi } from 'src/api/food';
import type { Dish } from 'src/api/food';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/userStore';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();

// 抽獎核心資料
const prizes = ref<string[]>([]); // 初始為空，由使用者點選按鈕填入
const prizeInput = ref<string>('');
const winner = ref<string | null>(null);
const isDrawing = ref(false);
const isSaving = ref(false);
const currentIndex = ref<number>(-1);
const showMobilePanel = ref(false); // 控制手機版彈窗顯示

// API 相關資料
const categories = ref<string[]>([]);
const fetchedDishes = ref<Dish[]>([]);
const selectedCategory = ref<string | null>(null);
const loadingCategories = ref(false);
const loadingDishes = ref(false);

onMounted(async () => {
  loadingCategories.value = true;
  let isFetched = false;

  while (!isFetched) {
    try {
      const res = await foodApi.getCategories();
      if (res.data.success && res.data.data.length > 0) {
        categories.value = res.data.data;
        // 預設獲取第一個分類的菜色按鈕清單
        const firstCategory = categories.value[0] ?? null;
        selectedCategory.value = firstCategory;
        await fetchDishesByCategory(firstCategory);
        isFetched = true;
      } else {
        // 若成功但無資料，等待 3 秒重試
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.warn('正在等待伺服器回傳分類資料...', error);
      // 失敗時等待 3 秒後重試
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  loadingCategories.value = false;
});

async function fetchDishesByCategory(category: string | null) {
  if (!category) {
    fetchedDishes.value = [];
    return;
  }
  loadingDishes.value = true;

  try {
    const res = await foodApi.getDishesByCategory(category);
    if (res.data.success) {
      fetchedDishes.value = res.data.data;
    } else {
      throw new Error('API return success: false');
    }
  } catch (error) {
    console.error('Fetch dishes failed:', error);
    // 失敗時清除輸入內容
    selectedCategory.value = null;
    fetchedDishes.value = [];
  } finally {
    loadingDishes.value = false;
  }
}

// 互動邏輯
function addFromList(name: string) {
  if (!prizes.value.includes(name)) {
    prizes.value.push(name);
  }
}

// 批次新增所有菜色
function addAllFetchedDishes() {
  const currentNames = new Set(prizes.value);
  const newItems = fetchedDishes.value
    .map((dish) => dish.name)
    .filter((name) => !currentNames.has(name));

  if (newItems.length > 0) {
    prizes.value = [...prizes.value, ...newItems];
  }
}

function addPrize() {
  const name = prizeInput.value.trim();
  if (name && !prizes.value.includes(name)) {
    // 確保使用展開運算子觸發響應式更新
    prizes.value = [...prizes.value, name];
    prizeInput.value = '';
    winner.value = null; // 新增時清除之前的結果
  }
}

function removePrize(index: number) {
  const realItem = displayPrizes.value[index];
  if (realItem) {
    const realIndex = prizes.value.indexOf(realItem);
    if (realIndex > -1) prizes.value.splice(realIndex, 1);
  }
}

function clearPrizes() {
  prizes.value = [];
  winner.value = null;
  currentIndex.value = -1;
}

// 佈局計算
const gridSize = computed(() => {
  const count = prizes.value.length;
  return count <= 9 ? 3 : Math.ceil(Math.sqrt(count));
});

const displayPrizes = computed(() => {
  const n = gridSize.value;
  const total = n * n;
  const res = [...prizes.value];
  while (res.length < total) res.push('');
  return res;
});

const gridContainerStyle = computed(() => ({
  width: '100%',
  maxWidth: '350px',
  minHeight: '350px',
}));

const itemStyle = computed(() => {
  const n = gridSize.value;
  let fontSize = '1rem';
  if (n === 4) fontSize = '0.85rem';
  if (n >= 5) fontSize = '0.75rem';
  return {
    fontSize,
  };
});

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize.value}, 1fr)`,
  gap: '10px',
  width: '100%',
}));

// 抽獎邏輯
function startDraw() {
  if (isDrawing.value || prizes.value.length < 2) return;
  winner.value = null;
  isDrawing.value = true;
  let count = 0;
  const totalSteps = 30 + Math.floor(Math.random() * 20);
  const interval = setInterval(() => {
    currentIndex.value = count % prizes.value.length;
    count++;
    if (count > totalSteps) {
      clearInterval(interval);
      winner.value = prizes.value[currentIndex.value] || null;
      isDrawing.value = false;
    }
  }, 100);
}

// 儲存邏輯 (含備註對話框)
function promptForNoteAndSave() {
  if (!winner.value) return;

  // 檢查登入狀態
  if (!userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: '請先登入後再儲存紀錄',
      position: 'center',
    });
    userStore.showLoginModal = true;
    // 設定當前頁面為登入後的重導向路徑
    userStore.loginRedirectPath = router.currentRoute.value.fullPath;
    return;
  }

  $q.dialog({
    title: '儲存推薦',
    message: `您抽中了「${winner.value}」，想加點備註嗎？`,
    prompt: {
      model: '',
      type: 'text',
      placeholder: '例如：店名',
    },
    cancel: true,
    persistent: true,
  }).onOk((note: string) => {
    void saveRecord(note);
  });
}

async function saveRecord(note: string) {
  if (!winner.value) return;
  isSaving.value = true;
  try {
    const trimmedNote = note.trim();
    await foodApi.recordFood({
      dishName: winner.value,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    });
    $q.notify({
      type: 'positive',
      message: '推薦紀錄已儲存',
      position: 'center',
    });
  } catch (error) {
    console.error('儲存紀錄失敗:', error);
    $q.notify({
      type: 'negative',
      message: '儲存失敗，請稍後再試',
      position: 'center',
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.lottery-container {
  max-width: 1400px;
  margin: 0 auto;
}

.grid {
  display: grid;
  justify-content: center;
}

.grid-item {
  position: relative;
  background: white;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  color: #444;
  aspect-ratio: 1/1;
  transition:
    background-color 0.2s ease,
    transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.2s ease,
    color 0.2s ease;
  text-align: center;
  padding: 8px;
  word-break: break-all;
}

.grid-item.empty {
  background: #fafafa;
  border: 2px solid #f5f5f5;
  color: transparent;
}

.grid-item.active {
  background-color: #fdd835;
  border-color: #fbc02d;
  color: #000;
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(251, 192, 45, 0.4);
  z-index: 2;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff5252;
  color: white !important;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 5;
}

.grid-item:hover .remove-btn {
  opacity: 1;
}

.control-panel {
  border-radius: 20px;
  background: #ffffff;
  border: 2px solid #f5f5f5;
  width: 100%;
  max-width: 500px;
  min-height: 600px; /* 加入最小高度限制 */
  display: flex;
  flex-direction: column;
}

.dish-selector {
  flex-grow: 1; /* 讓菜色按鈕區自動佔據可用空間 */
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.dish-btn {
  background: white;
  border: 1.5px solid #eee;
  border-radius: 10px;
  color: #555;
  padding: 4px 12px;
  min-height: 36px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.dish-btn:hover:not(:disabled) {
  border-color: #2196f3;
  color: #2196f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.2);
}

.dish-btn:disabled {
  background: #f5f5f5;
  border-color: #eee;
  color: #ccc;
  cursor: not-allowed;
}

.custom-input :deep(.q-field__control) {
  border-radius: 10px;
}

.add-btn {
  border-radius: 10px;
}

.rounded-btn {
  border-radius: 12px;
}

.result-banner {
  background: #fff9c4;
  padding: 12px 40px;
  border-radius: 50px;
  border: 2px solid #fff176;
  box-shadow: 0 4px 15px rgba(255, 241, 118, 0.3);
}

.bg-white-transparent {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  border-radius: 12px;
}

/* 動畫 */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
</style>
