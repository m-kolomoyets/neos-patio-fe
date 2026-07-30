import type { ListPatiosParams, ListPatiosResponse, Patio, PatioPointCollection, PlacedObject } from './types';
import { sleep } from '@/lib/utils/sleep';
import { buildPatioSlugIndex } from './utils/patioSlugIndex';
import { patiosToPointCollection } from './utils/patiosToPointCollection';
import { PATIOS_FIXTURES } from './fixtures';

const MOCK_DELAY_MS = 200;

/** Built once so resolution is constant-time rather than a scan per request. */
const PATIO_SLUG_INDEX = buildPatioSlugIndex(PATIOS_FIXTURES);

/**
 * Id → patio, taken from the slug index rather than the raw fixtures so the patio
 * always carries the slug it was actually indexed under. Reaching for the fixture
 * directly would hand back a pre-dedupe slug and send the canonical redirect to a
 * ref that resolves to a different patio.
 */
const PATIO_BY_ID = new Map(
    Array.from(PATIO_SLUG_INDEX.values(), (patio) => {
        return [patio.id, patio] as const;
    })
);

/** The reserved `id<n>` ref used by patios whose name yields no usable slug. */
const FALLBACK_REF_PATTERN = /^id(\d+)$/;

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

export const listAllPatios = async (params: Omit<ListPatiosParams, 'page' | 'pageSize'>): Promise<Patio[]> => {
    await sleep(MOCK_DELAY_MS);

    const { q, continents, types, sort } = params;
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

    return sortPatios(filtered, sort);
};

export const listPatioLetters = async (
    params: Omit<ListPatiosParams, 'page' | 'pageSize' | 'sort'>
): Promise<string[]> => {
    await sleep(MOCK_DELAY_MS);

    const { q, continents, types } = params;
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

    const letters = new Set<string>();
    for (const patio of filtered) {
        const stripped = patio.name.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        const first = stripped.trim().charAt(0).toUpperCase();
        letters.add(/[A-Z]/.test(first) ? first : '#');
    }

    return Array.from(letters).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
    });
};

export const getPatioPoints = async (): Promise<PatioPointCollection> => {
    await sleep(MOCK_DELAY_MS);
    return patiosToPointCollection(PATIOS_FIXTURES);
};

export const listFeaturedPatios = async (): Promise<Patio[]> => {
    await sleep(MOCK_DELAY_MS);
    return PATIOS_FIXTURES.filter((p) => {
        return p.isFeatured;
    });
};

/**
 * Single resolution point for a patio ref as it appears in the URL. Case is the only
 * tolerated variation — running arbitrary input back through `slugify` would let
 * unrelated garbage resolve to a real patio, because the function is lossy.
 *
 * Order: the canonical slug, then the reserved `id<n>` form, then a bare id
 * (legacy links shared before slugs existed).
 */
export const resolvePatioRef = (ref: string): Patio | null => {
    const normalised = ref.toLowerCase();
    const fallbackId = FALLBACK_REF_PATTERN.exec(normalised)?.[1];

    return (
        PATIO_SLUG_INDEX.get(normalised) ??
        (fallbackId ? PATIO_BY_ID.get(fallbackId) : undefined) ??
        PATIO_BY_ID.get(normalised) ??
        null
    );
};

export const getPatio = async (ref: string): Promise<Patio | null> => {
    await sleep(MOCK_DELAY_MS);
    return resolvePatioRef(ref);
};

export const updatePatioObjects = async (id: string, objects: PlacedObject[]): Promise<Patio | null> => {
    await sleep(MOCK_DELAY_MS);
    const patio = PATIOS_FIXTURES.find((p) => {
        return p.id === id;
    });
    if (!patio) return null;
    patio.objects = objects.map((o) => {
        return { ...o };
    });
    return patio;
};
