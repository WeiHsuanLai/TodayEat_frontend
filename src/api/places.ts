// src/api/places.ts
import { api } from './client';
import { z } from 'zod';

export const NearbyStoresParamsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number(),
  keyword: z.string().optional(),
});

export const PlaceDetailsParamsSchema = z.object({
  place_id: z.string(),
});

export type NearbyStoresParams = z.infer<typeof NearbyStoresParamsSchema>;
export type PlaceDetailsParams = z.infer<typeof PlaceDetailsParamsSchema>;

export interface PlaceDetailsResponse {
  result: {
    name: string;
    formatted_address: string;
    url: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      relative_time_description: string;
    }>;
    photos?: Array<{
      photoUrl: string;
    }>;
  };
  status: string;
}

export interface PlaceReviewsResponse {
  rating: number;
  user_ratings_total: number;
  url: string;
  reviews: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
  }>;
}

export const placesApi = {
  /**
   * 搜尋附近店家
   */
  getNearbyStores(params: NearbyStoresParams) {
    const validatedParams = NearbyStoresParamsSchema.parse(params);
    return api.get('/places/nearby-stores', { params: validatedParams });
  },

  /**
   * 獲取店家詳情
   */
  getPlaceDetails(params: PlaceDetailsParams) {
    const validatedParams = PlaceDetailsParamsSchema.parse(params);
    return api.get<PlaceDetailsResponse>('/places/details', { params: validatedParams });
  },

  /**
   * 獲取店家評論
   */
  getPlaceReviews(params: PlaceDetailsParams) {
    const validatedParams = PlaceDetailsParamsSchema.parse(params);
    return api.get<PlaceReviewsResponse>('/places/reviews', { params: validatedParams });
  },
};
