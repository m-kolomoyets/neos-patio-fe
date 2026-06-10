import type { CameraState, CameraTarget, HomeView } from '../types';
import { useCallback, useMemo } from 'react';
import { DEFAULT_BEARING, DEFAULT_PITCH, HOME_STORAGE_PREFIX } from '../constants';
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

type UseHomeViewArgs = {
    easeTo: (_target: CameraTarget) => void;
    readOrientation: () => CameraState;
    /** Patio-diagonal range used as the default Home distance (100% framing). */
    referenceRange: number;
};

/**
 * The Home view: a saved camera framing of the patio, persisted in localStorage
 * keyed by patio id and surviving reloads.
 *
 * Default Home mirrors the editor's initial framing — heading 0, pitch -45°
 * ({@link DEFAULT_BEARING}/{@link DEFAULT_PITCH} in display units), at the
 * patio-diagonal `referenceRange`. `goHome` eases to the saved (or default)
 * view, `setHome` snapshots the live camera, `resetHome` clears storage and
 * returns to default. All moves go through the shared animated `easeTo`. Home is
 * viewport state, never the undo reducer.
 */
export const useHomeView = ({ easeTo, readOrientation, referenceRange }: UseHomeViewArgs) => {
    const { id } = usePatioEditorParams();
    const storageKey = `${HOME_STORAGE_PREFIX}${id}`;

    const defaultHome = useMemo<HomeView>(() => {
        return { bearing: DEFAULT_BEARING, pitch: DEFAULT_PITCH, range: referenceRange };
    }, [referenceRange]);

    /** Ease to the saved Home (falling back to the editor default). */
    const goHome = useCallback(() => {
        easeTo(readStoredHome(storageKey) ?? defaultHome);
    }, [easeTo, storageKey, defaultHome]);

    /** Snapshot the live camera as the new Home and persist it. */
    const setHome = useCallback(() => {
        const { bearing, pitch, range } = readOrientation();
        const home: HomeView = { bearing, pitch, range };
        try {
            localStorage.setItem(storageKey, JSON.stringify(home));
        } catch {
            // Storage unavailable (private mode / quota) — Home stays at default.
        }
    }, [readOrientation, storageKey]);

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
