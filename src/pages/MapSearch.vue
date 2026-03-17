<!-- src/pages/MapSearch.vue - 美食地圖搜尋 -->
<template>
  <q-page class="q-pa-md">
    <!-- 搜尋列 -->
    <div class="row q-col-gutter-sm items-center q-mb-md">
      <div class="col-12 col-sm-6">
        <div class="text-h6">搜尋附近店家</div>
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model="keyword"
          label="輸入關鍵字"
          @keyup.enter="onSearch"
          @compositionend="onSearch"
          dense
          outlined
          bg-color="white"
        >
          <template #append>
            <q-btn flat icon="search" color="primary" @click="onSearch" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 地圖區塊 -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="overflow-hidden">
          <div id="map" class="map-container"></div>
        </q-card>
      </div>

      <!-- 清單區塊 -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-pa-none">
            <div class="places-list-container">
              <q-list separator v-if="places.length">
                <q-item v-for="(place, index) in places" :key="index" clickable>
                  <q-item-section avatar v-if="place.photos?.[0]?.photo_reference">
                    <q-img
                      :src="place.photoUrl || ''"
                      style="border-radius: 8px; width: 64px; height: 64px"
                      :ratio="1"
                      spinner-color="grey-5"
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
                      ⭐️ {{ place.rating ?? '無' }}（{{ place.user_ratings_total ?? 0 }} 則）
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey q-pa-xl text-center">
                <q-icon name="map" size="48px" color="grey-4" class="q-mb-sm" />
                <div class="text-body1">尚無搜尋結果</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { placesApi } from 'src/api';
import { useRoute } from 'vue-router';

const route = useRoute();
const keyword = ref('');
const map = ref<google.maps.Map | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markers = ref<any[]>([]);
const userLocation = ref({ lat: 25.0478, lng: 121.5319 }); // 預設台北車站

const isSearching = ref(false);

const onSearch = async () => {
  console.log('[🔍 觸發搜尋]', keyword.value);
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

// 建立搜尋區域顯示
const searchCircle = ref<google.maps.Circle | null>(null);

const hasSearched = ref(false);

// 初始化地圖
const initMap = () => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps 尚未載入完成');
    return;
  }

  // 匯入 marker 函式庫
  map.value = new google.maps.Map(document.getElementById('map') as HTMLElement, {
    center: userLocation.value,
    zoom: 15,
    mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
  });

  google.maps.event.addListenerOnce(map.value, 'idle', () => {
    if (keyword.value.trim()) {
      console.log('✅ 地圖 idle 首次觸發搜尋');
      hasSearched.value = true;
      void onSearch();
    }
  });

  addUserLocationMarker();
  drawSearchCircle();
};

// 清除舊標記
const clearMarkers = () => {
  markers.value.forEach((m) => (m.map = null));
  markers.value = [];

  if (searchCircle.value) {
    searchCircle.value.setMap(null);
    searchCircle.value = null;
  }
};

const addUserLocationMarker = () => {
  if (!map.value) return;

  new google.maps.Marker({
    position: userLocation.value,
    map: map.value,
    title: '目前位置',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
  });
};

// 加入店家標記
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addMarkers = (places: any[]) => {
  if (!map.value) return;

  clearMarkers();

  for (const place of places) {
    const loc = place.geometry?.location;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn('❗ 無效位置資料:', place.name, lat, lng);
      continue;
    }

    console.log('📍 嘗試新增標記:', place.name, lat, lng);

    const marker = new google.maps.Marker({
      map: map.value,
      position: { lat, lng },
      title: place.name,
    });

    const info = new google.maps.InfoWindow({
      content: `<strong>${place.name}</strong><br>${place.vicinity}`,
    });

    marker.addListener('click', () => {
      info.open(map.value, marker);
    });

    markers.value.push(marker);
  }
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
    // 畫出搜尋範圍的圓形
    searchCircle.value = new google.maps.Circle({
      center: center.toJSON(), // 使用地圖中心
      radius,
      map: map.value,
      fillColor: '#4285F4',
      fillOpacity: 0.2,
      strokeColor: '#4285F4',
      strokeOpacity: 0.6,
      strokeWeight: 1,
    });

    const params = {
      keyword: keyword.value,
      lat: userLocation.value.lat,
      lng: userLocation.value.lng,
      radius: Math.floor(radius),
    };
    console.log('params', params);

    const res = await placesApi.getNearbyStores(params);
    console.log('res', res);
    places.value = res.data.results;
    for (const place of places.value) {
      console.log(`[📷 圖片資訊] ${place.name} =>`, place.photoUrl || '❌ 無圖片');
    }
    addMarkers(res.data.results);
  } catch (err) {
    console.error('🔴 API 錯誤:', err);
  }
};

const drawSearchCircle = () => {
  if (!map.value) return;
  if (searchCircle.value) {
    searchCircle.value.setMap(null); // 清除舊的
    searchCircle.value = null;
  }

  const bounds = map.value.getBounds();
  const center = map.value.getCenter();
  const ne = bounds?.getNorthEast();

  if (!bounds || !center || !ne) {
    console.warn('⚠️ 無法取得地圖視野資訊，略過畫圓');
    return;
  }

  const radius = google.maps.geometry.spherical.computeDistanceBetween(center, ne);

  searchCircle.value = new google.maps.Circle({
    center: center.toJSON(),
    radius,
    map: map.value,
    fillColor: '#4285F4',
    fillOpacity: 0.2,
    strokeColor: '#4285F4',
    strokeOpacity: 0.6,
    strokeWeight: 1,
  });

  console.log('✅ 已畫出搜尋圓圈');
};

onMounted(async () => {
  if (hasSearched.value) return;
  const initialKeyword = route.query.keyword;
  if (typeof initialKeyword === 'string' && initialKeyword.trim()) {
    keyword.value = initialKeyword.trim();
  }
  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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
.map-container {
  width: 100%;
  height: 50vh;
  min-height: 350px;
}

.places-list-container {
  max-height: calc(50vh + 30px);
  overflow-y: auto;
}

/* 手機與平板版 (小於 1024px) */
@media (max-width: 1023px) {
  .map-container {
    height: 40vh;
    min-height: 280px;
  }

  .places-list-container {
    max-height: 300px;
  }
}
</style>
