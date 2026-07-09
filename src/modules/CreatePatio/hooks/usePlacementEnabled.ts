import { PLACEMENT_MIN_ZOOM } from '../constants';
import { useZoomAtLeast } from './useZoomAtLeast';

/**
 * Live placement gate: `true` only at/above `PLACEMENT_MIN_ZOOM`, where the
 * footprint can be placed/repositioned. Below it the map is browse-only. A thin
 * wrapper over `useZoomAtLeast` so the interaction gate re-renders a consumer only
 * when the threshold is actually crossed, never per frame. Shared by
 * `ClusterMarkers` so the browse markers unmount exactly at the threshold (having
 * already cross-faded to 0 across `CROSSFADE_BAND`). `false` until the camera reports.
 */
export const usePlacementEnabled = (): boolean => {
    return useZoomAtLeast(PLACEMENT_MIN_ZOOM);
};
