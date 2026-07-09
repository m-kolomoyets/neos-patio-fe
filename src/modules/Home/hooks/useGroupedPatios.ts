import type { PatiosListFilters } from '@/services/patios/queryKeys';
import type { Patio } from '@/services/patios/types';
import type { PatioGroup } from '../utils/groupPatios';
import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getGroupedPatiosQueryOptions, getPatiosListInfiniteQueryOptions } from '@/services/patios/queries';
import { groupByAlpha, groupByContinent } from '../utils/groupPatios';

export type GroupingMode = 'flat' | 'continent' | 'alpha';

export type UseGroupedPatiosResult = {
    mode: GroupingMode;
    items: Patio[] | null;
    groups: PatioGroup[] | null;
    isLoading: boolean;
    isFetched: boolean;
    isError: boolean;
    refetch: () => void;
    hasNextPage: boolean | null;
    isFetchingNextPage: boolean | null;
    fetchNextPage: (() => void) | null;
};

const resolveMode = (filters: PatiosListFilters): GroupingMode => {
    if (filters.continents?.length) {
        return 'continent';
    }
    if (filters.sort === 'name') {
        return 'alpha';
    }
    return 'flat';
};

export const useGroupedPatios = (filters: PatiosListFilters): UseGroupedPatiosResult => {
    const mode = resolveMode(filters);

    const flatEnabled = mode === 'flat';
    const groupedEnabled = mode !== 'flat';

    const continents = filters.continents;

    const groupFn = useMemo(() => {
        if (mode === 'continent') {
            return (items: Patio[]) => {
                return groupByContinent(items, continents ?? []);
            };
        }
        if (mode === 'alpha') {
            return (items: Patio[]) => {
                return groupByAlpha(items);
            };
        }
        return (_items: Patio[]): PatioGroup[] => {
            return [];
        };
    }, [mode, continents]);

    const flatQuery = useInfiniteQuery({
        ...getPatiosListInfiniteQueryOptions(filters),
        enabled: flatEnabled,
        placeholderData: keepPreviousData,
    });

    const groupedQuery = useQuery(getGroupedPatiosQueryOptions(filters, groupFn, groupedEnabled));

    const items = useMemo(() => {
        if (!flatEnabled) {
            return null;
        }
        return (
            flatQuery.data?.pages.flatMap((p) => {
                return p.items;
            }) ?? []
        );
    }, [flatEnabled, flatQuery.data]);

    if (flatEnabled) {
        return {
            mode,
            items,
            groups: null,
            isLoading: flatQuery.isLoading,
            isFetched: flatQuery.isFetched,
            isError: flatQuery.isError,
            refetch() {
                flatQuery.refetch();
            },
            hasNextPage: flatQuery.hasNextPage,
            isFetchingNextPage: flatQuery.isFetchingNextPage,
            fetchNextPage() {
                flatQuery.fetchNextPage();
            },
        };
    }

    return {
        mode,
        items: null,
        groups: groupedQuery.data ?? null,
        isLoading: groupedQuery.isLoading,
        isFetched: groupedQuery.isFetched,
        isError: groupedQuery.isError,
        refetch() {
            groupedQuery.refetch();
        },
        hasNextPage: null,
        isFetchingNextPage: null,
        fetchNextPage: null,
    };
};
