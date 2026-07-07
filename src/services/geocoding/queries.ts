import type { GeocodingSearchParams } from './types';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { searchPlaces } from './api';
import { geocodingKeys } from './queryKeys';

export const getGeocodingSearchQueryOptions = (params: GeocodingSearchParams) => {
    return queryOptions({
        queryKey: geocodingKeys.search(params),
        queryFn({ signal }) {
            return searchPlaces(params, signal);
        },
        enabled: params.q.trim().length > 0,
        placeholderData: keepPreviousData,
    });
};

export const useGeocodingSearch = (params: GeocodingSearchParams) => {
    return useQuery(getGeocodingSearchQueryOptions(params));
};
