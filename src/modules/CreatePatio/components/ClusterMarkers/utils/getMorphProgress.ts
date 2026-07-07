import { MORPH_BAND } from '../../../constants';

/**
 * Pure zoom → morph progress in `[0, 1]`, clamped at both band ends. `0` at/above
 * the band top (z17 — full geo-accurate square) and `1` at/below the band bottom
 * (z14 — fixed circle); linear in between. No map or DOM access, so it is trivial
 * to unit-test at its z14/z17 boundaries.
 */
export const getMorphProgress = (zoom: number): number => {
    const { min, max } = MORPH_BAND;

    if (zoom >= max) return 0;
    if (zoom <= min) return 1;

    return (max - zoom) / (max - min);
};
