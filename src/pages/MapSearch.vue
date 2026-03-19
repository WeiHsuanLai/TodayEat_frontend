<!-- src/pages/MapSearch.vue - 美食地圖搜尋 -->
<template>
  <q-page class="q-pa-md">
    <!-- 搜尋列 -->
    <div class="row q-col-gutter-md items-center q-mb-md">
      <!-- 桌面端對齊右側清單區塊 (offset 7 + col 5) -->
      <div class="col-12 col-md-5 offset-md-7 row items-center no-wrap">
        <div class="text-h6 q-mr-md text-no-wrap text-primary text-weight-bold">
          {{ t('searchNearby') }}
        </div>
        <q-input
          v-model="keyword"
          :placeholder="t('enterKeyword')"
          @keyup.enter="onSearch"
          @compositionend="onSearch"
          dense
          outlined
          bg-color="white"
          class="col"
        >
          <template #append>
            <q-btn flat icon="search" color="primary" @click="onSearch" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- 主要內容區 -->
    <div class="row q-col-gutter-md">
      <!-- 地圖區塊 (左側) -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="overflow-hidden main-container-card">
          <div id="map" class="map-container"></div>
        </q-card>
      </div>

      <!-- 清單區塊 (右側) -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="main-container-card column">
          <q-card-section class="col q-pa-none relative-position">
            <q-scroll-area class="full-height">
              <q-list separator v-if="places.length">
                <q-expansion-item
                  v-for="(place, index) in places"
                  :key="index"
                  group="places"
                  expand-separator
                  header-class="q-pa-sm"
                  @before-show="fetchDetails(place.place_id)"
                  @click="centerMapOnPlace(place, index)"
                >
                  <template #header>
                    <q-item-section avatar v-if="place.photos?.[0]?.photo_reference">
                      <q-img
                        :src="place.photoUrl || ''"
                        style="border-radius: 8px; width: 64px; height: 64px"
                        :ratio="1"
                        spinner-color="grey-5"
                        referrerpolicy="no-referrer"
                      >
                        <template #error>
                          <q-icon name="image_not_supported" size="32px" color="grey-5" />
                        </template>
                      </q-img>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold text-subtitle1">{{
                        place.name
                      }}</q-item-label>
                      <q-item-label caption lines="1">{{ place.vicinity }}</q-item-label>
                      <q-item-label
                        caption
                        class="text-primary text-weight-medium flex items-center"
                      >
                        <span>{{ place.rating ?? t('ratingNone') }} ⭐️</span>
                        <span class="q-ml-sm text-grey-7"
                          >({{ t('reviewsCount', { count: place.user_ratings_total ?? 0 }) }})</span
                        >
                      </q-item-label>
                    </q-item-section>
                  </template>

                  <q-card v-if="placeDetailsMap[place.place_id]" flat class="bg-grey-1">
                    <q-card-section class="q-pt-none q-pb-md">
                      <div class="text-caption text-grey-7 q-mb-xs">{{ t('address') }}</div>
                      <div class="text-body2 q-mb-md">
                        {{ placeDetailsMap[place.place_id]?.result.formatted_address }}
                      </div>

                      <div v-if="placeDetailsMap[place.place_id]?.result.reviews?.length">
                        <div class="text-caption text-grey-7 q-mb-xs">{{ t('reviews') }}</div>
                        <div
                          v-for="(review, rIdx) in placeDetailsMap[place.place_id]?.result.reviews"
                          :key="rIdx"
                          class="q-mb-sm"
                        >
                          <div class="flex justify-between items-center">
                            <span class="text-weight-bold text-caption">{{
                              review.author_name
                            }}</span>
                            <span class="text-grey-6 text-caption">{{
                              review.relative_time_description
                            }}</span>
                          </div>
                          <div class="text-primary text-caption">
                            {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                          </div>
                          <div class="text-body2 text-grey-9 q-mt-xs">{{ review.text }}</div>
                          <q-separator v-if="rIdx < 2" class="q-my-xs opacity-50" />
                        </div>
                      </div>

                      <div class="row q-gutter-sm q-mt-md">
                        <q-btn
                          color="primary"
                          icon="map"
                          :label="t('viewMoreOnGoogle')"
                          outline
                          dense
                          class="col"
                          :href="placeDetailsMap[place.place_id]?.result.url"
                          target="_blank"
                        />
                        <q-btn
                          color="primary"
                          icon="navigation"
                          :label="t('startNavigation')"
                          dense
                          class="col"
                          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}&query=${typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat},${typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng}`"
                          target="_blank"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                  <q-card v-else flat class="bg-grey-1">
                    <q-card-section class="flex flex-center q-pa-md">
                      <q-spinner-dots color="primary" size="2em" />
                      <div class="q-ml-sm text-grey-7">{{ t('loadingDetails') }}</div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-list>
              <div v-else class="text-grey full-height flex flex-center q-pa-xl text-center">
                <div>
                  <q-icon name="map" size="48px" color="grey-4" class="q-mb-sm" />
                  <div class="text-body1">{{ t('noSearchResults') }}</div>
                </div>
              </div>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { env } from 'src/env';
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loader } from '@googlemaps/js-api-loader';
import { placesApi } from 'src/api';
import type { PlaceDetailsResponse } from 'src/api/places';
import { useRoute } from 'vue-router';

const { t, locale } = useI18n();

// 監聽語系變動，重新繪製標記以更新 InfoWindow 文字
watch(locale, () => {
  if (places.value.length > 0) {
    addMarkers(places.value);
  }
});
const route = useRoute();
const keyword = ref('');
const map = ref<google.maps.Map | null>(null);
const markers = ref<google.maps.Marker[]>([]);
const userLocation = ref({ lat: 25.0478, lng: 121.5319 }); // 預設台北車站

interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  photoUrl?: string;
  photos?: Array<{ photo_reference: string }>;
  geometry: {
    location: {
      lat: number | (() => number);
      lng: number | (() => number);
    };
  };
}

const isSearching = ref(false);
const placeDetailsMap = ref<Record<string, PlaceDetailsResponse>>({});

const fetchDetails = async (placeId: string) => {
  if (placeDetailsMap.value[placeId]) return;
  try {
    const res = await placesApi.getPlaceDetails({ place_id: placeId });
    placeDetailsMap.value[placeId] = res.data;
  } catch (err) {
    console.error('🔴 獲取詳情失敗:', err);
  }
};

const centerMapOnPlace = (place: Place, index: number) => {
  if (!map.value || !place.geometry?.location) return;

  const loc = place.geometry.location;
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

  const position = { lat, lng };

  // 1. 放大地圖（如果目前縮放不足 17）
  if (map.value.getZoom()! < 17) {
    map.value.setZoom(17);
  }

  // 2. 平滑移動到該位置
  map.value.panTo(position);

  // 3. 手機版特別處理：將地圖向上偏移，讓標記顯示在中間偏下
  // 這樣上方的 InfoWindow 才有足夠空間顯示
  const isMobile = window.innerWidth < 1024;
  if (isMobile) {
    // panBy 是像素偏移，負值代表地圖向上移動 (標記相對向下)
    map.value.panBy(0, -120);
  }

  // 4. 如果有對應的標記，觸發點擊事件以顯示 InfoWindow
  const marker = markers.value[index];
  if (marker) {
    // 使用 Google Maps 的 trigger 觸發點擊
    google.maps.event.trigger(marker, 'click');
  }
};

const onSearch = async () => {
  // console.log('[🔍 觸發搜尋]', keyword.value);
  if (!keyword.value.trim()) return;
  if (!map.value) {
    console.warn('⚠️ 地圖尚未初始化');
    return;
  }
  if (isSearching.value) {
    console.log('⏳ 搜尋中，忽略重複觸發');
    return;
  }
  isSearching.value = true;
  try {
    await fetchNearby();
  } finally {
    setTimeout(() => {
      isSearching.value = false;
    }, 300);
  }
};

const places = ref<Place[]>([]);

const hasSearched = ref(false);

// 初始化地圖
const initMap = () => {
  const mapElement = document.getElementById('map');
  // console.log('[🗺️ initMap] 初始化地圖...', { mapElement: !!mapElement });

  if (!window.google || !window.google.maps) {
    console.error('[❌] Google Maps 尚未載入完成');
    return;
  }

  const mapId = env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';
  // console.log('[🗺️ initMap] 使用 Map ID:', mapId);

  // 匯入 marker 函式庫
  map.value = new google.maps.Map(mapElement as HTMLElement, {
    center: userLocation.value,
    zoom: 15,
    mapId: mapId,
  });

  google.maps.event.addListenerOnce(map.value, 'idle', () => {
    // console.log('[🗺️ Map IDLE] 地圖已就緒');
    addUserLocationMarker();

    if (keyword.value.trim()) {
      // console.log('✅ 地圖 idle 首次觸發搜尋');
      hasSearched.value = true;
      void onSearch();
    }
  });
};

// 清除舊標記
const clearMarkers = () => {
  markers.value.forEach((m) => m.setMap(null));
  markers.value = [];
};

const addUserLocationMarker = () => {
  // console.log('[📍 addUserLocationMarker] 建立傳統標記...');
  if (!map.value) return;

  new google.maps.Marker({
    position: userLocation.value,
    map: map.value,
    title: t('currentLocation'),
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 10,
    },
  });
  // console.log('[✅] 使用者位置標記已建立 (Legacy)');
};

// 加入店家標記
const addMarkers = (places: Place[]) => {
  // console.log(`[🏠 addMarkers] 處理 ${places.length} 個店家`);
  if (!map.value) return;

  clearMarkers();

  for (const place of places) {
    const loc = place.geometry?.location;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const marker = new google.maps.Marker({
      map: map.value,
      position: { lat, lng },
      title: place.name,
      // 預設即為紅色標記
    });

    const encodedName = encodeURIComponent(place.name);
    // 使用搜尋連結，這會在導航列顯示名稱
    const searchNavigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}&query_place_id=${place.place_id || ''}&query=${lat},${lng}`;

    const info = new google.maps.InfoWindow({
      content: `
        <div class="marker-info-window q-pa-sm">
          <div class="info-title text-weight-bold">${place.name}</div>
          <div class="info-address text-grey-8">${place.vicinity}</div>
          <div style="text-align: center;">
            <a href="${searchNavigationUrl}" target="_blank" class="q-btn q-btn--standard q-btn--rectangle bg-primary text-white q-btn--actionable q-focusable q-hoverable q-btn--dense" style="text-decoration: none; padding: 4px 12px; border-radius: 4px; display: inline-block;">
              <span class="q-btn__content info-btn-text">${t('startNavigation')}</span>
            </a>
          </div>
        </div>
      `,
    });

    marker.addListener('click', () => {
      info.open(map.value, marker);
    });

    markers.value.push(marker);
  }
  // console.log(`[✅] ${markers.value.length} 個店家已加入地圖 (Legacy)`);
};

