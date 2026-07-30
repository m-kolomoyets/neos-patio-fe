import type { ListPatiosParams } from './types';

export type PatiosListFilters = Omit<ListPatiosParams, 'page' | 'pageSize'>;
export type PatioLettersFilters = Omit<ListPatiosParams, 'page' | 'pageSize' | 'sort'>;

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
    fullList() {
        return [...patiosKeys.root(), 'full-list'] as const;
    },
    points() {
        return [...patiosKeys.root(), 'points'] as const;
    },
    fullListWithParams(filters: PatiosListFilters) {
        return [...patiosKeys.fullList(), filters] as const;
    },
    /** `ref` is the patio ref as it appears in the URL (slug), not necessarily the id. */
    detail(ref: string) {
        return [...patiosKeys.root(), 'detail', ref] as const;
    },
    letters(filters: PatioLettersFilters) {
        return [...patiosKeys.root(), 'letters', filters] as const;
    },
};
