// src/api/places.ts
import { api } from './client';
import { z } from 'zod';

export const NearbyStoresParamsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number(),
  keyword: z.string().optional(),
});

export type NearbyStoresParams = z.infer<typeof NearbyStoresParamsSchema>;

export const placesApi = {
  /**
   * 搜尋附近店家
   */
  getNearbyStores(params: NearbyStoresParams) {
    return api.get('/places/nearby-stores', { params });
  },
};