// 查詢附近店家
const fetchNearby = async () => {
  if (!keyword.value.trim() || !map.value) return;
  try {
    const bounds = map.value.getBounds();
    const center = map.value.getCenter();
    const ne = bounds?.getNorthEast();

    if (!bounds || !center || !ne) {
      console.warn('⚠️ 無法取得地圖視野資訊，改用預設範圍');
      return;
    }

    // 計算畫面中心到右上角的距離作為 radius
    const radius = google.maps.geometry.spherical.computeDistanceBetween(center, ne);

    const params = {
      keyword: keyword.value,
      lat: userLocation.value.lat,
      lng: userLocation.value.lng,
      radius: Math.floor(radius),
    };

    const res = await placesApi.getNearbyStores(params);
    places.value = res.data.results;
    // for (const place of places.value) {
    //   console.log(`[📷 圖片資訊] ${place.name} =>`, place.photoUrl || '❌ 無圖片');
    // }
    addMarkers(res.data.results);
  } catch (err) {
    console.error('🔴 API 錯誤:', err);
  }
};

onMounted(async () => {
  if (hasSearched.value) return;
  const initialKeyword = route.query.keyword;
  if (typeof initialKeyword === 'string' && initialKeyword.trim()) {
    keyword.value = initialKeyword.trim();
  }
  try {
    const loader = new Loader({
      apiKey: env.VITE_GOOGLE_MAPS_API_KEY as string,
      language: 'zh-TW',
      version: 'weekly',
    });

    // 載入 core 地圖（避免使用 load()）
    await loader.importLibrary('maps');

    // 載入 marker 與 places library（模組式）
    await Promise.all([
      loader.importLibrary('marker'),
      loader.importLibrary('places'),
      loader.importLibrary('geometry'),
    ]);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.value.lat = pos.coords.latitude;
        userLocation.value.lng = pos.coords.longitude;
        void initMap();
      },
      (err) => {
        console.warn('⚠️ 取得定位失敗，使用預設位置', err);
        void initMap();
      },
    );
  } catch (err) {
    console.error('Google Maps 載入失敗:', err);
  }
});
</script>

<style>
/* 地圖 InfoWindow 樣式 (非 scoped 以便作用於 Google Maps 的外部 DOM) */
.marker-info-window {
  min-width: 150px;
}

.marker-info-window .info-title {
  font-size: 1.1em;
  margin-bottom: 4px;
}

.marker-info-window .info-address {
  margin-bottom: 12px;
}

/* 手機版 (小於 1024px) */
@media (max-width: 1023px) {
  .marker-info-window .info-title {
    font-size: 0.95em;
  }
  .marker-info-window .info-address {
    font-size: 0.85em;
    margin-bottom: 8px;
  }
  .marker-info-window .info-btn-text {
    font-size: 0.85em;
  }
}
</style>

<style scoped>
.main-container-card {
  height: calc(100vh - 180px);
  min-height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 手機與平板版 (小於 1024px) */
@media (max-width: 1023px) {
  .main-container-card {
    height: auto;
    min-height: auto;
  }

  .map-container {
    height: 40vh;
    min-height: 300px;
  }

  /* 行動端讓列表維持適當高度 */
  .col-md-5 .main-container-card {
    height: 400px;
    margin-top: 16px;
  }
}
</style>
