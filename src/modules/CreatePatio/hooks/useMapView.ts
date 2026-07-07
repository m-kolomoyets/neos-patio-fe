import type { MapView } from '../types';
import { useState } from 'react';
import { DEFAULT_MAP_VIEW, MAP_VIEW_STORAGE_KEY } from '../constants';

/**
 * Reads the persisted map view synchronously (module/first-render time), so both
 * the tab bar's initial value and the satellite raster's initial opacity match
 * the stored choice on the very first paint — no flash to the default then back.
 * Guards `localStorage` for non-DOM/blocked-storage environments.
 */
export const readStoredMapView = (): MapView => {
    if (typeof window === 'undefined') return DEFAULT_MAP_VIEW;

    try {
        const stored = window.localStorage.getItem(MAP_VIEW_STORAGE_KEY);
        return stored === 'satellite' || stored === 'aerial' ? stored : DEFAULT_MAP_VIEW;
    } catch {
        return DEFAULT_MAP_VIEW;
    }
};

/**
 * localStorage-backed map-view state for the create-patio view tabs. The setter
 * persists the choice; the actual base-map cross-fade is applied imperatively by
 * the tab bar (via `setPaintProperty`) rather than by re-rendering the map.
 */
export const useMapView = (): [MapView, (_view: MapView) => void] => {
    const [view, setView] = useState<MapView>(readStoredMapView);

    const persistView = (next: MapView) => {
        setView(next);

        try {
            window.localStorage.setItem(MAP_VIEW_STORAGE_KEY, next);
        } catch {
            // Storage unavailable/blocked — keep the in-memory choice, skip persistence.
        }
    };

    return [view, persistView];
};
