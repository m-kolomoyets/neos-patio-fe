import type { PatioBounds } from '@/services/patios/types';

export type LngLat = { lng: number; lat: number };

export const clampToBounds = (bounds: PatioBounds, point: LngLat): LngLat => {
    const [west, south, east, north] = bounds;
    return {
        lng: Math.min(Math.max(point.lng, west), east),
        lat: Math.min(Math.max(point.lat, south), north),
    };
};
