import { CROSSFADE_BAND, MORPH_BAND } from '../../../constants';

/**
 * Pure zoom → morph progress in `[0, 1]`, clamped at both band ends. `0` at/above
 * `CROSSFADE_BAND.min` (full geo-accurate square) and `1` at/below the band bottom
 * (z14 — fixed circle); linear in between. No map or DOM access, so it is trivial
 * to unit-test at its boundaries.
 *
 * Progress reaches 0 at `CROSSFADE_BAND.min` — not the morph band top (z17) — so
 * the marker is locked at its full square size across the entire browse ⇆ placement
 * cross-fade. The geo SVG squares are pure `metersToPixels` (no morph shrink), so
 * if the marker were still tweening toward the smaller circle here it would sit
 * visibly smaller than the square it fades into. Holding square size through the
 * cross-fade makes the two match pixel-for-pixel and hides the swap.
 */
export const getMorphProgress = (zoom: number): number => {
    const { min } = MORPH_BAND;
    const max = CROSSFADE_BAND.min;

    if (zoom >= max) return 0;
    if (zoom <= min) return 1;

    return (max - zoom) / (max - min);
};
