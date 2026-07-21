import type { IndicatorType } from '../types';

/**
 * The published × owned-by-connected-wallet matrix, as one pure lookup shared by
 * the SVG squares and the DOM singleton badges so both always agree (the badge
 * morphs into the square across `MORPH_BAND` — any disagreement reads as a color
 * jump mid-morph).
 *
 * |              | published              | not published              |
 * |--------------|------------------------|----------------------------|
 * | **not mine** | `owned` (green)        | `not-published` (blue)     |
 * | **mine**     | `owned-and-published`  | `owned-and-not-published`  |
 *
 * `target` (the create-mode center cursor) is not reachable from here — it is not
 * a patio.
 */
export const resolveIndicatorType = (isPublished: boolean, isMine: boolean): IndicatorType => {
    if (isMine) {
        return isPublished ? 'owned-and-published' : 'owned-and-not-published';
    }

    return isPublished ? 'owned' : 'not-published';
};
