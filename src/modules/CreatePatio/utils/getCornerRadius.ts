import { SQUARE_CORNER_RADIUS, SQUARE_CORNER_RADIUS_BASIS } from '../constants';

/**
 * Corner radius for a square of `size` on-screen pixels. The design draws a 247px
 * square with a 28px radius, so the roundness is kept as a ratio of the side —
 * a square zoomed to fill the viewport stays as rounded as the artboard rather
 * than reading as a sharp-cornered box with a nicked edge.
 *
 * Floored at the design radius so a small (far-out) square never squares off, and
 * capped at half the side, which is the point where the shape is a circle.
 */
export const getCornerRadius = (size: number): number => {
    const scaled = size * (SQUARE_CORNER_RADIUS / SQUARE_CORNER_RADIUS_BASIS);

    return Math.min(Math.max(SQUARE_CORNER_RADIUS, scaled), size / 2);
};
