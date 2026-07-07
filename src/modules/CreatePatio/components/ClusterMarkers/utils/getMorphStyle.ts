import { PATIO_SIZE_M } from '../../../constants';
import { metersToPixels } from '../../../utils/metersToPixels';
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion';
import { getMorphProgress } from './getMorphProgress';

export type MorphStyle = {
    /** Element side/diameter (px): geo footprint at z17 → `circleSize` at z14. */
    size: number;
    /** Corner radius (%): 0 (square) at z17 → 50 (circle) at z14. */
    radius: number;
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

    return {
        size: geoSize + (circleSize - geoSize) * progress,
        radius: progress * 50,
    };
};
