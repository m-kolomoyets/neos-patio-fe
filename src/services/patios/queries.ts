import type { PatioLettersFilters, PatiosListFilters } from './queryKeys';
import type { Patio } from './types';
import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getPatio, listAllPatios, listFeaturedPatios, listPatioLetters, listPatios } from './api';
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

export const getPatiosListAllQueryOptions = (filters: PatiosListFilters) => {
    return queryOptions({
        queryKey: patiosKeys.fullListWithParams(filters),
        queryFn: () => {
            return listAllPatios(filters);
        },
    });
};

export const getGroupedPatiosQueryOptions = <TGroup>(
    filters: PatiosListFilters,
    groupFn: (_items: Patio[]) => TGroup[],
    enabled: boolean
) => {
    return queryOptions({
        queryKey: patiosKeys.fullListWithParams(filters),
        queryFn: () => {
            return listAllPatios(filters);
        },
        select: groupFn,
        enabled,
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

export const getPatioLettersQueryOptions = (filters: PatioLettersFilters) => {
    return queryOptions({
        queryKey: patiosKeys.letters(filters),
        queryFn: () => {
            return listPatioLetters(filters);
        },
    });
};

export const usePatioLetters = (filters: PatioLettersFilters) => {
    return useQuery(getPatioLettersQueryOptions(filters));
};

export const useFeaturedPatios = () => {
    return useQuery(getFeaturedPatiosQueryOptions());
};

export const usePatiosListInfinite = (filters: PatiosListFilters) => {
    return useInfiniteQuery(getPatiosListInfiniteQueryOptions(filters));
};
