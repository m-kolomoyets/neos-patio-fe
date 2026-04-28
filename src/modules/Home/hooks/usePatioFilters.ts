import type { Continent, PatioType, SortKey } from '@/services/patios/types';
import { useCallback, useMemo } from 'react';
import { useHomeNavigate, useHomeSearch } from './useHomeRouteApi';

const arrayOrUndefined = <T>(values: T[] | undefined): T[] | undefined => {
    return values && values.length > 0 ? values : undefined;
};

export const usePatioFilters = () => {
    const search = useHomeSearch();
    const navigate = useHomeNavigate();

    const filters = useMemo(() => {
        return {
            q: search.q,
            continents: search.continents,
            types: search.types,
            sort: search.sort,
        };
    }, [search.q, search.continents, search.types, search.sort]);

    const setQ = useCallback(
        (value: string) => {
            navigate({
                search: (prev) => {
                    return { ...prev, q: value.trim() ? value : undefined };
                },
                replace: true,
            });
        },
        [navigate]
    );

    const setContinents = useCallback(
        (values: Continent[]) => {
            navigate({
                search: (prev) => {
                    return { ...prev, continents: arrayOrUndefined(values) };
                },
                replace: true,
            });
        },
        [navigate]
    );

    const setTypes = useCallback(
        (values: PatioType[]) => {
            navigate({
                search: (prev) => {
                    return { ...prev, types: arrayOrUndefined(values) };
                },
                replace: true,
            });
        },
        [navigate]
    );

    const setSort = useCallback(
        (value: SortKey | undefined) => {
            navigate({
                search: (prev) => {
                    return { ...prev, sort: value };
                },
                replace: true,
            });
        },
        [navigate]
    );

    const resetFilters = useCallback(() => {
        navigate({
            search: (prev) => {
                return { ...prev, continents: undefined, types: undefined };
            },
            replace: true,
        });
    }, [navigate]);

    const resetSort = useCallback(() => {
        navigate({
            search: (prev) => {
                return { ...prev, sort: undefined };
            },
            replace: true,
        });
    }, [navigate]);

    const hasActiveFilters = Boolean(filters.continents?.length || filters.types?.length);
    const hasActiveSort = Boolean(filters.sort);

    return {
        filters,
        setQ,
        setContinents,
        setTypes,
        setSort,
        resetFilters,
        resetSort,
        hasActiveFilters,
        hasActiveSort,
    };
};
