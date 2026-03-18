<!-- src/components/GridLottery.vue - 九宮格抽獎元件 -->
<template>
  <div class="lottery-container q-pa-lg flex flex-center">
    <div
      class="row q-col-gutter-xl items-center justify-center full-width"
      style="min-height: 80vh"
    >
      <!-- 左側：九宮格抽獎區 -->
      <div class="col-12 col-md-auto column items-center q-pa-md">
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
        <div class="column items-center q-mt-md full-width">
          <!-- 第一排：開始按鈕與結果展示 -->
          <div
            :class="
              $q.screen.lt.md
                ? 'column q-gutter-y-md'
                : 'row items-center q-gutter-md no-wrap q-mb-md'
            "
          >
            <div class="row items-center q-gutter-sm no-wrap justify-center">
              <q-btn
                :label="t('start')"
                color="accent"
                :size="$q.screen.lt.md ? 'md' : 'lg'"
                unelevated
                rounded
                :padding="$q.screen.lt.md ? '10px 30px' : '12px 40px'"
                @click="startDraw"
                :disable="isDrawing || prizes.length < 2"
                class="start-btn"
              />

              <!-- 手機版專用：喚起選單按鈕 (放於開始按鈕旁) -->
              <q-btn
                icon="tune"
                color="primary"
                flat
                round
                :size="$q.screen.lt.md ? 'md' : 'lg'"
                class="lt-md"
                @click="showMobilePanel = true"
              >
                <q-tooltip>{{ t('selectCategory') }}</q-tooltip>
              </q-btn>
            </div>

            <!-- 今日推薦展示區 -->
            <div
              class="result-banner text-weight-bold row items-center no-wrap"
              :style="$q.screen.lt.md ? 'padding: 8px 15px; font-size: 0.95rem;' : ''"
            >
              <span class="q-mr-xs text-no-wrap">🎉 {{ t('todayRecommended') }}：</span>
              <span
                class="text-primary text-weight-bolder"
                :class="$q.screen.lt.md ? 'text-h6' : 'text-h5'"
                style="min-width: 60px; text-align: center"
              >
                {{ winner || '???' }}
              </span>
            </div>
          </div>

          <!-- 第二排：操作按鈕 -->
          <div class="row q-gutter-sm justify-center q-mt-sm">
            <q-btn
              :label="t('saveRecommendation')"
              color="primary"
              unelevated
              rounded
              icon="save"
              :loading="isSaving"
              @click="promptForNoteAndSave"
              :padding="$q.screen.lt.md ? '6px 16px' : '8px 20px'"
              :size="$q.screen.lt.md ? 'sm' : 'md'"
              :disable="!winner || isDrawing"
            />
            <q-btn
              :label="t('searchOnMap')"
              color="secondary"
              unelevated
              rounded
              icon="map"
              @click="goToMapSearch"
              :padding="$q.screen.lt.md ? '6px 16px' : '8px 20px'"
              :size="$q.screen.lt.md ? 'sm' : 'md'"
              :disable="!winner || isDrawing"
            />
          </div>
        </div>
      </div>

      <!-- 右側：控制與選菜面板 (僅在桌面端顯示) -->
      <div class="col-12 col-md-auto column items-center gt-sm q-pa-md">
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
                <!-- 全部清除按鈕 -->
                <q-btn
                  :label="t('clearAll')"
                  color="negative"
                  unelevated
                  class="dish-btn text-weight-bold"
                  @click="clearPrizes"
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
          </slot>
        </q-card>
      </div>
    </div>

    <!-- 手機版專用：底部選單彈窗 -->
    <q-dialog v-model="showMobilePanel" position="bottom" class="lt-md">
      <q-card
        class="control-panel q-pa-lg no-border-radius-top"
        style="max-height: 85vh; overflow-y: auto; width: 100%"
      >
        <!-- 頂部拉動視覺提示 -->
        <div class="row justify-center q-mb-sm">
          <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px"></div>
        </div>

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
            <!-- 全部清除按鈕 -->
            <q-btn
              :label="t('clearAll')"
              color="negative"
              unelevated
              class="dish-btn text-weight-bold"
              @click="clearPrizes"
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
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { foodApi } from 'src/api/food';
import type { Dish } from 'src/api/food';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/userStore';

