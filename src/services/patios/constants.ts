import type { Continent } from './types';

/**
 * Display names for the `Continent` union. Lives in the service layer because
 * both Home (library grouping, cards) and the create-patio map popup render it.
 */
export const CONTINENT_LABELS: Record<Continent, string> = {
    africa: 'Africa',
    asia: 'Asia',
    europe: 'Europe',
    'north-america': 'North America',
    'south-america': 'South America',
    oceania: 'Oceania',
};
