import type { PatioMarker } from '../types';

/** Stable key accessor for `usePresence` (must not change identity per render). */
export const markerKey = (marker: PatioMarker) => {
    return marker.key;
};
