import type { Continent } from '@/services/patios/types';

export const HOME_SCROLL_ROOT_CLASS = 'home-scroll-root';
export const HOME_SCROLL_ROOT_SELECTOR = `.${HOME_SCROLL_ROOT_CLASS}`;

export const CONTINENT_LABELS: Record<Continent, string> = {
    africa: 'Africa',
    asia: 'Asia',
    europe: 'Europe',
    'north-america': 'North America',
    'south-america': 'South America',
    oceania: 'Oceania',
};
