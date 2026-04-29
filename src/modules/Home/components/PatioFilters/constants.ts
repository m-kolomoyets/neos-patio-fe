import type { Continent, PatioType } from '@/services/patios/types';

export const FILTERS_DEBOUNCE_MS = 400;

export const CONTINENT_LABELS: Array<{ value: Continent; label: string }> = [
    { value: 'africa', label: 'Africa' },
    { value: 'asia', label: 'Asia' },
    { value: 'europe', label: 'Europe' },
    { value: 'north-america', label: 'North America' },
    { value: 'south-america', label: 'South America' },
    { value: 'oceania', label: 'Oceania' },
];

export const TYPE_LABELS: Array<{ value: PatioType; label: string }> = [
    { value: 'museum', label: 'Museum' },
    { value: 'landmark', label: 'Landmark' },
    { value: 'monument', label: 'Monument' },
    { value: 'stadium', label: 'Stadium' },
    { value: 'park', label: 'Park' },
    { value: 'art', label: 'Art' },
    { value: 'historic-site', label: 'Historic site' },
    { value: 'architecture', label: 'Architecture' },
];
