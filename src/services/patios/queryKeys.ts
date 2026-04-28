import type { ListPatiosParams } from './types';

export type PatiosListFilters = Omit<ListPatiosParams, 'page' | 'pageSize'>;

export const patiosKeys = {
    root() {
        return ['patios'] as const;
    },
    featured() {
        return [...patiosKeys.root(), 'featured'] as const;
    },
    listAll() {
        return [...patiosKeys.root(), 'list'] as const;
    },
    list(filters: PatiosListFilters) {
        return [...patiosKeys.listAll(), filters] as const;
    },
    detail(id: string) {
        return [...patiosKeys.root(), 'detail', id] as const;
    },
};
