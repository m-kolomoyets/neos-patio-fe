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
    // Human-readable name shown in the Scene list. Generated on add from the
    // model display name, deduped with a numeric suffix (`Anvil`, `Anvil 2`).
    name: string;
    // Geographic position. lng/lat in degrees; height is the absolute altitude
    // above the WGS84 ellipsoid (meters), resolved from the real tileset surface.
    lng: number;
    lat: number;
    height: number;
    // Orientation as a heading/pitch/roll triple in radians (Cesium ENU frame).
    heading: number;
    pitch: number;
    roll: number;
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
