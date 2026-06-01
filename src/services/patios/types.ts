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

export type PatioBounds = [west: number, south: number, east: number, north: number];

export type PlacedObject = {
    id: string;
    modelId: string;
    // Local Cartesian scene coordinates in meters, anchored at the patio bounds center.
    // x = east, y = up, z = south (raw three.js scene axes, no conversion).
    x: number;
    y: number;
    z: number;
    // Euler rotation in radians, three.js XYZ order.
    rotX: number;
    rotY: number;
    rotZ: number;
    scale: number;
};

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
    bounds: PatioBounds;
    objects: PlacedObject[];
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