const { t, locale } = useI18n();
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
        // 預設獲取第一個分類
        if (!selectedCategory.value) {
          selectedCategory.value = categories.value[0] ?? null;
        }
        isFetched = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.warn('正在等待伺服器回傳分類資料...', error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  loadingCategories.value = false;
});
// 監聽分類變化，獲取菜色
watch(
  () => selectedCategory.value,
  async (newVal: string | null) => {
    if (newVal) {
      await fetchDishesByCategory(newVal);
    } else {
      fetchedDishes.value = [];
    }
  },
  { immediate: true },
);

// 監聽語系變化，重新獲取分類
watch(
  () => locale.value,
  async () => {
    loadingCategories.value = true;
    try {
      const res = await foodApi.getCategories();
      if (res.data.success && res.data.data.length > 0) {
        const oldCategory = selectedCategory.value;
        categories.value = res.data.data;

        // 如果原本有選分類，嘗試在新的分類列表中找回它，找不到就選第一個
        if (!oldCategory || !categories.value.includes(oldCategory)) {
          selectedCategory.value = categories.value[0] ?? null;
        } else {
          // 如果分類名沒變，手動觸發一次獲取以更新語系
          await fetchDishesByCategory(selectedCategory.value);
        }
      }
    } catch (error) {
      console.error('語系切換後更新分類失敗:', error);
    } finally {
      loadingCategories.value = false;
    }
  },
);

async function fetchDishesByCategory(category: string | null) {
  console.log('[GridLottery] 嘗試獲取分類菜色:', category);
  if (!category) {
    fetchedDishes.value = [];
    return;
  }
  loadingDishes.value = true;

  try {
    const res = await foodApi.getDishesByCategory(category);
    console.log('[GridLottery] API 回傳結果:', res.data);
    if (res.data.success) {
      fetchedDishes.value = res.data.data;
    } else {
      throw new Error('API return success: false');
    }
  } catch (error) {
    console.error('Fetch dishes failed:', error);
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

const gridContainerStyle = computed(() => {
  // 偵測是否為手機版 (簡單判斷)
  const isMobile = $q.screen.lt.md;
  const size = isMobile ? '320px' : '450px';
  return {
    width: size,
    height: size,
  };
});

const itemStyle = computed(() => {
  const n = gridSize.value;
  const isMobile = $q.screen.lt.md;

  let fontSize = isMobile ? '1rem' : '1.25rem';
  if (n === 4) fontSize = isMobile ? '0.85rem' : '1rem';
  if (n >= 5) fontSize = isMobile ? '0.7rem' : '0.85rem';

  return {
    fontSize,
    height: '100%',
  };
});

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${gridSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridSize.value}, 1fr)`,
  gap: '10px',
  width: '100%',
  height: '100%',
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

function goToMapSearch() {
  if (!winner.value) return;

  const targetPath = '/mapsearch';
  const targetQuery = { keyword: winner.value };

  if (!userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: t('pleaseLogin'),
      position: 'center',
      timeout: 2000,
    });
    userStore.showLoginModal = true;
    userStore.loginRedirectPath = `${targetPath}?keyword=${encodeURIComponent(winner.value)}`;
    return;
  }

  void router.push({
    path: targetPath,
    query: targetQuery,
  });
}

// 儲存邏輯 (含備註對話框)
function promptForNoteAndSave() {
  if (!winner.value) return;

  // 檢查登入狀態
  if (!userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: t('pleaseLoginToSave'),
      position: 'center',
    });
    userStore.showLoginModal = true;
    // 設定當前頁面為登入後的重導向路徑
    userStore.loginRedirectPath = router.currentRoute.value.fullPath;
    return;
  }

  $q.dialog({
    title: t('saveRecommendation'),
    message: t('saveRecommendationMsg', { winner: winner.value }),
    prompt: {
      model: '',
      type: 'text',
      placeholder: t('notePlaceholder'),
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
      message: t('recordSaved'),
      position: 'center',
    });
  } catch (error) {
    console.error('儲存紀錄失敗:', error);
    $q.notify({
      type: 'negative',
      message: t('recordSaveFailed'),
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
    transform 0.1s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
  text-align: center;
  padding: 8px;
  word-break: break-all;
  flex-shrink: 0;
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
  top: -10px;
  right: -10px;
  background: #ff5252;
  color: white !important;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.dish-selector {
  flex-grow: 1;
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
  padding: 12px 25px;
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
