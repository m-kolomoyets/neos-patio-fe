import type { ListPatiosParams, ListPatiosResponse, Patio } from './types';
import { sleep } from '@/lib/utils/sleep';
import { PATIOS_FIXTURES } from './fixtures';

const MOCK_DELAY_MS = 200;

const sortPatios = (items: Patio[], sort: ListPatiosParams['sort']): Patio[] => {
    const list = [...items];
    switch (sort) {
        case 'name':
            return list.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        case 'newest':
            return list.sort((a, b) => {
                return b.createdAt.localeCompare(a.createdAt);
            });
        case 'popular':
            return list.sort((a, b) => {
                return b.popularity - a.popularity;
            });
        case 'nearest':
        case 'id':
        default:
            return list.sort((a, b) => {
                return Number(a.id) - Number(b.id);
            });
    }
};

export const listPatios = async (params: ListPatiosParams): Promise<ListPatiosResponse> => {
    await sleep(MOCK_DELAY_MS);

    const { q, continents, types, sort, page, pageSize } = params;
    const normalisedQ = q?.trim().toLowerCase();

    let filtered = PATIOS_FIXTURES;

    if (normalisedQ) {
        filtered = filtered.filter((p) => {
            return (
                p.name.toLowerCase().includes(normalisedQ) ||
                p.country.toLowerCase().includes(normalisedQ) ||
                p.author.toLowerCase().includes(normalisedQ)
            );
        });
    }

    if (continents?.length) {
        filtered = filtered.filter((p) => {
            return continents.includes(p.continent);
        });
    }

    if (types?.length) {
        filtered = filtered.filter((p) => {
            return types.includes(p.type);
        });
    }

    const sorted = sortPatios(filtered, sort);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = sorted.slice(start, end);
    const nextPage = end < sorted.length ? page + 1 : null;

    return { items, nextPage, total: sorted.length };
};

export const listFeaturedPatios = async (): Promise<Patio[]> => {
    await sleep(MOCK_DELAY_MS);
    return PATIOS_FIXTURES.filter((p) => {
        return p.isFeatured;
    });
};

export const getPatio = async (id: string): Promise<Patio | null> => {
    await sleep(MOCK_DELAY_MS);
    return (
        PATIOS_FIXTURES.find((p) => {
            return p.id === id;
        }) ?? null
    );
};
