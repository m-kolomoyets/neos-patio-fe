import type { MapRef } from 'react-map-gl/maplibre';
import type { CameraTarget, HomeView } from '../types';
import { useCallback, useMemo } from 'react';
import { DEFAULT_BEARING, DEFAULT_PITCH, DEFAULT_ZOOM } from '../../MapCanvas/constants';
import { HOME_STORAGE_PREFIX } from '../constants';
import { useEditorState } from '../../../context/EditorContext';
import { usePatioEditorParams } from '../../../hooks/usePatioEditorRouteApi';

/** localStorage entry holding the saved Home view, parsed defensively. */
const readStoredHome = (key: string): HomeView | null => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as HomeView) : null;
    } catch {
        return null;
    }
};

/**
 * The Home view: a saved camera framing of the patio, persisted in localStorage
 * keyed by patio id and surviving reloads.
 *
 * Default Home mirrors the editor's `initialViewState` — patio-center,
 * {@link DEFAULT_ZOOM}/{@link DEFAULT_PITCH}/{@link DEFAULT_BEARING}. `goHome`
 * eases to the saved (or default) view, `setHome` snapshots the live camera,
 * `resetHome` clears storage and returns to default. All moves go through the
 * shared animated `easeTo`. Home is viewport state, never the undo reducer.
 */
export const useHomeView = (map: MapRef | null, easeTo: (_target: CameraTarget) => void) => {
    const { id } = usePatioEditorParams();
    const { bounds } = useEditorState();
    const storageKey = `${HOME_STORAGE_PREFIX}${id}`;

    const defaultHome = useMemo<HomeView>(() => {
        const [west, south, east, north] = bounds;
        return {
            center: [(west + east) / 2, (south + north) / 2],
            zoom: DEFAULT_ZOOM,
            pitch: DEFAULT_PITCH,
            bearing: DEFAULT_BEARING,
        };
    }, [bounds]);

    /** Ease to the saved Home (falling back to the editor default). */
    const goHome = useCallback(() => {
        easeTo(readStoredHome(storageKey) ?? defaultHome);
    }, [easeTo, storageKey, defaultHome]);

    /** Snapshot the live camera as the new Home and persist it. */
    const setHome = useCallback(() => {
        if (!map) return;
        const { lng, lat } = map.getCenter();
        const home: HomeView = {
            center: [lng, lat],
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(home));
        } catch {
            // Storage unavailable (private mode / quota) — Home stays at default.
        }
    }, [map, storageKey]);

    /** Forget the saved Home and ease back to the editor default. */
    const resetHome = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Ignore storage errors; the ease-to-default below still runs.
        }
        easeTo(defaultHome);
    }, [easeTo, storageKey, defaultHome]);

    return { goHome, setHome, resetHome };
};
