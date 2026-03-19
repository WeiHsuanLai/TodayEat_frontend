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
                <q-item
                  v-for="(place, index) in places"
                  :key="index"
                  clickable
                  @click="centerMapOnPlace(place, index)"
                >
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
                    <q-item-label class="text-weight-bold">{{ place.name }}</q-item-label>
                    <q-item-label caption lines="2">{{ place.vicinity }}</q-item-label>
                    <q-item-label caption class="text-primary text-weight-medium">
                      ⭐️ {{ place.rating ?? t('ratingNone') }}
                      {{ t('reviewsCount', { count: place.user_ratings_total ?? 0 }) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loader } from '@googlemaps/js-api-loader';
import { placesApi } from 'src/api';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const keyword = ref('');
const map = ref<google.maps.Map | null>(null);
const markers = ref<google.maps.Marker[]>([]);
const userLocation = ref({ lat: 25.0478, lng: 121.5319 }); // 預設台北車站

interface Place {
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

const centerMapOnPlace = (place: Place, index: number) => {
  if (!map.value || !place.geometry?.location) return;

  const loc = place.geometry.location;
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

  const position = { lat, lng };

  // 1. 平滑移動到該位置
  map.value.panTo(position);

  // 2. 放大地圖（如果目前縮放不足 17）
  if (map.value.getZoom()! < 17) {
    map.value.setZoom(17);
  }

  // 3. 如果有對應的標記，觸發點擊事件以顯示 InfoWindow
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const places = ref<any[]>([]);

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addMarkers = (places: any[]) => {
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
        <div class="q-pa-sm">
          <div class="text-weight-bold" style="font-size: 1.1em; margin-bottom: 4px;">${place.name}</div>
          <div class="text-grey-8" style="margin-bottom: 12px;">${place.vicinity}</div>
          <a href="${searchNavigationUrl}" target="_blank" class="q-btn q-btn--standard q-btn--rectangle bg-primary text-white q-btn--actionable q-focusable q-hoverable q-btn--dense" style="text-decoration: none; padding: 4px 12px; border-radius: 4px; display: inline-block;">
            <span class="q-btn__content">${t('startNavigation')}</span>
          </a>
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
