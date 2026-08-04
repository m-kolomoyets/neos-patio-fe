import type { IndicatorType } from '../../types';
import { INDICATOR_PALETTE } from '../../constants';

/** Every indicator type gets its own gradient + inner-glow filter, defined once. */
export const INDICATOR_TYPES = Object.keys(INDICATOR_PALETTE) as IndicatorType[];

/**
 * Filter-local name of the square's *silhouette*. The squares are filled with a
 * mostly-transparent radial gradient, so `SourceAlpha` is a soft blob rather than
 * the rounded rect — inverting it would leave the whole interior lit and wash the
 * square white. Saturating alpha first gives the shadows the shape they need.
 */
export const SHAPE_RESULT = 'shape';
