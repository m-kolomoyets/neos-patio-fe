import type { PatioLettersFilters, PatiosListFilters } from './queryKeys';
import type { Patio, PlacedObject } from './types';
import { infiniteQueryOptions, keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';
import { queryClient } from '@/lib/@queryClient';
import { getPatio, listAllPatios, listFeaturedPatios, listPatioLetters, listPatios, updatePatioObjects } from './api';
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
        initialPageParam: 1,
        queryFn({ pageParam }) {
            return listPatios({ ...filters, page: pageParam, pageSize: PATIOS_PAGE_SIZE });
        },
        getNextPageParam(last) {
            return last.nextPage;
        },
        placeholderData: keepPreviousData,
    });
};

export const getPatiosListAllQueryOptions = (filters: PatiosListFilters) => {
    return queryOptions({
        queryKey: patiosKeys.fullListWithParams(filters),
        queryFn() {
            return listAllPatios(filters);
        },
        placeholderData: keepPreviousData,
    });
};

export const getGroupedPatiosQueryOptions = <TGroup>(
    filters: PatiosListFilters,
    groupFn: (_items: Patio[]) => TGroup[],
    enabled: boolean
) => {
    return queryOptions({
        queryKey: patiosKeys.fullListWithParams(filters),
        enabled,
        queryFn() {
            return listAllPatios(filters);
        },
        select: groupFn,
        placeholderData: keepPreviousData,
    });
};

export const getPatioQueryOptions = (id: string) => {
    return queryOptions({
        queryKey: patiosKeys.detail(id),
        queryFn() {
            return getPatio(id);
        },
    });
};

export const updatePatioObjectsMutationOptions = (id: string) => {
    return mutationOptions({
        mutationKey: [...patiosKeys.detail(id), 'update-objects'],
        mutationFn(objects: PlacedObject[]) {
            return updatePatioObjects(id, objects);
        },
        onSuccess() {
            return queryClient.invalidateQueries({ queryKey: patiosKeys.detail(id) });
        },
    });
};

export const getPatioLettersQueryOptions = (filters: PatioLettersFilters) => {
    return queryOptions({
        queryKey: patiosKeys.letters(filters),
        queryFn() {
            return listPatioLetters(filters);
        },
    });
};
