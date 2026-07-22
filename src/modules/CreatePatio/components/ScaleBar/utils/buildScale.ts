import { SCALE_BAR_KM_THRESHOLD_M, SCALE_BAR_TARGET_TICK_SPACING_PX, SCALE_BAR_USABLE_WIDTH_PX } from '../constants';
import { nearestNiceStep } from './nearestNiceStep';

export type ScaleUnit = 'm' | 'km';

export type Scale = {
    /** Tick positions in meters from the origin, ascending, always starting at 0. */
    ticks: number[];
    /** Screen pixels per ground meter, used to place each tick. */
    pxPerMeter: number;
    unit: ScaleUnit;
};

const EMPTY: Scale = { ticks: [], pxPerMeter: 0, unit: 'm' };

/**
 * Picks the 1-2-5 step nearest `SCALE_BAR_TARGET_TICK_SPACING_PX` and lays as many
 * ticks as fit inside the fixed usable track width. The tick *count* varies (4-6
 * gaps) while the track never resizes; whatever is left over past the final tick
 * stays a bare baseline.
 */
export const buildScale = (metersPerPixel: number): Scale => {
    if (!(metersPerPixel > 0) || !Number.isFinite(metersPerPixel)) return EMPTY;

    const step = nearestNiceStep(SCALE_BAR_TARGET_TICK_SPACING_PX * metersPerPixel);
    if (step <= 0) return EMPTY;

    const pxPerMeter = 1 / metersPerPixel;
    const spacingPx = step * pxPerMeter;
    const gaps = Math.floor(SCALE_BAR_USABLE_WIDTH_PX / spacingPx);
    if (gaps < 1) return EMPTY;

    const ticks = Array.from({ length: gaps + 1 }, (_, index) => {
        return step * index;
    });

    return { ticks, pxPerMeter, unit: step >= SCALE_BAR_KM_THRESHOLD_M ? 'km' : 'm' };
};
