export const CONTINENTS = ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania'] as const;
export type Continent = (typeof CONTINENTS)[number];

export const PATIO_TYPES = [
    'museum',
    'landmark',
    'monument',
    'stadium',
    'park',
    'art',
    'historic-site',
    'architecture',
] as const;
export type PatioType = (typeof PATIO_TYPES)[number];

export const SORT_KEYS = ['id', 'newest', 'nearest', 'popular', 'name'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type Patio = {
    id: string;
    name: string;
    country: string;
    continent: Continent;
    type: PatioType;
    author: string;
    createdAt: string;
    popularity: number;
    coords: { lat: number; lng: number };
    isFeatured: boolean;
    videoUrl?: string;
    previewLowUrl?: string;
    previewHighUrl: string;
    previewBackgroundUrl: string;
};

export type ListPatiosParams = {
    q?: string;
    continents?: Continent[];
    types?: PatioType[];
    sort?: SortKey;
    page: number;
    pageSize: number;
};

export type ListPatiosResponse = {
    items: Patio[];
    nextPage: number | null;
    total: number;
};
