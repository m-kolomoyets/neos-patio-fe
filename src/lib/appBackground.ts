/**
 * Shared full-viewport background selection. Home picks a random image on every
 * page load and persists its index; other screens (e.g. Create Patio) inherit
 * that same image instead of rolling their own. A full Home reload re-picks.
 */

export const APP_BACKGROUND_FALLBACK_SRC = '/images/bg-secondary.webp';

export const APP_BACKGROUNDS: readonly [string, ...string[]] = [
    APP_BACKGROUND_FALLBACK_SRC,
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

const STORAGE_KEY = 'app-background-index';

const srcForIndex = (index: number): string => {
    return APP_BACKGROUNDS[index] ?? APP_BACKGROUND_FALLBACK_SRC;
};

/**
 * Picks a fresh random background, persists its index, and returns the src.
 * Call this on the source-of-truth screen (Home) once per page load.
 */
export const selectAppBackground = (): string => {
    const index = Math.floor(Math.random() * APP_BACKGROUNDS.length);
    try {
        sessionStorage.setItem(STORAGE_KEY, String(index));
    } catch {
        // sessionStorage unavailable (private mode / SSR) — fall back to the src only.
    }
    return srcForIndex(index);
};

/**
 * Returns the persisted background src so a screen inherits the one Home picked.
 * If nothing is persisted yet (e.g. deep-linked here), selects and persists one.
 */
export const getAppBackground = (): string => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            return srcForIndex(Number(raw));
        }
    } catch {
        // ignore and fall through to a fresh selection
    }
    return selectAppBackground();
};
