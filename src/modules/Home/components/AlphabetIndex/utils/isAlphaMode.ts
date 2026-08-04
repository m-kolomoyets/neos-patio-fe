import type { usePatioFilters } from '@/modules/Home/hooks/usePatioFilters';

export const isAlphaMode = (filters: ReturnType<typeof usePatioFilters>['filters']) => {
    return filters.sort === 'name' && !filters.continents?.length;
};
