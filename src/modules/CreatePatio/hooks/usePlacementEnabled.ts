import { PLACEMENT_MIN_ZOOM } from '../constants';
import { useMapCamera } from './useMapCamera';

/**
 * Live placement gate derived from the camera zoom: `true` only at/above
 * `PLACEMENT_MIN_ZOOM`, where the footprint can be placed/repositioned. Below it
 * the map is browse-only. One source of truth so the squares overlay and the map
 * click handler can gate off the same value. `false` until the camera reports.
 */
export const usePlacementEnabled = (): boolean => {
    const camera = useMapCamera();

    return camera !== null && camera.zoom >= PLACEMENT_MIN_ZOOM;
};
