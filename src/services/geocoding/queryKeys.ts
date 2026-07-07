import type { GeocodingSearchParams } from './types';

export const geocodingKeys = {
    root() {
        return ['geocoding'] as const;
    },
    searchAll() {
        return [...geocodingKeys.root(), 'search'] as const;
    },
    search(params: GeocodingSearchParams) {
        return [...geocodingKeys.searchAll(), params] as const;
    },
};
