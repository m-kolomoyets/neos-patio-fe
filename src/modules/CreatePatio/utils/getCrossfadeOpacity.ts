import { CROSSFADE_BAND } from '../constants';
import { prefersReducedMotion } from './prefersReducedMotion';

/** Which handoff layer a cross-fading element belongs to. */
export type CrossfadeLayer = 'placement' | 'browse';

/**
 * Pure zoom → opacity `[0, 1]` for one side of the browse ⇆ placement cross-fade.
 * A single ramp `t` runs 0 (fully browse) at/below `CROSSFADE_BAND.min` to 1
 * (fully placement) at/above `CROSSFADE_BAND.max`; the `placement` layer reads `t`
 * and the `browse` layer reads `1 - t`, so the two always sum to 1 and cross-fade
 * in lockstep. With `prefers-reduced-motion` the ramp snaps at the band midpoint,
 * turning the cross-fade into an instant swap.
 */
export const getCrossfadeOpacity = (zoom: number, layer: CrossfadeLayer): number => {
    const { min, max } = CROSSFADE_BAND;

    let t = Math.min(1, Math.max(0, (zoom - min) / (max - min)));
    if (prefersReducedMotion()) {
        t = t < 0.5 ? 0 : 1;
    }

    return layer === 'placement' ? t : 1 - t;
};
