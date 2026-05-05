import type { Continent } from '@/services/patios/types';

export const HOME_SCROLL_ROOT_CLASS = 'home-scroll-root';
export const HOME_SCROLL_ROOT_SELECTOR = `.${HOME_SCROLL_ROOT_CLASS}`;

export const HOME_BACKGROUND_FALLBACK_SRC = '/images/bg-secondary.webp';

export const HOME_BACKGROUNDS: readonly [string, ...string[]] = [
    HOME_BACKGROUND_FALLBACK_SRC,
    'https://patiostorage.blob.core.windows.net/assets/Burj%20Khalifa.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Loarre%20Castle.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Milan%20Cathedral.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Taj%20Mahal.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Tower%20Bridge.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Sydney%20Opera%20House.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Jeddah%20Tower.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Louvre%20Abu%20Dhabi.jpg',
    'https://patiostorage.blob.core.windows.net/assets/Museu%20de%20les%20Ci%C3%A8ncies%20Pr%C3%ADncipe%20Felipe.jpg',
];

export const CONTINENT_LABELS: Record<Continent, string> = {
    africa: 'Africa',
    asia: 'Asia',
    europe: 'Europe',
    'north-america': 'North America',
    'south-america': 'South America',
    oceania: 'Oceania',
};
