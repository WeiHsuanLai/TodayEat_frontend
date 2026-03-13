// src/api/places.ts
import { api } from './client';

export interface NearbyStoresParams {
  lat: number;
  lng: number;
  radius: number;
  keyword?: string;
}

export const placesApi = {
  /**
   * 搜尋附近店家
   */
  getNearbyStores(params: NearbyStoresParams) {
    return api.get('/places/nearby-stores', { params });
  }
};
