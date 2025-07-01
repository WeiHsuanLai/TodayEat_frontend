<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">📍 搜尋附近店家</div>
    <q-input
      v-model="keyword"
      label="輸入關鍵字"
      @keyup.enter="onSearch"
      @compositionend="onSearch"
      dense
    >
      <template #append>
        <q-btn flat icon="search" @click="onSearch" />
      </template>
    </q-input>

    <div id="map" style="width: 30%; height: 300px" class="q-mt-md"></div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { api } from 'src/composables/axios';

const keyword = ref('');
const map = ref<google.maps.Map | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markers = ref<any[]>([]);
const userLocation = ref({ lat: 25.0478, lng: 121.5319 }); // 預設台北車站
const onSearch = () => {
  console.log('[🔍 觸發搜尋]', keyword.value);
  if (!keyword.value.trim()) return;
  if (!map.value) {
    console.warn('⚠️ 地圖尚未初始化');
    return;
  }
  void fetchNearby();
};

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

  addUserLocationMarker();
};

// 清除舊標記
const clearMarkers = () => {
  markers.value.forEach((m) => (m.map = null));
  markers.value = [];
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
  if (!keyword.value.trim()) return;

  try {
    const params = {
      keyword: keyword.value,
      lat: userLocation.value.lat,
      lng: userLocation.value.lng,
    };

    const res = await api.get('/places/nearby-stores', { params });
    console.log('res', res);

    if (res.data?.results?.length) {
      addMarkers(res.data.results);
    } else {
      console.warn('❗ 沒有找到結果');
    }
  } catch (err) {
    console.error('🔴 API 錯誤:', err);
  }
};

onMounted(async () => {
  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      language: 'zh-TW',
      version: 'weekly',
    });

    // 載入 core 地圖（避免使用 load()）
    await loader.importLibrary('maps');

    // 載入 marker 與 places library（模組式）
    await Promise.all([loader.importLibrary('marker'), loader.importLibrary('places')]);

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
