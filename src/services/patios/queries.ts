import type { PatiosListFilters } from './queryKeys';
import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getPatio, listFeaturedPatios, listPatios } from './api';
import { patiosKeys } from './queryKeys';

export const PATIOS_PAGE_SIZE = 12;

export const getFeaturedPatiosQueryOptions = () => {
    return queryOptions({
        queryKey: patiosKeys.featured(),
        queryFn: listFeaturedPatios,
    });
};

export const getPatiosListInfiniteQueryOptions = (filters: PatiosListFilters) => {
    return infiniteQueryOptions({
        queryKey: patiosKeys.list(filters),
        queryFn: ({ pageParam }) => {
            return listPatios({ ...filters, page: pageParam, pageSize: PATIOS_PAGE_SIZE });
        },
        initialPageParam: 1,
        getNextPageParam: (last) => {
            return last.nextPage;
        },
    });
};

export const getPatioQueryOptions = (id: string) => {
    return queryOptions({
        queryKey: patiosKeys.detail(id),
        queryFn: () => {
            return getPatio(id);
        },
    });
};

export const useFeaturedPatios = () => {
    return useQuery(getFeaturedPatiosQueryOptions());
};

export const usePatiosListInfinite = (filters: PatiosListFilters) => {
    return useInfiniteQuery(getPatiosListInfiniteQueryOptions(filters));
};
