import { PATIO_SIZE_M, SQUARE_CORNER_RADIUS } from '../../../constants';
import { metersToPixels } from '../../../utils/metersToPixels';
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion';
import { getMorphProgress } from './getMorphProgress';

export type MorphStyle = {
    /** Element side/diameter (px): geo footprint at z17 → `circleSize` at z14. */
    size: number;
    /**
     * Corner radius (px): `SQUARE_CORNER_RADIUS` at z17 — matching the SVG patio
     * square so the swap is seamless — growing to `size / 2` (full circle) at z14.
     */
    radius: number;
    /** Morph progress [0,1]: 0 (square) at z17 → 1 (circle) at z14. Drives count fade. */
    progress: number;
};

/**
 * Resolves the live morph geometry for one marker at the current zoom and
 * latitude. Size interpolates between the geo-accurate 100m footprint (meters→px
 * via the shared `metersToPixels`) and the fixed circle diameter; radius runs
 * square→circle. With `prefers-reduced-motion` the progress snaps to the nearest
 * band end, so the marker cuts between square and circle instead of tweening.
 */
export const getMorphStyle = (zoom: number, latitude: number, circleSize: number): MorphStyle => {
    let progress = getMorphProgress(zoom);
    if (prefersReducedMotion()) {
        progress = progress < 0.5 ? 0 : 1;
    }

    const geoSize = metersToPixels(PATIO_SIZE_M, latitude, zoom);
    const size = geoSize + (circleSize - geoSize) * progress;

    return {
        size,
        // Square corner (24px) → full circle (size / 2), matching the SVG square end.
        radius: SQUARE_CORNER_RADIUS + (size / 2 - SQUARE_CORNER_RADIUS) * progress,
        progress,
    };
};
